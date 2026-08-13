# SPEC — Corta

Contrato de comportamiento de Corta: qué tiene que hacer cada endpoint, qué pasa en los casos borde, y qué significa que "las estadísticas dicen la verdad".

Este documento describe el comportamiento **esperado** (correcto), no necesariamente el actual — es la referencia contra la que se escriben los tests y contra la que se corrige el código heredado. Se actualiza cada vez que el entendimiento del proyecto cambia.

## Modelo de datos

Un **link** tiene:

| Campo    | Tipo               | Descripción |
|----------|--------------------|-------------|
| `codigo` | string, 3 caracteres, `[a-z0-9]` | Identificador corto, único en todo el sistema |
| `url`    | string (URL absoluta) | Destino al que redirige |
| `clicks` | entero >= 0        | Cantidad de veces que alguien accedió a `/:codigo` y fue redirigido con éxito |
| `creado` | string, ISO 8601 (UTC) | Momento de creación del link |

En desarrollo local persiste en `links.json`. En producción (Milestone 5) pasa a una base de datos real — el contrato de comportamiento de esta página no cambia, solo el almacenamiento.

## Endpoints

### `POST /api/links` — crear un link corto

**Request:** `{ "url": "<string>" }`

**Éxito:** `200` con `{ "codigo": "<string>", "corta": "/<codigo>" }`. Efecto secundario: se crea y persiste un nuevo link con `clicks: 0` y `creado` = timestamp ISO del momento de creación.

**Validación de `url` (caso borde: URLs inválidas):**
- Falta el campo, es vacío, o no es un string → `400 { "error": "Falta la url" }`, no se crea nada.
- El valor no es una URL absoluta válida (falla al parsear con `new URL(...)`, o el protocolo no es `http:`/`https:`) → `400 { "error": "URL inválida" }`, no se crea nada.
- No hace falta que la URL de destino exista o responda — solo que tenga forma de URL válida.

**Generación de código (caso borde: dos URLs reciben el mismo código):**
- El código es de 3 caracteres alfanuméricos en minúscula (36³ = 46.656 combinaciones posibles).
- Antes de asignar un código nuevo, el sistema **tiene que verificar que no exista ya** entre los links guardados. Si hay colisión, se genera otro código y se reintenta hasta encontrar uno libre.
- Consecuencia: nunca puede haber dos links distintos con el mismo `codigo`. La respuesta es "nada malo, lo arreglamos" — el usuario ni se entera de que hubo una colisión interna.

### `GET /:codigo` — redirigir al destino

**Si el código existe:**
- Responde con un **redirect HTTP (302)** a `link.url` — el navegador tiene que terminar en la URL de destino, no ver la URL como texto.
- Incrementa `clicks` en 1 **y lo persiste** antes de responder. Un click que no se guarda no cuenta como que pasó.

**Si el código no existe:** `404` con un mensaje de error claro (ej. `"No existe ese link"`). No rompe el servidor, no hay excepción sin manejar.

**Casos que NO cuentan como click:** una request a un código inexistente no incrementa nada. Una consulta al endpoint de stats (`GET /api/links/:codigo/stats`) tampoco incrementa `clicks` — solo lo hace un acceso real a `/:codigo` que efectivamente redirige.

### `GET /api/links/:codigo/stats` — estadísticas de un link

*(Pendiente de implementar — Milestone 4. Documentado acá porque es parte del contrato del producto.)*

**Si el código existe:** `200` con `{ "codigo", "url", "clicks", "creado" }` — los valores reales guardados, no datos de ejemplo.

**Si el código no existe:** `404` con un mensaje de error claro. `public/stats.html` tiene que mostrar ese caso de forma legible (no una pantalla en blanco ni un crash del `fetch`).

**"Las estadísticas dicen la verdad" significa:** el número de `clicks` que se muestra es exactamente la cantidad de redirects exitosos que sirvió `/:codigo` para ese código — ni más (clicks fantasma por incrementos no atados a una visita real) ni menos (clicks que pasaron pero no se guardaron, como pasa hoy en el código heredado).

## Casos borde — resumen

| Caso | Comportamiento esperado |
|---|---|
| Dos URLs generan el mismo código al azar | Se detecta antes de guardar, se reintenta con otro código. Nunca dos links comparten `codigo`. |
| `url` ausente, vacía o no-string | `400`, no se crea el link. |
| `url` con formato inválido (no parsea como URL absoluta http/https) | `400`, no se crea el link. |
| `GET /:codigo` con código inexistente | `404`, sin romper el servidor. |
| `GET /api/links/:codigo/stats` con código inexistente | `404`, `stats.html` lo muestra de forma clara. |
| Click en un link que existe | Redirect 302 real + `clicks` persistido, no solo en memoria. |

## Persistencia entre despliegues

Los links y sus clicks tienen que sobrevivir a un restart del proceso y a un redeploy en producción (Milestone 5). Esto excluye guardar el estado solo en memoria del proceso Node — tiene que quedar en disco (`links.json` en local) o en una base de datos real (producción).

## Fuera de alcance (por ahora)

- Códigos personalizados (ej. `/mi-promo`) — quedó anotado como idea a futuro por el dev anterior, no forma parte del contrato actual.
- Expiración de links.
- Autenticación / control de quién puede crear links (Corta es de uso interno de la empresa, sin login por ahora).
