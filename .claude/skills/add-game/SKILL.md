---
name: add-game
description: Genera, como spec en specs/, el plan para portar o crear un juego (desde references/started-games/ o desde cero) con su leaderboard y su integración en la plataforma Arcade Vault. Sigue los lineamientos del skill /spec para que el resultado se implemente con /spec-impl. No escribe código de la aplicación.
disable-model-invocation: true
argument-hint: <references/started-games/NN-nombre | descripción del juego>
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, Bash(ls:*), Bash(cat:*), Bash(git status:*), Bash(git branch:*)
---

# /add-game — Generador de specs de juegos para Arcade Vault

Specs que ya existen:
!`ls specs/ 2>/dev/null`

Juegos disponibles como referencia:
!`ls references/started-games/ 2>/dev/null`

El argumento recibido es: `$ARGUMENTS`

---

## Qué hace este skill

Produce **una spec** (`specs/NN-<id>-game.md`) que, una vez aprobada, `/spec-impl` usa para agregar un juego a la plataforma: motor en TypeScript, componente canvas, fila en `games`, guardado en `leaderboard` e integración en `GamePlayer`.

**Aquí no escribes código de la aplicación, migraciones ni estilos.** El único archivo que escribes es la spec (y `specs/.spec-config.yml` solo si no existe, igual que `/spec`).

El patrón a replicar se definió en `specs/05-asteroids-game.md` (motor y UI), `specs/06-games-and-leaderboard-tables.md` (tablas, `saveScore`) y `specs/07-games-from-supabase-only.md` (catálogo solo desde Supabase).

## Paso 0 — Estudiar el skill /spec (obligatorio)

Antes de cualquier otra cosa, **lee completos** y sigue:

1. `~/.claude/skills/spec/SKILL.md` — fases, reglas de preguntas, reglas de escritura, reglas de guardado y reglas duras.
2. `~/.claude/skills/spec/template.md` — la forma que debe respetar toda spec.

Todo lo que exigen esos archivos aplica aquí, con estas especializaciones:

- Las fases 1–4 de `/spec` son el flujo de este skill (contexto → preguntas → escritura → guardado).
- El idioma de la spec, la etiqueta de estado (`Estado`/`Status`), los encabezados y la palabra «Borrador/Aprobado» deben coincidir con las specs existentes en `specs/` (hoy en español: `Estado: Borrador`, `Depende de`, `Fecha`, `Objetivo`, `Alcance`, `Modelo de datos`, `Plan de implementación`, `Criterios de aceptación`, `Decisiones tomadas y descartadas`, `Riesgos identificados`, `Lo que **no** entra en esta spec`).
- Tus respuestas al usuario usan el idioma de la invocación.
- Fecha: usa la del contexto de la sesión, nunca la adivines.
- Estado: siempre `Borrador` (o el equivalente de Draft en el repo). Nunca marques `Aprobado`.
- Objetivo en una sola frase; si el juego no cabe en una frase, propón dividirlo.
- Cada paso del plan debe dejar el sistema funcional y poder commitearse solo (`/spec-impl` hace una pausa tras cada paso).
- Los criterios de aceptación deben ser booleanos y verificables.

## Fase 1 — Contexto

1. Lee `CLAUDE.md` (y `AGENTS.md` si existe).
2. Lee las specs `05`, `06` y `07`, más la spec más reciente si es otra.
3. Lee el estado **actual** del código de integración (no confíes en las specs, pueden estar desactualizadas):
   - `lib/games/asteroids/` (`types.ts`, `engine.ts`, `input.ts`, `constants.ts`, `entities.ts`)
   - `components/asteroids-canvas.tsx`, `components/game-player.tsx`
   - `app/games/[id]/play/actions.ts`, `lib/score-rules.ts`, `lib/games.ts`, `lib/games-source.ts`
   - `supabase/migrations/` (nombres y SQL de las migraciones de games/leaderboard, incluido el nombre exacto de la política temporal de `INSERT` vigente)
   - los estilos `.cover-*` de `app/globals.css`
4. Decide la fuente a partir del argumento:
   - Coincide con una carpeta de `references/started-games/` → juego **portado**. Lee su `game.js` (y otros `.js`), `index.html`, `README.md`, `CLAUDE.md`, `style.css` y `assets/` si existen.
   - Texto libre → juego **nuevo** desde cero.
   - Vacío → pide una descripción en una sola frase o la carpeta de referencia.
5. Para juegos portados, deriva un `id` propuesto del nombre de carpeta sin prefijo numérico (`03-tetris` → `tetris`) y comprueba que no exista ya en `games` (migraciones) ni en `specs/`.

Si el juego no cabe en una frase o requiere más de un motor (ej. multijugador), propón dividirlo antes de continuar.

## Fase 2 — Entrevista

Entrevista completa como `/spec`: bloques de 3 a 5 preguntas con `AskUserQuestion`, recomendación primero y etiquetada, esperando respuesta entre bloques. Pregunta solo lo que no se pueda derivar del código fuente y resume lo que dedujiste para que el usuario lo corrija.

Cubre como mínimo:

- **Identidad:** `id` (kebab-case, debe cumplir `^[a-z0-9]+(-[a-z0-9]+)*$`), `title` en mayúsculas y en español, `category` (`ARCADE`, `PUZZLE`, `SHOOTER`, `VERSUS`), `color` (`cyan`, `magenta`, `yellow`, `green`), textos `short` y `long`.
- **Reglas (portado):** qué reglas, física, puntajes y controles se conservan como en el original y cuáles cambian. Por defecto: port fiel, con las diferencias listadas explícitamente.
- **Diseño del juego (nuevo):** objetivo, controles, puntaje, condición de fin, progresión de dificultad.
- **HUD:** ¿el juego tiene vidas? ¿niveles? Decláralo; el HUD de la plataforma muestra solo lo que aplica.
- **Encaje con el contrato estándar del motor:** módulos extra, assets (destino `public/games/<id>/`), datos de niveles, varias pantallas (menú, entre niveles).
- **Portada:** idea visual para `.cover-<id>` (se diseña con `/frontend-design` durante la implementación).
- **Alcance:** qué queda fuera (por defecto: solo teclado, sin controles táctiles, sin sonido salvo que el original lo tenga, sin auth).
- **Decisiones cerradas:** cualquier cosa que el usuario no quiera reabrir.

Deja de preguntar cuando puedas responder sin asumir: qué archivos aparecen o cambian, cuáles son el primer y el último paso, cómo se verifica.

## Fase 3 — Escribir la spec

Si la Fase 2 cerró todo, escribe la spec completa directamente (sin confirmación sección por sección). Usa la estructura de `template.md`, adaptada de las specs 05/06/07.

Contenido que toda spec generada debe incluir:

**Encabezado:** `Depende de` lista siempre SPEC 05, 06 y 07 (patrón y plataforma) más cualquier otra relevante.

**Alcance (dentro):**

- Motor en `lib/games/<id>/` (`types.ts`, `constants.ts`, `entities.ts` si aplica, `input.ts`, `engine.ts`) con el mismo contrato que Asteroides: `create<Name>Engine(canvas, callbacks)` que devuelve `start`, `pause`, `resume`, `endGame`, `restart`, `destroy`; sin globals ni acceso a `document` al importar; callbacks solo cuando cambia el valor; `restart` emite los valores iniciales; `destroy` idempotente; pausa automática en `visibilitychange`.
- Callbacks adaptados al juego (`onScoreChange` y `onGameOver` siempre; `onLivesChange` y `onLevelChange` solo si el juego los tiene).
- Componente cliente `components/<id>-canvas.tsx` que monta y destruye el motor.
- Migración que inserta el juego en `public.games` (sigue el estilo de nombre/timestamp de `supabase/migrations/`, aplícala con Supabase MCP `apply_migration` y conserva el mismo SQL en `supabase/migrations/`, como exige CLAUDE.md).
- Migración que amplía la política temporal de `INSERT` de `leaderboard` para incluir el nuevo `game_id` (drop y create con el nombre exacto vigente; mantener `user_id is null`).
- `.cover-<id>` en `app/globals.css` (revisar antes colisiones de nombre).
- Integración en `GamePlayer`: nuevo caso por `gameId`; generaliza solo lo necesario (ej. `isRealGame`, refs) y di exactamente qué.
- Verificar que `saveScore` y `lib/score-rules.ts` aceptan el juego y que el modal guarda en `leaderboard`.
- Solo teclado, textos en español, código en inglés.

**Fuera de alcance (lista por defecto):** controles táctiles/móvil, otros juegos, auth y retiro de la política temporal, anti-trampas, contador real de partidas, Realtime, tests automatizados, mecánicas nuevas que no estén en el original.

**Modelo de datos:** fila de `games` (id, title, short, long, category, cover, color), tipos del motor y callbacks, tabla de archivos y convenciones (constantes portadas literalmente, límite de `dt` si el original lo tiene, etc.).

**Plan de implementación:** empieza con «leer la guía de Next.js relevante en `node_modules/next/dist/docs/` (Client Components y `cacheComponents`) antes de escribir código Next.js; usar `/frontend-design` para la portada y el marco del canvas; mantener `params` dentro de `<Suspense>`». Orden típico, cada paso verificable y commiteable:

1. Migración que inserta en `games` (+ archivo en `supabase/migrations/`). Verificar con `execute_sql` / `list_migrations`.
2. Migración que amplía la política de `INSERT`. Verificar que un insert con rol `anon` para el nuevo juego funciona y que otro `game_id` es rechazado; ejecutar `get_advisors`.
3. Estilo `.cover-<id>`. Verificar que `/games` muestra la tarjeta.
4. `types.ts` + `constants.ts` del motor. Verificar `npx tsc --noEmit`.
5. `input.ts` + `entities.ts` (port). Verificar `npx tsc --noEmit`.
6. `engine.ts`. Verificar `npx tsc --noEmit` y `npm run lint`.
7. `components/<id>-canvas.tsx`. Verificar que se ve y responde al teclado.
8. Integración en `GamePlayer` (HUD, pausa, fin, reinicio, modal de game over, guardado). Verificar que el HUD coincide con el canvas.
9. Estilos del canvas / responsive. Verificar sin scroll horizontal a 375px y a 1280px.
10. Flujo completo con Playwright (jugar, pausar, perder, guardar puntaje, verlo en `/games/<id>` y `/hall-of-fame`), luego `npm run lint`, `npx tsc --noEmit` y `npm run build`.

Divide o fusiona pasos según el juego, pero mantén cada uno pequeño (≈30–50 líneas de código) y nunca dejes la app rota.

**Criterios de aceptación (incluir siempre, adaptados):** build/lint/tsc pasan; `select id from public.games` contiene el nuevo id; tarjeta visible en `/games`; `/games/<id>` y `/games/<id>/play` cargan; controles y puntajes coinciden con el original; el HUD de la plataforma es igual al del canvas; la pausa congela todo e ignora teclas; cambiar de pestaña pausa sin salto de `dt`; FIN y game over abren el modal con el puntaje real; reiniciar resetea todo; guardar crea una fila con `user_id` nulo y el puntaje final, visible en `/games/<id>` y en el Salón de la Fama; nombre/puntaje inválidos se rechazan con error en español; otro `game_id` sigue rechazado por RLS; destruir el motor no deja listeners ni `requestAnimationFrame`; flechas y Espacio no hacen scroll de la página; el canvas escala sin scroll horizontal; sin errores de hidratación ni de Suspense; los demás juegos y el flujo de Asteroides siguen funcionando.

**Decisiones tomadas y descartadas** (con motivo, marcando las del usuario), **Riesgos** (como mínimo: `GamePlayer` fijo a un solo juego, nombre exacto de la política, doble montaje en StrictMode, `cacheComponents`, `params` fuera de `Suspense`, assets/niveles, controles distintos a Asteroides) y **lo que NO entra en esta spec**.

No pegues código largo; los fragmentos cortos de tipos o SQL están bien. Sin TODOs.

## Fase 4 — Guardar

1. Siguiente número = el mayor en `specs/` + 1, con dos dígitos. Archivo: `specs/NN-<id>-game.md`.
2. Escríbela directamente sin pedir permiso; pregunta solo si el archivo ya existe.
3. Verifica que cada spec de `Depende de` exista en `specs/`.
4. Si `specs/.spec-config.yml` no existe, créalo con el contenido por defecto de `/spec`; si existe, déjalo intacto.
5. Confirma al usuario: ruta, estado `Borrador` (lo cambia a `Aprobado` tras revisarla) y siguiente paso: `/spec-impl NN-<id>-game`.
6. **Detente.** No ofrezcas implementar ni escribas código.

## Reglas duras

- Nunca escribas código, migraciones ni estilos; solo la spec.
- Nunca omitas la Fase 2. Si el usuario insiste en saltarla, recuérdale el costo y registra «Definición rápida sin aclaración detallada» en la sección de decisiones.
- Nunca asumas decisiones que el usuario no confirmó.
- Nunca marques la spec como `Aprobado`.
- Nunca copies el código de un juego dentro de la spec; referencia los archivos fuente (`references/started-games/<carpeta>/game.js`) como origen del port.
