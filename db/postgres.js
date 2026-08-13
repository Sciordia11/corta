// Backend de storage sobre PostgreSQL. Se usa cuando DATABASE_URL está
// seteada en el entorno — así es como Railway conecta un servicio con
// una base de datos que provisionó (ver DATABASE_URL en las variables
// del servicio). Mismo contrato que db/json.js.
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

let migracion = null;
function asegurarTabla() {
  if (!migracion) {
    migracion = pool.query(
      `CREATE TABLE IF NOT EXISTS links (
        codigo TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        clicks INTEGER NOT NULL DEFAULT 0,
        creado TIMESTAMPTZ NOT NULL
      )`
    );
  }
  return migracion;
}

function aFila(row) {
  return {
    codigo: row.codigo,
    url: row.url,
    clicks: row.clicks,
    creado: row.creado.toISOString()
  };
}

async function todosLosLinks() {
  await asegurarTabla();
  const { rows } = await pool.query('SELECT codigo, url, clicks, creado FROM links');
  return rows.map(aFila);
}

async function buscarPorCodigo(codigo) {
  await asegurarTabla();
  const { rows } = await pool.query('SELECT codigo, url, clicks, creado FROM links WHERE codigo = $1', [codigo]);
  return rows[0] ? aFila(rows[0]) : null;
}

async function crearLink(link) {
  await asegurarTabla();
  await pool.query(
    'INSERT INTO links (codigo, url, clicks, creado) VALUES ($1, $2, $3, $4)',
    [link.codigo, link.url, link.clicks, link.creado]
  );
}

async function incrementarClick(codigo) {
  await asegurarTabla();
  const { rows } = await pool.query(
    'UPDATE links SET clicks = clicks + 1 WHERE codigo = $1 RETURNING codigo, url, clicks, creado',
    [codigo]
  );
  return rows[0] ? aFila(rows[0]) : null;
}

module.exports = { todosLosLinks, buscarPorCodigo, crearLink, incrementarClick, __backend: 'postgres' };
