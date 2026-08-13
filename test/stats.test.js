// Tests de GET /api/links/:codigo/stats, derivados de SPEC.md.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const http = require('node:http');

const DB_FILE = path.join(__dirname, 'fixtures', 'stats.links.json');
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

function get(pathname) {
  return new Promise((resolve, reject) => {
    http.get(`${baseUrl}${pathname}`, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

test('devuelve clicks, url y fecha de creación reales para un código existente', async () => {
  seed([{ codigo: 'abc', url: 'https://www.austral.edu.ar/', clicks: 42, creado: '2026-03-02T14:11:09.000Z' }]);
  const res = await get('/api/links/abc/stats');
  assert.equal(res.status, 200);
  const data = JSON.parse(res.body);
  assert.equal(data.codigo, 'abc');
  assert.equal(data.url, 'https://www.austral.edu.ar/');
  assert.equal(data.clicks, 42);
  assert.equal(data.creado, '2026-03-02T14:11:09.000Z');
});

test('devuelve 404 con mensaje claro si el código no existe', async () => {
  seed([]);
  const res = await get('/api/links/no-existe/stats');
  assert.equal(res.status, 404);
  const data = JSON.parse(res.body);
  assert.ok(data.error, 'la respuesta 404 debería traer un mensaje de error');
});

test('consultar las stats NO cuenta como un click', async () => {
  seed([{ codigo: 'abc', url: 'https://www.austral.edu.ar/', clicks: 5, creado: new Date().toISOString() }]);
  await get('/api/links/abc/stats');
  await get('/api/links/abc/stats');
  const links = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  assert.equal(links.find((l) => l.codigo === 'abc').clicks, 5);
});
