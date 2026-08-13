# Corta

Acortador de URLs interno de la empresa.

## Qué hace

- Acortá una URL larga y obtené un código corto (`/api/links`).
- Entrá al link corto (`/:codigo`) y te redirige a la URL original.
- Consultá estadísticas de un link (clicks, URL, fecha de creación) en `stats.html`.

## Correr el proyecto en local

Requisitos: Node.js instalado.

```bash
npm install
npm start
```

La app queda en `http://localhost:3000`.

## Estructura

```
server.js          servidor Express: rutas y lógica de la app
utils.js           generación de códigos cortos
links.json         "base de datos" de links (archivo JSON)
public/            frontend estático (index.html, stats.html, estilos, logo)
test.js            smoke-test manual: node test.js (requiere el server levantado)
```

## Estado

Proyecto heredado de un desarrollador anterior sin documentación. Se está llevando a producción de forma incremental: ver el historial de commits para el proceso de orden y corrección. Próximo paso: `SPEC.md` con el contrato detallado del sistema.
