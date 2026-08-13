# CLAUDE.md — contexto del proyecto Corta

Este archivo le da contexto a Claude Code al arrancar una sesión nueva en este repo, para no tener que re-explicar todo desde cero. Se lee solo, automáticamente, al empezar una sesión acá — no depende de ninguna skill.

## Qué es esto

Corta es un acortador de URLs interno, heredado de un desarrollador anterior sin documentación. La consigna completa de la misión académica está en `mission.md` (en la raíz, **sin trackear en git a propósito** — es la letra de la cátedra, no parte del producto).

## Estado: Milestones 1 a 5 completos

- **M1** — Repo propio creado (`https://github.com/Sciordia11/corta`), commit inicial con la carpeta tal cual se recibió (incluyendo `node_modules`, decisión explícita del usuario: preferir fidelidad total al estado original antes que prolijidad).
- **M2** — Repo ordenado: sin duplicados/dead code, `node_modules` dejó de trackearse (queda en el commit inicial, no en los siguientes), dependencias sin uso eliminadas, `README.md`.
- **`SPEC.md`** — contrato de comportamiento escrito antes de tocar bugs, con los casos borde explícitos (colisión de códigos, URLs inválidas, links inexistentes, qué significa que las estadísticas digan la verdad).
- **M3** — 4 bugs corregidos con TDD real (tests en rojo commiteados en un commit, el fix en otro): redirect real (antes mostraba la URL como texto), clicks persistidos (antes se perdían), códigos únicos (antes podían colisionar), validación de formato de URL.
- **M4** — `GET /api/links/:codigo/stats` implementado, `public/stats.html` conectado de verdad (antes tenía datos maqueados hardcodeados).
- **M5** — Desplegado en Railway: **https://corta-production-22b8.up.railway.app**. Storage abstraído en `db/` (JSON en local/tests sin cambios, Postgres en producción vía `DATABASE_URL`). Persistencia verificada contra un redeploy real: un link creado antes sobrevivió con sus clicks intactos.
- Fix post-deploy: overflow de URLs largas en `stats.html` (bug de flexbox, `min-width:0` + `overflow-wrap`).

## Pendiente (el usuario decidió dejarlo para otra sesión)

- **Extra: trabajo en equipo** — invitar colaboradores de GitHub del resto del grupo (necesita sus usuarios de GitHub), y que cada uno deje una tarea programada con reporte de cambios del repo.
- **Extra: memoria del agente** — construir la skill `/collect-memory` que automatice la actualización de este archivo al cerrar cada sesión. Por ahora este archivo se escribió a mano.

## Decisiones y contexto que no salen de leer el código

- **Auth de GitHub**: el MCP usa un fine-grained PAT guardado en `~/.claude.json` (`mcpServers.github.headers.Authorization`). Los pushes se hacen con `git push` nativo (no con `push_files` del MCP — inviable para miles de archivos de `node_modules`), pasando ese token por `http.extraHeader` con Basic auth en el momento del push; no queda persistido en `.git/config`. **Nunca imprimir el token completo en la salida** (ya pasó una vez sin querer).
- **Railway** — IDs para no tener que rebuscarlos:
  - Proyecto `corta`: `ef6e5dcc-2365-4d40-8932-6e8e6dd5bb02`
  - Servicio app `corta`: `3dddda16-8532-48fa-8021-6b379f02a076`
  - Servicio `Postgres`: `a964a56d-3558-4465-8cf7-5946096c8306`
  - Environment `production`: `e8af42eb-e641-4827-bb63-e3671a42dda9`
- **⚠️ Auto-deploy on push está OFF.** El repo es público y no tiene instalada la GitHub App de Railway (se conectó el servicio por MCP, no por el dashboard). Cada push a `main` necesita un redeploy manual — el tool `redeploy` del MCP solo re-despliega el último snapshot ya construido, **no** trae el commit nuevo; hay que usar `railway-agent` pidiéndole explícitamente que despliegue el commit más reciente. Arreglo de raíz pendiente: dashboard de Railway → servicio `corta` → Settings → GitHub → instalar la app.
- **Storage**: `db/index.js` elige backend según `DATABASE_URL` (Postgres si está seteada, JSON si no). La tabla de producción arranca vacía a propósito — los 8 links de `links.json` son datos de ejemplo del dev anterior, no se migraron.
- **Preferencias observadas del usuario en esta misión**: TDD estricto y literal (tests que fallan primero, commit propio; fix después, commit propio); mensajes de commit largos explicando el porqué, no solo el qué; toda la comunicación (respuestas, mensajes de commit, docs) en español.
