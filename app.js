const express = require('express');
const fs = require('fs');
const path = require('path');
const utils = require('./utils');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const DB_FILE = process.env.LINKS_DB_FILE
  ? path.resolve(process.env.LINKS_DB_FILE)
  : path.join(__dirname, 'links.json');

function leerLinks() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function guardarLinks(links) {
  fs.writeFileSync(DB_FILE, JSON.stringify(links, null, 2));
}

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
function generarCodigoUnico(links) {
  let codigo;
  do {
    codigo = utils.generarCodigo();
  } while (links.some(function (l) { return l.codigo === codigo; }));
  return codigo;
}

// crear un link corto
app.post('/api/links', (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Falta la url' });
  }
  if (!esUrlValida(url)) {
    return res.status(400).json({ error: 'URL inválida' });
  }
  const links = leerLinks();
  const codigo = generarCodigoUnico(links);
  const nuevo = {
    codigo: codigo,
    url: url,
    clicks: 0,
    creado: new Date().toISOString()
  };
  links.push(nuevo);
  guardarLinks(links);
  res.json({ codigo: codigo, corta: '/' + codigo });
});

// estadísticas de un link: clicks, url original y fecha de creación
app.get('/api/links/:codigo/stats', (req, res) => {
  const links = leerLinks();
  const link = links.find(function (l) { return l.codigo === req.params.codigo; });
  if (!link) {
    return res.status(404).json({ error: 'No existe ese link' });
  }
  res.json({
    codigo: link.codigo,
    url: link.url,
    clicks: link.clicks,
    creado: link.creado
  });
});

// redirigir al destino
app.get('/:codigo', (req, res) => {
  const links = leerLinks();
  const link = links.find(function (l) { return l.codigo === req.params.codigo; });
  if (!link) {
    return res.status(404).send('No existe ese link');
  }
  link.clicks = link.clicks + 1;
  guardarLinks(links);
  res.redirect(link.url);
});

module.exports = { app, DB_FILE };
