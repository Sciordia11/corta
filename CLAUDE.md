# CLAUDE.md — contexto del proyecto Corta

Este archivo le da contexto a Claude Code al arrancar una sesión nueva en este repo, para no tener que re-explicar todo desde cero. Se lee solo, automáticamente, al empezar una sesión acá — no depende de ninguna skill.

## Qué es esto

Corta es un acortador de URLs interno, heredado de un desarrollador anterior sin documentación. La consigna completa de la misión académica está en `mission.md` (en la raíz). Express server con nombres de variables/comentarios en español.

## Estado: Milestones 1 a 5 completos

- **M1** — Repo propio creado (`https://github.com/Sciordia11/corta`), commit inicial con la carpeta tal cual se recibió (incluyendo `node_modules`, decisión explícita del usuario: preferir fidelidad total al estado original antes que prolijidad).
- **M2** — Repo ordenado: sin duplicados/dead code (`index_v2_FINAL.js`, `server_OLD.js`, `links_backup_marzo.json`, `notas.txt`, `test.js` raíz, `public/estilos_viejos.css` eliminados), `node_modules` dejó de trackearse (queda en el commit inicial, no en los siguientes), dependencias sin uso eliminadas, `README.md`.
- **`SPEC.md`** — contrato de comportamiento escrito antes de tocar bugs, con los casos borde explícitos (colisión de códigos, URLs inválidas, links inexistentes, qué significa que las estadísticas digan la verdad).
- **M3** — 4 bugs corregidos con TDD real (tests en rojo commiteados en un commit, el fix en otro): redirect real (antes mostraba la URL como texto), clicks persistidos (antes se perdían), códigos únicos (antes podían colisionar), validación de formato de URL.
- **M4** — `GET /api/links/:codigo/stats` implementado, `public/stats.html` conectado de verdad (antes tenía datos maqueados hardcodeados).
- **M5** — Desplegado en Railway: **https://corta-production-22b8.up.railway.app**. Storage abstraído (JSON en local/tests sin cambios, Postgres en producción vía `DATABASE_URL`). Persistencia verificada contra un redeploy real: un link creado antes sobrevivió con sus clicks intactos.
- Fix post-deploy: overflow de URLs largas en `stats.html` (bug de flexbox, `min-width:0` + `overflow-wrap`).

## Arquitectura

- **Storage**: `storage.js` abstrae dos backends según `DATABASE_URL`. Sin ella (local/tests): `links.json` en la raíz del repo, leído/escrito sincrónicamente (`fs.readFileSync`/`writeFileSync`) en cada request — sin locking, así que escrituras concurrentes al archivo pueden pisarse (ver `SPEC.md`, limitación aceptada). Con `DATABASE_URL` seteada (producción, Railway): tabla `links` en Postgres; `incrementarClicks` usa un `UPDATE ... SET clicks = clicks + 1` atómico, así que esa carrera no aplica ahí. Esto también es lo que hace que links/clicks sobrevivan a un redeploy — el filesystem del container no persiste, la base sí.
- **Rutas** (en `server.js`): `POST /api/links` valida la url (`esUrlValida`: debe parsear con `new URL()` y ser `http:`/`https:`) y crea un link corto (`{ codigo, url, clicks, creado }`, código generado en `utils.js`); `GET /:codigo` busca el código, incrementa `clicks`, y emite un `302` real (`res.redirect`); `GET /api/links/:codigo/stats` devuelve `{ codigo, url, clicks, creado }` de solo lectura (no incrementa `clicks`).
- **Generación de códigos**: `generarCodigoUnico()` en `utils.js` recibe la lista de códigos existentes y regenera hasta encontrar uno libre — una colisión no puede pisar ni tapar un link silenciosamente.
- **Frontend**: archivos estáticos servidos desde `public/` vía `express.static`. `index.html` es el formulario de acortado más un historial de links por navegador (`localStorage`, no server-side). `stats.html` llama a `GET /api/links/:codigo/stats` y renderiza datos reales.
- **Tests**: `tests/*.test.js` (`node --test`, corrido vía `npm test`) es la suite real, usando `tests/helpers.js`'s `levantarServer()` para levantar la app contra un `links.json` temporal aislado por test.

## Pendiente

Los 4 fixes de un review de código anterior (`FIXES_PENDIENTES.md`) ya se resolvieron el 2026-08-19, al mergear este branch con el `main` del repo individual: self-XSS en el historial, error real de `POST /api/links` sin mostrar, la skill `/collect-memory` faltante, y este archivo desalineado. No queda nada abierto de ese review.

- **Extra: trabajo en equipo** — invitar colaboradores de GitHub del resto del grupo, y que cada uno deje una tarea programada con reporte de cambios del repo. Ya hecho por al menos un integrante: skill `reporte-cambios` (`.claude/skills/reporte-cambios/SKILL.md`), que actualiza el repo local desde su remoto y escribe un reporte de commits nuevos (autor, archivos tocados) a `reportes/` (gitignored). Pensada para correr desatendida desde un cron: si hay cambios sin commitear o la rama divergió, se frena y reporta en vez de forzar nada (sin stash/reset/merge).
- **Extra: memoria del agente** — skill `/collect-memory` (`.claude/skills/collect-memory/SKILL.md`) ya construida; falta empezar a invocarla de verdad al cerrar cada sesión (el criterio de éxito de `mission.md` es que el historial de git de este archivo muestre sus actualizaciones).

## Decisiones y contexto que no salen de leer el código

- **Auth de GitHub**: el MCP usa un fine-grained PAT guardado en `~/.claude.json` (`mcpServers.github.headers.Authorization`). Los pushes se hacen con `git push` nativo (no con `push_files` del MCP — inviable para miles de archivos de `node_modules`), pasando ese token por `http.extraHeader` con Basic auth en el momento del push; no queda persistido en `.git/config`. **Nunca imprimir el token completo en la salida** (ya pasó una vez sin querer).
- **Remotos**: `origin` es el repo individual (`Sciordia11/corta`); `group` es el repo compartido del equipo (`lucasmonteverdi1/corta`), con el trabajo del resto de los integrantes (incluye la skill `reporte-cambios`, tests, `storage.js`, docs de entrega).
- **Railway** — IDs para no tener que rebuscarlos:
  - Proyecto `corta`: `ef6e5dcc-2365-4d40-8932-6e8e6dd5bb02`
  - Servicio app `corta`: `3dddda16-8532-48fa-8021-6b379f02a076`
  - Servicio `Postgres`: `a964a56d-3558-4465-8cf7-5946096c8306`
  - Environment `production`: `e8af42eb-e641-4827-bb63-e3671a42dda9`
- **Auto-deploy on push: activo (arreglado 2026-08-14).** El síntoma no era la falta de la GitHub App sino un desfasaje: el servicio en Railway tenía guardada la referencia a `Sciordia11/corta` de cuando se conectó por MCP, pero la GitHub App no tenía permiso real sobre ese repo — el dashboard mostraba a la vez "Branch connected to production" y "GitHub Repo not found". Se resolvió instalando/autorizando la GitHub App de Railway en `github.com/settings/installations` (acceso a todos los repos) y reconectando el source del servicio desde el dashboard (Settings → Source → Disconnect → Connect Repo de nuevo, para que Railway abandone la referencia vieja). Confirmado con un push de prueba real (commit `ba3e2b6`, README) que disparó un deploy solo en ~4 minutos sin tocar el MCP. Ya no hace falta pedirle a `railway-agent` que redespliegue el commit más reciente a mano después de cada push.
- **Storage**: la tabla de producción arranca vacía a propósito — los 8 links de `links.json` son datos de ejemplo del dev anterior, no se migraron.
- **Preferencias observadas del usuario en esta misión**: TDD estricto y literal (tests que fallan primero, commit propio; fix después, commit propio); mensajes de commit largos explicando el porqué, no solo el qué; toda la comunicación (respuestas, mensajes de commit, docs) en español.
