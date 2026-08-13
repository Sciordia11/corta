// Tests de POST /api/links, derivados de SPEC.md.
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'fixtures', 'crear-link.links.json');
process.env.LINKS_DB_FILE = DB_FILE;

const { app } = require('../app');
const utils = require('../utils');

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

beforeEach(() => {
  fs.writeFileSync(DB_FILE, '[]');
});

function crearLink(url) {
  return fetch(`${baseUrl}/api/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
}

test('crea un link con url válida y devuelve un código de 3 caracteres', async () => {
  const res = await crearLink('https://www.austral.edu.ar');
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.match(data.codigo, /^[a-z0-9]{3}$/);
  assert.equal(data.corta, '/' + data.codigo);
});

test('persiste el link con clicks en 0 y fecha de creación válida', async () => {
  await crearLink('https://www.austral.edu.ar');
  const links = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  assert.equal(links.length, 1);
  assert.equal(links[0].clicks, 0);
  assert.ok(!Number.isNaN(Date.parse(links[0].creado)));
});

test('rechaza con 400 si falta la url, y no crea nada', async () => {
  const res = await crearLink(undefined);
  assert.equal(res.status, 400);
  const links = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  assert.equal(links.length, 0);
});

test('rechaza con 400 una url con formato inválido, y no crea nada', async () => {
  const res = await crearLink('esto-no-es-una-url');
  assert.equal(res.status, 400);
  const links = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  assert.equal(links.length, 0);
});

test('nunca asigna el mismo código a dos links distintos (colisión detectada y resuelta)', async () => {
  const original = utils.generarCodigo;
  const secuencia = ['aaa', 'aaa', 'bbb']; // 2do intento "quiere" reusar aaa, debe reintentar y caer en bbb
  let i = 0;
  utils.generarCodigo = () => secuencia[i++];

  try {
    const r1 = await crearLink('https://uno.com');
    const d1 = await r1.json();

    const r2 = await crearLink('https://dos.com');
    const d2 = await r2.json();

    assert.notEqual(d1.codigo, d2.codigo, 'dos links distintos terminaron con el mismo código');
    assert.equal(d2.codigo, 'bbb', 'no reintentó tras detectar la colisión con "aaa"');
  } finally {
    utils.generarCodigo = original;
  }
});
