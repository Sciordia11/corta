// Tests de GET /:codigo, derivados de SPEC.md.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const http = require('node:http');

const DB_FILE = path.join(__dirname, 'fixtures', 'redirigir.links.json');
process.env.LINKS_DB_FILE = DB_FILE;

const { app } = require('../app');

let server;
let baseUrl;

before(async () => {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(DB_FILE, { force: true });
});

function seed(links) {
  fs.writeFileSync(DB_FILE, JSON.stringify(links, null, 2));
}

// http.get nativo: a diferencia de fetch, no sigue redirects solo,
// así podemos inspeccionar el 302 y el header Location tal cual los manda el server.
function get(pathname) {
  return new Promise((resolve, reject) => {
    http.get(`${baseUrl}${pathname}`, (res) => {
      res.resume();
      res.on('end', () => resolve(res));
    }).on('error', reject);
  });
}

test('redirige (302) a la url original cuando el código existe', async () => {
  seed([{ codigo: 'abc', url: 'https://www.austral.edu.ar/', clicks: 0, creado: new Date().toISOString() }]);
  const res = await get('/abc');
  assert.equal(res.statusCode, 302);
  assert.equal(res.headers.location, 'https://www.austral.edu.ar/');
});

test('cada visita incrementa clicks y lo persiste en el archivo', async () => {
  seed([{ codigo: 'abc', url: 'https://www.austral.edu.ar/', clicks: 0, creado: new Date().toISOString() }]);
  await get('/abc');
  await get('/abc');
  const links = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  assert.equal(links.find((l) => l.codigo === 'abc').clicks, 2);
});

test('devuelve 404 si el código no existe, sin romper el servidor', async () => {
  seed([]);
  const res = await get('/no-existe');
  assert.equal(res.statusCode, 404);
});

test('una visita a un código inexistente no incrementa clicks de otros links', async () => {
  seed([{ codigo: 'abc', url: 'https://www.austral.edu.ar/', clicks: 5, creado: new Date().toISOString() }]);
  await get('/zzz');
  const links = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  assert.equal(links.find((l) => l.codigo === 'abc').clicks, 5);
});
