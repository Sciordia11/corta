---
name: reporte-cambios
description: Actualiza la copia local del repo desde el remote y genera un reporte de los commits nuevos que entraron (quién, qué mensaje, qué archivos tocó). Es la "tarea programada" del extra de trabajo en equipo de mission.md — se usa tanto invocada a mano como disparada por una tarea programada (cron) en la máquina de cada integrante.
tools: Bash, Write
---

# Reporte de cambios del repo

Implementa el punto 2 del extra "trabajo en equipo" de `mission.md`: cada integrante deja una tarea programada que (a) actualiza su copia local del repo desde el remote y (b) genera un reporte de los cambios reales que entraron (commits nuevos, de quién, qué archivos tocaron).

Esta skill es no interactiva: pensada para dispararse sola sin que haya nadie mirando, así que nunca debe quedar esperando confirmación del usuario. Si algo requiere una decisión humana (conflictos, cambios sin commitear), reporta el problema y termina — no intenta resolverlo por su cuenta.

## Pasos

1. **Chequear que no haya cambios sin commitear.** Correr `git status --porcelain`. Si hay algo, no seguir: informar qué archivos están sucios y terminar. Nunca hacer `stash`, `reset` ni `checkout` para "limpiar" el camino — eso es trabajo en progreso de la persona dueña de esa máquina.
2. **Identificar branch y upstream actuales.**
   ```
   git rev-parse --abbrev-ref HEAD
   git rev-parse --abbrev-ref --symbolic-full-name @{u}
   ```
   Si el branch actual no tiene upstream configurado, informar eso y terminar (no hay de dónde actualizar).
3. **Guardar el commit de partida:** `antes=$(git rev-parse HEAD)`.
4. **Actualizar desde el remote:**
   ```
   git fetch
   git pull --ff-only
   ```
   Si `--ff-only` falla (el branch divergió), no forzar nada (nada de `merge`, `rebase` ni `reset --hard`): informar que hace falta intervención manual y terminar.
5. **Guardar el commit de llegada:** `despues=$(git rev-parse HEAD)`.
6. **Si `antes` es igual a `despues`:** no entraron cambios nuevos. Decirlo brevemente y terminar — no generar un archivo de reporte vacío.
7. **Si hay commits nuevos, armar el reporte:**
   - Lista de commits con autor, fecha y mensaje:
     ```
     git log --pretty=format:'- `%h` **%an** — %ad: %s' --date=short antes..despues
     ```
   - Archivos tocados por cada commit (repetir por cada hash del rango):
     ```
     git show --stat --pretty=format: <hash>
     ```
8. **Guardar el reporte** en `reportes/reporte-<fecha-hora>.md` dentro del repo (crear la carpeta si no existe) siguiendo el formato de abajo, y mostrar el mismo contenido en la conversación.

## Formato del reporte

```md
# Reporte de cambios — <fecha y hora>

Branch: <branch> (`<antes>` → `<despues>`)

## Commits nuevos (<cantidad>)

- `<hash>` **<autor>** — <fecha>: <mensaje>
  Archivos: <archivo1>, <archivo2>, ...

- `<hash>` **<autor>** — <fecha>: <mensaje>
  Archivos: <archivo1>
```

## Notas

- Los reportes son un artefacto local de cada integrante corriendo su propia tarea programada — no se commitean. La carpeta `reportes/` tiene que estar en `.gitignore`.
- Esta skill no pushea ni modifica nada del repo más allá del `pull` en modo fast-forward: es de solo lectura respecto al contenido, solo mueve el HEAD local hacia adelante.
