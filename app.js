const express = require('express');
const utils = require('./utils');
const db = require('./db');

const app = express();
app.use(express.json());
app.use(express.static('public'));

function esUrlValida(valor) {
  if (typeof valor !== 'string' || valor.trim() === '') {
    return false;
  }
  try {
    const parsed = new URL(valor);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// genera un código que todavía no esté en uso por otro link
async function generarCodigoUnico() {
  const links = await db.todosLosLinks();
  let codigo;
  do {
    codigo = utils.generarCodigo();
  } while (links.some(function (l) { return l.codigo === codigo; }));
  return codigo;
}

// las rutas son async (el backend de Postgres hace queries de red); esta
// envoltura manda cualquier rechazo al error handler en vez de colgar la
// request o tirar abajo el proceso con un unhandled rejection.
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// crear un link corto
app.post('/api/links', asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Falta la url' });
  }
  if (!esUrlValida(url)) {
    return res.status(400).json({ error: 'URL inválida' });
  }
  const codigo = await generarCodigoUnico();
  const nuevo = {
    codigo: codigo,
    url: url,
    clicks: 0,
    creado: new Date().toISOString()
  };
  await db.crearLink(nuevo);
  res.json({ codigo: codigo, corta: '/' + codigo });
}));

// estadísticas de un link: clicks, url original y fecha de creación
app.get('/api/links/:codigo/stats', asyncHandler(async (req, res) => {
  const link = await db.buscarPorCodigo(req.params.codigo);
  if (!link) {
    return res.status(404).json({ error: 'No existe ese link' });
  }
  res.json({
    codigo: link.codigo,
    url: link.url,
    clicks: link.clicks,
    creado: link.creado
  });
}));

// redirigir al destino
app.get('/:codigo', asyncHandler(async (req, res) => {
  const link = await db.incrementarClick(req.params.codigo);
  if (!link) {
    return res.status(404).send('No existe ese link');
  }
  res.redirect(link.url);
}));

// último recurso: un error inesperado (ej. la base caída) no debe tirar
// abajo el proceso ni colgar la request.
app.use(function (err, req, res, next) {
  console.error(err);
  res.status(500).json({ error: 'Error interno' });
});

module.exports = { app };
