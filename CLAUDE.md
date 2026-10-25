# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Arcade Vault: plataforma de juegos online donde los jugadores compiten por el puntaje más alto. Desarrollada con Spec Driven Design (skills `/spec` y `/spec-impl`, instalados con `npx skills@latest add Klerith/fernando-skills`). Cada spec se implementa en una rama `spec-NN-slug` y se integra por Pull Request.

Estado actual:

- Pantallas: Home (`/`), Biblioteca (`/games`), Detalle (`/games/[id]`), Reproductor (`/games/[id]/play`), Salón de la Fama (`/hall-of-fame`), Sobre Nosotros + contacto (`/about`) y Auth real (`/auth`, `/auth/forgot`, `/auth/reset`).
- Juegos jugables: **Asteroides, Tetris, Arkanoid, Snake y Frogger**, todos con motor propio en TypeScript sobre canvas, 4 skins, versión móvil y revisión de rendimiento. Catálogo completo en `references/implemented-games.md`.
- Catálogo y ranking en Supabase. Auth con Supabase (email/contraseña, Google y GitHub, confirmación de correo y recuperación de contraseña). El puntaje solo se guarda con sesión.
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
- `next.config.ts` envía en todas las rutas los headers de seguridad `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` y `Referrer-Policy: strict-origin-when-cross-origin` (sin CSP ni HSTS). La app no puede embeberse en un iframe.
- `next.config.ts` activa `cacheComponents`, `partialPrefetching` y `experimental.agentFeedback`. `cacheComponents` cambia la semántica de caché/render dinámico: revisa la documentación antes de usar data fetching o APIs de caché. Las rutas dinámicas usan `generateStaticParams` (`getGameStaticParams` en `lib/games-source.ts` devuelve un placeholder si no hay juegos y las páginas lo resuelven con `notFound()`). Recordatorio pendiente: ver memoria sobre el error de `params` fuera de `Suspense` en `/games/[id]`.
- Tailwind CSS v4 se conecta por una regla de Turbopack (loader `@tailwindcss/turbopack` para `*.css`), no por PostCSS. Los tokens de tema viven en `app/globals.css` (`@theme inline`, claro/oscuro con `prefers-color-scheme`). Las portadas de juegos son clases `.cover-<id>` en ese mismo archivo.
- Alias de rutas `@/*` → raíz del repo.
- Fuentes (`app/layout.tsx`): Press Start 2P, JetBrains Mono y Courier Prime.

### Estructura

- `app/` — rutas. `app/games/[id]/play/actions.ts` contiene la Server Action `saveScore`; `app/about/actions.ts` la de contacto; `app/auth/actions.ts` las Server Actions de auth (`signUp`, `signIn`, `signInWithProvider`, `signOut`, `requestPasswordReset`, `updatePassword`); `app/auth/callback/route.ts` es el callback compartido por confirmación, OAuth y recuperación (`exchangeCodeForSession`, `next` solo con rutas internas, deriva el username de OAuth); `app/api/health/supabase/route.ts` es el health check de Supabase.
- `components/` — UI. Subcarpetas `home/` y `about/`. `game-player.tsx` es el reproductor y orquesta los juegos; `<juego>-canvas.tsx` monta cada motor.
- `lib/games/<juego>/` — motor de cada juego (ver «Juegos»).
- `lib/games.ts` (tipos), `lib/games-source.ts` (lectura del catálogo), `lib/leaderboard.ts` (rankings), `lib/score-rules.ts` (validación compartida cliente/servidor), `lib/auth-rules.ts` (validación de email, contraseña y username), `lib/contact.ts`, `lib/home.ts`.
- `lib/games/skins.ts` (skins comunes) y `lib/games/touch-controls.ts` (`TOUCH_LAYOUTS`, gamepad táctil por juego; lo pinta `components/touch-gamepad.tsx`).
- `lib/supabase/` — `client.ts`, `server.ts`, `public.ts` (cliente anónimo sin cookies para lecturas cacheables), `use-session-user.ts` (hook cliente de sesión, lo usan el nav y `GamePlayer`) y `database.types.ts` (regenerable con el MCP de Supabase).
- `proxy.ts` (raíz) refresca la sesión por cookies y controla el acceso: con sesión, `/auth` y `/auth/forgot` van al `next` validado o a `/games`; sin sesión, `/auth/reset` va a `/auth/forgot`. `PROTECTED_PATHS` (rutas exactas o prefijos, hoy solo `/api/health/supabase`) exige sesión: una API protegida responde `401 {"status":"unauthorized"}` y una página redirige a `/auth?next=<ruta>`. Para proteger una pantalla, agrégala ahí. Las Server Actions no se bloquean en el proxy (validan `getUser()` ellas mismas).
- `specs/` contiene toda el historial del Spec Driven Design, `.spec-config.yml` (`AutoCreateBranch: true`) y `game-jam/<game-id>/` (specs alternativas generadas por el agente `game-jam`).
- `references/` — material de apoyo, **no es código de la app** (excluido de los hooks): `started-games/` (juegos originales a portar), `templates/` (diseños HTML/JSX), `source-assets/`, `implemented-games.md` (catálogo implementado), `game-with-skins.md` (juegos con skins, lo mantiene el agente `skin-designer`), `mobile-ready-games.md` (juegos con versión móvil, lo mantiene el agente `mobile-porter`), `performance-reviewed-games.md` (juegos revisados en rendimiento, lo mantiene el agente `game-performance`), `game-suggestions-todo.md` (To Do de sugerencias, lo mantiene el agente `game-planner`) y `security/` (`security-checklist.md` y `security-audit.md`, estado e historial de auditorías, lo mantiene el agente `security-auditor`).
- `.claude/` — `settings.json`, `hooks/`, `skills/add-game/`, `skills/spec-impl-game/`, `agents/game-planner.md`, `agents/game-jam.md`, `agents/skin-designer.md`, `agents/mobile-porter.md`, `agents/game-performance.md`, `agents/security-auditor.md` y `agent-memory/game-planner/` (memoria del agente, versionada).
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

- Proyecto configurado en `.mcp.json` (MCP `supabase`). Variables en `.env.local` (plantilla: `.env.template`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_DB_PASSWORD`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL` (redirects de auth).
- Para cualquier creación o modificación relacionada con la base de datos de Supabase, **siempre crea las migraciones respectivas**: aplícalas con `apply_migration` y guarda el mismo SQL en `supabase/migrations/`.
- Esquema:
  - `games` (id slug, título, descripciones, categoría, `cover`, `color`, `plays_count`): lectura pública con RLS. **El catálogo sale solo de Supabase** (spec 07); ya no hay datos mock.
  - `leaderboard` (`game_id`, `user_id` con FK a `auth.users` (`on delete set null`; los puntajes anónimos antiguos conservan `user_id` nulo), `player_name` de 3–12 caracteres, `score` 0–10 000 000): lectura pública; el `INSERT` lo permite solo la política **«authenticated insert own score»** (rol `authenticated`, `user_id = auth.uid()` y una lista de `game_id`).
  - Vista `games_catalog` (juego + mejor puntaje, `security_invoker`) y función `top_scores(p_limit)` (ranking por juego).
- Al agregar un juego: migración que inserta la fila en `games` y migración que **reemplaza** la política de `INSERT` «authenticated insert own score» (consulta antes `pg_policies` para el nombre vigente) ampliando la lista de `game_id`. Después ejecuta `get_advisors` de seguridad.
- RLS: toda tabla nueva se crea por migración con `enable row level security`. No existe `public.rls_auto_enable()` ni el event trigger `ensure_rls` (se eliminaron en la spec 15); `get_advisors` detecta `rls_disabled_in_public`.
- Contraseñas: `isValidPassword` (`lib/auth-rules.ts`) exige 8–72 caracteres con al menos una letra `[A-Za-z]` y un dígito; mensaje y pista en `PASSWORD_RULE_MESSAGE` y `PASSWORD_HINT`. Se valida en el cliente (`components/password-field.tsx`) y en `signUp`/`updatePassword`, no en `signIn` (cuentas antiguas). Supabase Auth aplica la misma regla («Letters and digits») y limita sign-ups/sign-ins a 10 cada 5 minutos por IP (configuración del dashboard). `auth_leaked_password_protection` queda como warning aceptado (plan Free).
- `?next` tras el login: `safeNextPath(next, fallback)` (`lib/auth-rules.ts`) solo acepta rutas internas (rechaza `//` y `/\`); la usan el callback, el proxy y `signIn`/`signInWithProvider`.
- Auth: el username vive en `user.user_metadata.username` (3–12 caracteres, no único; no usarlo para autorizar). No hay tabla `profiles`. Los usuarios están en `auth.users`.
- `saveScore` es una Server Action invocable por POST directo: toma el `user_id` de `getUser()` en el servidor (sin sesión devuelve `reason: "unauthenticated"`), valida todo el input con `lib/score-rules.ts` (mismos límites que los `check` de la tabla) y llama a `revalidatePath("/", "layout")`.
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
- **`security-auditor`**: audita (sin modificar nada) la seguridad de Supabase y de la app contra las specs 14 y 15; registra en `references/security/security-audit.md`. Úsalo tras cada spec o antes de un PR.

Flujo típico de un juego nuevo: `game-planner` → `/add-game` (o `game-jam`) → `/spec-impl-game`.

Idioma: specs, textos de UI y mensajes de error en español; código en inglés.

## Hooks y herramientas

- `.claude/settings.json`: permite `npx tsc *` y define un hook `PostToolUse` (`Write|Edit`) que ejecuta `.claude/hooks/format-and-lint.sh`: Prettier + `eslint --fix` sobre el archivo escrito (ignora `node_modules`, `.next` y `references`). Si ESLint falla, el hook bloquea con su salida.
- Playwright (MCP): guarda las capturas en `.playwright-screenshots/`.
