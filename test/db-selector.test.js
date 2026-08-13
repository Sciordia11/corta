// El módulo db/ elige backend según DATABASE_URL: Postgres en producción
// (Railway la inyecta al enlazar el servicio), JSON en local/tests.
const { test } = require('node:test');
const assert = require('node:assert/strict');

function requireFresh(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

test('usa el backend Postgres cuando DATABASE_URL está seteada', () => {
  const original = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
  try {
    const db = requireFresh('../db');
    assert.equal(db.__backend, 'postgres');
  } finally {
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
    delete require.cache[require.resolve('../db')];
  }
});

test('usa el backend JSON cuando no hay DATABASE_URL', () => {
  const original = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    const db = requireFresh('../db');
    assert.equal(db.__backend, 'json');
  } finally {
    if (original !== undefined) process.env.DATABASE_URL = original;
    delete require.cache[require.resolve('../db')];
  }
});
