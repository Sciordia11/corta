# Corta

Acortador de URLs interno de la empresa.

**En producción:** https://corta-production-22b8.up.railway.app

## Qué hace

- Acortá una URL larga y obtené un código corto (`/api/links`).
- Entrá al link corto (`/:codigo`) y te redirige a la URL original.
- Consultá estadísticas de un link (clicks, URL, fecha de creación) en `stats.html`.

Ver [`SPEC.md`](./SPEC.md) para el contrato detallado de cada endpoint y los casos borde.

## Correr el proyecto en local

Requisitos: Node.js instalado.

```bash
npm install
npm start
```

La app queda en `http://localhost:3000`.

## Estructura

```
server.js          levanta el proceso en el puerto 3000
app.js              la app de Express: rutas y lógica (sin levantar el server)
utils.js           generación de códigos cortos
links.json         "base de datos" de links (archivo JSON)
public/            frontend estático (index.html, stats.html, estilos, logo)
test/              batería de tests automatizados (node --test)
```

## Correr los tests

```bash
npm test
```

Usa el test runner nativo de Node (`node --test`), sin dependencias extra. Cada archivo de test levanta la app en un puerto efímero y usa un `links.json` temporal, así que no toca los datos de ejemplo del repo.

## Producción

Desplegado en Railway: un servicio para la app (Node/Express, deploy directo desde este repo) y un servicio de PostgreSQL aparte. En local y en los tests se sigue usando `links.json`; en producción, `db/index.js` cambia automáticamente al backend de Postgres apenas detecta la variable `DATABASE_URL` (Railway la inyecta sola al enlazar los dos servicios). Los links y sus clicks sobreviven a un redeploy.

## Estado

Proyecto heredado de un desarrollador anterior sin documentación. Ya en producción: ver `SPEC.md` para el contrato del sistema y el historial de commits para el proceso de orden, corrección y despliegue.

Auto-deploy desde GitHub activado: cada push a `main` dispara un deploy solo en Railway (confirmado con un commit de prueba el 14-08-2026).
