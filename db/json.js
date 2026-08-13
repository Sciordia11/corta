// Backend de storage sobre un archivo JSON. Es el que usan npm start en
// local y toda la batería de tests — no requiere nada instalado aparte
// de Node. Se usa cuando no hay DATABASE_URL en el entorno.
const fs = require('fs');
const path = require('path');

const DB_FILE = process.env.LINKS_DB_FILE
  ? path.resolve(process.env.LINKS_DB_FILE)
  : path.join(__dirname, '..', 'links.json');

function leer() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function guardar(links) {
  fs.writeFileSync(DB_FILE, JSON.stringify(links, null, 2));
}

async function todosLosLinks() {
  return leer();
}

async function buscarPorCodigo(codigo) {
  const links = leer();
  return links.find(function (l) { return l.codigo === codigo; }) || null;
}

async function crearLink(link) {
  const links = leer();
  links.push(link);
  guardar(links);
}

async function incrementarClick(codigo) {
  const links = leer();
  const link = links.find(function (l) { return l.codigo === codigo; });
  if (!link) {
    return null;
  }
  link.clicks += 1;
  guardar(links);
  return link;
}

module.exports = { todosLosLinks, buscarPorCodigo, crearLink, incrementarClick, __backend: 'json' };
