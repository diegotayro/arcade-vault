# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Arcade Vault: plataforma de juegos online donde los jugadores compiten por el puntaje más alto. Desarrollada con Spec Driven Design (skills `/spec` y `/spec-impl`, instalados con `npx skills@latest add Klerith/fernando-skills`). Cada spec se implementa en una rama `spec-NN-slug` y se integra por Pull Request.

Estado actual:

- Pantallas: Home (`/`), Biblioteca (`/games`), Detalle (`/games/[id]`), Reproductor (`/games/[id]/play`), Salón de la Fama (`/hall-of-fame`), Sobre Nosotros + contacto (`/about`) y Auth (`/auth`, solo UI).
- Juegos jugables: **Asteroides, Tetris, Arkanoid, Snake y Frogger**, todos con motor propio en TypeScript sobre canvas, 4 skins, versión móvil y revisión de rendimiento. Catálogo completo en `references/implemented-games.md`.
- Catálogo y ranking en Supabase. Guardado de puntaje anónimo (sin login real todavía).
- No hay tests ni test runner configurados; la verificación se hace con `npx tsc --noEmit`, `npm run lint` y Playwright.

## Comandos

- `npm run dev` / `npm run build` / `npm run start`
- `npm run lint` (ESLint 9) y `npx tsc --noEmit`
- Prettier configurado (`.prettierrc`); un hook lo aplica automáticamente (ver «Hooks»).

## Next.js version caveat

Next.js 16.4.2 / React 19.3 con breaking changes respecto a lo que conoce el modelo (ver `AGENTS.md`). Antes de escribir código Next.js, lee la guía correspondiente en `node_modules/next/dist/docs/` (`01-app`, `02-pages`, `03-architecture`, `04-community`).

`AGENTS.md` lo regenera `next dev` (bloques `nextjs-agent-rules` y `nextjs-agent-feedback`); no lo borres, commitéalo junto con tu trabajo.

## Arquitectura

- Solo App Router (`app/`). Las props de rutas usan los helpers de tipos globales (p. ej. `LayoutProps<"/">`), no tipos escritos a mano.
- `next.config.ts` activa `cacheComponents`, `partialPrefetching` y `experimental.agentFeedback`. `cacheComponents` cambia la semántica de caché/render dinámico: revisa la documentación antes de usar data fetching o APIs de caché. Las rutas dinámicas usan `generateStaticParams` (`getGameStaticParams` en `lib/games-source.ts` devuelve un placeholder si no hay juegos y las páginas lo resuelven con `notFound()`). Recordatorio pendiente: ver memoria sobre el error de `params` fuera de `Suspense` en `/games/[id]`.
- Tailwind CSS v4 se conecta por una regla de Turbopack (loader `@tailwindcss/turbopack` para `*.css`), no por PostCSS. Los tokens de tema viven en `app/globals.css` (`@theme inline`, claro/oscuro con `prefers-color-scheme`). Las portadas de juegos son clases `.cover-<id>` en ese mismo archivo.
- Alias de rutas `@/*` → raíz del repo.
- Fuentes (`app/layout.tsx`): Press Start 2P, JetBrains Mono y Courier Prime.

### Estructura

- `app/` — rutas. `app/games/[id]/play/actions.ts` contiene la Server Action `saveScore`; `app/about/actions.ts` la de contacto; `app/api/health/supabase/route.ts` es el health check de Supabase.
- `components/` — UI. Subcarpetas `home/` y `about/`. `game-player.tsx` es el reproductor y orquesta los juegos; `<juego>-canvas.tsx` monta cada motor.
- `lib/games/<juego>/` — motor de cada juego (ver «Juegos»).
- `lib/games.ts` (tipos), `lib/games-source.ts` (lectura del catálogo), `lib/leaderboard.ts` (rankings), `lib/score-rules.ts` (validación compartida cliente/servidor), `lib/contact.ts`, `lib/home.ts`.
- `lib/games/skins.ts` (skins comunes) y `lib/games/touch-controls.ts` (`TOUCH_LAYOUTS`, gamepad táctil por juego; lo pinta `components/touch-gamepad.tsx`).
- `lib/supabase/` — `client.ts`, `server.ts`, `public.ts` (cliente anónimo sin cookies para lecturas cacheables) y `database.types.ts` (regenerable con el MCP de Supabase).
- `specs/` contiene toda el historial del Spec Driven Design, `.spec-config.yml` (`AutoCreateBranch: true`) y `game-jam/<game-id>/` (specs alternativas generadas por el agente `game-jam`).
- `references/` — material de apoyo, **no es código de la app** (excluido de los hooks): `started-games/` (juegos originales a portar), `templates/` (diseños HTML/JSX), `source-assets/`, `implemented-games.md` (catálogo implementado), `game-with-skins.md` (juegos con skins, lo mantiene el agente `skin-designer`), `mobile-ready-games.md` (juegos con versión móvil, lo mantiene el agente `mobile-porter`), `performance-reviewed-games.md` (juegos revisados en rendimiento, lo mantiene el agente `game-performance`) y `game-suggestions-todo.md` (To Do de sugerencias, lo mantiene el agente `game-planner`).
- `.claude/` — `settings.json`, `hooks/`, `skills/add-game/`, `skills/spec-impl-game/`, `agents/game-planner.md`, `agents/game-jam.md`, `agents/skin-designer.md`, `agents/mobile-porter.md`, `agents/game-performance.md` y `agent-memory/game-planner/` (memoria del agente, versionada).
- `scripts/measure-fps.js` — medición de fps por skin (Playwright), usada por `game-performance`.
- `public/games/<juego>/` — assets estáticos (sprites, sonidos) de Arkanoid y Snake.
- `supabase/migrations/` — migraciones SQL versionadas.

## Juegos

Cada juego sigue el mismo patrón (definido en las specs 05–07):

- `lib/games/<id>/` con `types.ts`, `constants.ts`, `entities.ts` (lógica pura), `input.ts`, `engine.ts` (estado, loop, pausa, `endGame`, `restart`, `destroy`, callbacks) y, según el juego, `render.ts` / `sprites.ts` / `levels.ts`.
- `components/<id>-canvas.tsx` (`"use client"`): crea el motor en `useEffect`, lo destruye al desmontar, aplica `isPaused` y expone `endGame`/`restart` por `ref`.
- Los assets no se cargan al importar el módulo (SSR).
- `components/game-player.tsx` registra el juego en `REAL_GAMES` (`hasLives`, `hasSkinSelector`) y lo renderiza en `renderGame`. HUD: puntaje, nivel y vidas (un «♥» fijo si `hasLives` es falso); `P`/`Esc` y el botón PAUSA deben quedar sincronizados.
- Móvil (spec 12): cada juego registra su layout en `TOUCH_LAYOUTS`; el gamepad emite `KeyboardEvent` sintéticos con el mismo `code` que el teclado. Registro en `references/mobile-ready-games.md`.
- Rendimiento (spec 13): evitar `shadowBlur` por entidad; usar bloom por downscale. Registro en `references/performance-reviewed-games.md`.
- Skins: todos los juegos tienen selector de **skins** (retro, neon, pastel, pixel), por defecto `retro`. Lo común está en `lib/games/skins.ts` (`SkinId`, `skinStorageKey`); `GamePlayer` persiste la elección en `localStorage["<id>-skin"]` y la pasa al canvas, que llama a `engine.setSkin` (redibuja sin reiniciar). Cada juego define sus colores en `SKINS` (`constants.ts`); `retro` conserva el look original. Registro en `references/game-with-skins.md`.

| Juego      | Id          | Notas                                                                                                         |
| ---------- | ----------- | ------------------------------------------------------------------------------------------------------------- |
| Asteroides | `asteroids` | Con vidas, power-up de triple disparo. Dibujo por skin en `render.ts` (pixel a 1/3 de resolución).            |
| Tetris     | `tetris`    | 7 piezas (la «N» está retirada). Skins desde la spec 11 (reemplazó al selector TEMA).                         |
| Arkanoid   | `arkanoid`  | Niveles, vidas, victoria, sprites y sonidos en `public/games/arkanoid/`. Skins no retro en `painters.ts`.     |
| Snake      | `snake`     | Sin vidas, sprites en `public/games/snake/`. Fruta sin sprites (skins no retro) en `vector-fruit.ts`.         |
| Frogger    | `frogger`   | Con vidas, 5 bocas de meta, dibujo vectorial en `render.ts` (sin sprites). Spec en `specs/game-jam/frogger/`. |

## Supabase

- Proyecto configurado en `.mcp.json` (MCP `supabase`). Variables en `.env.local` (plantilla: `.env.template`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_DB_PASSWORD`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`.
- Para cualquier creación o modificación relacionada con la base de datos de Supabase, **siempre crea las migraciones respectivas**: aplícalas con `apply_migration` y guarda el mismo SQL en `supabase/migrations/`.
- Esquema:
  - `games` (id slug, título, descripciones, categoría, `cover`, `color`, `plays_count`): lectura pública con RLS. **El catálogo sale solo de Supabase** (spec 07); ya no hay datos mock.
  - `leaderboard` (`game_id`, `user_id` nulo por ahora, `player_name` de 3–12 caracteres, `score` 0–10 000 000): lectura pública; el `INSERT` anónimo lo permite la política temporal **«temporary anonymous insert for ported games»**, restringida a `user_id is null` y a una lista de `game_id`.
  - Vista `games_catalog` (juego + mejor puntaje, `security_invoker`) y función `top_scores(p_limit)` (ranking por juego).
- Al agregar un juego: migración que inserta la fila en `games` y migración que **reemplaza** la política de `INSERT` (consulta antes `pg_policies` para el nombre vigente) ampliando la lista de `game_id`. Después ejecuta `get_advisors` de seguridad.
- `saveScore` es una Server Action invocable por POST directo: valida todo el input con `lib/score-rules.ts` (mismos límites que los `check` de la tabla) y llama a `revalidatePath("/", "layout")`.
- El contacto de `/about` usa Resend con honeypot (`website`) y validación en `lib/contact.ts`.

## Skills, agentes y flujo de trabajo

Skills globales (`~/.claude/skills/`):

- **`/frontend-design`**: úsalo siempre para diseñar la interfaz de usuario.
- **`/spec`** y **`/spec-impl`**: crean y ejecutan specs en `specs/NN-slug.md` (`Borrador` → `Approved` → `Implemented`). `/spec-impl` pausa tras cada paso; cada paso deja el sistema funcional y commiteable.

Skills de proyecto (`.claude/skills/`):

- **`/add-game`**: escribe la spec para portar o crear un juego (sin código). Se implementa con `/spec-impl-game`.
- **`/spec-impl-game`**: `/spec-impl` para specs de juegos; al final ejecuta en secuencia `skin-designer` → `mobile-porter` → `game-performance`. Sin commits.

Agentes de proyecto (definición completa en `.claude/agents/<nombre>.md`):

- **`game-planner`**: decide qué juego agregar; mantiene `references/game-suggestions-todo.md` y su memoria en `.claude/agent-memory/game-planner/`.
- **`game-jam`**: escribe ≥2 specs alternativas del juego pedido en `specs/game-jam/<game-id>/`.
- **`skin-designer`**: implementa las 4 skins de un juego (referencia: Tetris).
- **`mobile-porter`**: adapta un juego a móvil (spec 12).
- **`game-performance`**: mide y corrige el rendimiento de un juego (spec 13).

Flujo típico de un juego nuevo: `game-planner` → `/add-game` (o `game-jam`) → `/spec-impl-game`.

Idioma: specs, textos de UI y mensajes de error en español; código en inglés.

## Hooks y herramientas

- `.claude/settings.json`: permite `npx tsc *` y define un hook `PostToolUse` (`Write|Edit`) que ejecuta `.claude/hooks/format-and-lint.sh`: Prettier + `eslint --fix` sobre el archivo escrito (ignora `node_modules`, `.next` y `references`). Si ESLint falla, el hook bloquea con su salida.
- Playwright (MCP): guarda las capturas en `.playwright-screenshots/`.
