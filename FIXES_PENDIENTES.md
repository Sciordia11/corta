# Fixes pendientes

Hallazgos de un review del estado del código contra `mission.md`/`SPEC.md` (2026-08-19). Ninguno bloquea la entrega — los 5 milestones están cumplidos y los tests pasan — pero quedan anotados acá para no perderlos.

## Bugs de código

### 1. Self-XSS en el historial local (`public/index.html:112`)

`esUrlValida` (en `server.js`) valida la URL parseándola con `new URL()`, pero el servidor persiste el **string original** que mandó el cliente, no la versión normalizada de `new URL().toString()`. Un valor como:

```
https://x.com/"><img src=x onerror=alert(1)>
```

pasa la validación (protocolo `https:` válido) y se guarda tal cual. `public/index.html:112` lo inyecta en el DOM del historial vía `innerHTML` sin escapar:

```js
li.innerHTML = `
  ...
  <span class="historial-url" title="${item.url}">${item.url}</span>
  ...
`;
```

Impacto acotado: el historial vive en el `localStorage` del propio navegador de quien creó el link, así que es self-XSS (afecta solo a quien pegó la URL maliciosa), no a terceros — `stats.html` expone el mismo `url` pero vía `.textContent` (línea 81), que sí es seguro.

**Fix sugerido:** construir el `<li>` con `textContent`/`createElement` en vez de interpolar `item.url` en un template string, igual que ya hace `stats.html`.

### 2. El frontend no muestra el error real de `POST /api/links` (`public/index.html:145`)

Cuando el backend responde `400` con `{ error: "Falta la url" }` o `{ error: "URL inválida" }`, el frontend descarta ese body y muestra un toast genérico ("No se pudo acortar ese link"), sin decirle al usuario qué está mal.

**Fix sugerido:** leer `(await res.json()).error` y pasarlo a `mostrarToast(...)` en vez del string fijo.

## Documentación / extras de `mission.md`

### 3. Falta la skill `/collect-memory`

`mission.md` (sección "Extra: la memoria del agente") pide una skill que, invocada al cerrar cada sesión, actualice `CLAUDE.md`/memoria con avances y preferencias del equipo. No existe en `.claude/skills/` — solo está `reporte-cambios` (el otro extra, de trabajo en equipo, que sí está hecho). Sin esta skill, `CLAUDE.md` se actualiza a mano cuando alguien nota que quedó desalineado (como pasó acá).

### 4. (Resuelto en este mismo review) `CLAUDE.md` describía el estado original del proyecto

`CLAUDE.md` seguía documentando los bugs de Milestone 3 (sin redirect real, sin chequeo de colisión de códigos) y la ausencia de `.gitignore` como si fueran el estado actual, cuando ya estaban corregidos desde hace varios commits. Se actualizó junto con este archivo — dejar la nota acá como recordatorio de que sin `/collect-memory` (punto 3) este tipo de desfase puede repetirse.
