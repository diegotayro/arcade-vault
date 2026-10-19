# SPEC 07 — Catálogo de juegos solo desde Supabase

> **Estado:** Approved
> **Depende de:** SPEC 06
> **Fecha:** 2026-10-19
> **Objetivo:** Eliminar los juegos hardcodeados de `lib/games.ts` para que toda la aplicación consuma únicamente los juegos de la tabla `games` de Supabase (hoy solo `asteroids`), mostrando un estado vacío cuando no hay juegos o Supabase falla.

## Alcance

**Dentro:**

- Eliminar el arreglo `GAMES` y `findGame` de `lib/games.ts`; el archivo conserva solo tipos (`Game`, `GameCategory`, `NeonColor`) y `CATEGORIES`.
- `getGames()` y `getGame()` en `lib/games-source.ts` leen solo de `games_catalog`, sin fusión con mock ni fallback a mock.
- Si Supabase falla o la tabla está vacía, `getGames()` devuelve `[]` y `getGame(id)` devuelve `undefined` (404 en `/games/[id]` y `/games/[id]/play`), sin error 500.
- Estado vacío reutilizable («NO HAY JUEGOS DISPONIBLES» + texto de apoyo en español) con el estilo del bloque «NO HAY RESULTADOS» de `components/library.tsx`, usado en:
  - Biblioteca (`/games`): sin juegos en absoluto, distinto del estado de filtros sin resultados.
  - Vista previa del home (`GamesPreview`): reemplaza el rail de tarjetas; el botón «VER TODOS LOS JUEGOS →» se mantiene.
  - Salón de la Fama (`/hall-of-fame`): evita el acceso a `games[0]` cuando la lista está vacía.
- Verificar que ningún otro archivo consuma datos de juegos hardcodeados.
- Textos visibles en español, código y nombres en inglés.

**Fuera de alcance (para futuras specs):**

- Insertar en `games` los 8 juegos antes hardcodeados (cada uno se inserta al portarse).
- Feed de actividad del home (`lib/home.ts`, con títulos y puntajes inventados) y estadísticas del home.
- Eliminar los estilos `.cover-*` de `app/globals.css` (se reutilizan al portar cada juego).
- Eliminar el simulador mock de `GamePlayer` (queda como rama por defecto, inalcanzable hasta que haya más juegos en `games`).
- Cambios en `leaderboard`, `saveScore` o la política temporal de INSERT (sigue solo `asteroids`).
- Contador real de partidas, `best` real distinto de `MAX(score)`, Realtime.
- Autenticación.
- Tests automatizados.

## Modelo de datos

Sin cambios en el esquema ni migraciones: la tabla `games` y la vista `games_catalog` de la SPEC 06 se mantienen.

Cambios en tipos y módulos:

```ts
// lib/games.ts — se conservan solo tipos y constantes de UI
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type NeonColor = "cyan" | "magenta" | "yellow" | "green";
export interface Game {
  /* sin cambios */
}
export const CATEGORIES = [
  "TODOS",
  "ARCADE",
  "PUZZLE",
  "SHOOTER",
  "VERSUS",
] as const;
// GAMES y findGame se eliminan

// lib/games-source.ts
function getGames(): Promise<Game[]>; // solo games_catalog; [] ante error
function getGame(id: string): Promise<Game | undefined>;
```

Convenciones:

- Los juegos con `best` y `plays` en 0 son valores reales (leaderboard vacío, `plays_count` = 0); no se inventan datos.
- El componente de estado vacío vive en `components/games-empty-state.tsx` y recibe el contexto por props o `children` si algún uso lo requiere.
- `getGames()` no distingue error de tabla vacía: ambos muestran el mismo estado vacío (decisión del usuario).
- `generateStaticParams` de `/games/[id]` y `/games/[id]/play` usa `getGames()`; si devuelve `[]`, el build no debe fallar.

## Plan de implementación

Antes de escribir código Next.js, leer en `node_modules/next/dist/docs/` la guía de `cacheComponents` (data fetching y `use cache`) y la de `generateStaticParams`. Mantener `params` dentro de `<Suspense>` en `/games/[id]` y `/games/[id]/play`. Usar `/frontend-design` para el estado vacío.

1. Buscar todos los consumidores de `GAMES`, `findGame` y de títulos/ids de juegos hardcodeados (`grep`). Verificar: lista de referencias documentada y sin sorpresas fuera de las rutas ya conocidas.
2. Crear `components/games-empty-state.tsx` (bloque «NO HAY JUEGOS DISPONIBLES») con `/frontend-design`. Verificar: `npx tsc --noEmit` pasa.
3. Simplificar `lib/games-source.ts`: `getGames()` solo desde `games_catalog` y `getGame()` sin mock; eliminar la importación de `GAMES`. Verificar: `npx tsc --noEmit` pasa.
4. Eliminar `GAMES` y `findGame` de `lib/games.ts`. Verificar: `npx tsc --noEmit` y `npm run lint` pasan, y `grep -rn "GAMES\|findGame"` no devuelve resultados en `app/`, `components/` ni `lib/`.
5. Conectar el estado vacío en `components/library.tsx` (cuando `games.length === 0`, antes de buscador y filtros) y en `components/home/games-preview.tsx`. Verificar: con la tabla vacía (o `NEXT_PUBLIC_SUPABASE_URL` inválida) `/games` y `/` muestran el estado vacío sin 500.
6. Proteger `components/hall-of-fame.tsx` (o `app/hall-of-fame/page.tsx`) ante lista vacía mostrando el estado vacío. Verificar: `/hall-of-fame` sin juegos no lanza error; con `asteroids` muestra su pestaña.
7. Verificar con `list_tables`/`execute_sql` que `select id from public.games` devuelve únicamente `asteroids`, y comprobar con Playwright el flujo con datos reales: `/games` solo muestra «ASTEROIDES» (1 tarjeta), `/games/asteroids` y `/games/asteroids/play` cargan, un id antiguo (ej. `/games/caida`) devuelve 404. Verificar: sin errores de Suspense ni de hidratación en consola.
8. Ejecutar `npm run lint`, `npx tsc --noEmit` y `npm run build` (también con Supabase inaccesible). Verificar: terminan sin errores.

## Criterios de aceptación

- [ ] `npm run build`, `npm run lint` y `npx tsc --noEmit` terminan sin errores.
- [ ] `lib/games.ts` no exporta `GAMES` ni `findGame`; no hay referencias a ellos en el repositorio.
- [ ] `select id from public.games` devuelve únicamente `asteroids`.
- [ ] `/games` muestra exactamente 1 tarjeta («ASTEROIDES»), tomada de la tabla `games`, y ninguna de los 8 juegos antes hardcodeados.
- [ ] Los filtros de categoría de `/games` siguen funcionando: `SHOOTER` y `TODOS` muestran «ASTEROIDES»; `ARCADE`, `PUZZLE` y `VERSUS` muestran «NO HAY RESULTADOS».
- [ ] La vista previa del home muestra solo las tarjetas de juegos presentes en la tabla (hoy una).
- [ ] El Salón de la Fama lista solo las pestañas de juegos presentes en la tabla (hoy `asteroids`).
- [ ] `/games/asteroids` y `/games/asteroids/play` funcionan con datos de la tabla.
- [ ] Ids de antiguos juegos mock (ej. `/games/caida`, `/games/rocas`) devuelven 404.
- [ ] Con la tabla `games` vacía o `NEXT_PUBLIC_SUPABASE_URL` inválida, `/games`, `/` y `/hall-of-fame` muestran el estado vacío en español y no devuelven 500.
- [ ] `npm run build` pasa con Supabase inaccesible.
- [ ] El estado vacío de la biblioteca sin juegos es distinto de «NO HAY RESULTADOS» (filtros sin coincidencias).
- [ ] No se modifica el esquema ni se crean migraciones nuevas.
- [ ] Guardar una puntuación de `asteroids` sigue funcionando y aparece en `/games/asteroids` y en el Salón de la Fama.
- [ ] Sin errores de Suspense ni de hidratación en la consola de ninguna pantalla afectada.

## Decisiones tomadas y descartadas

- **Sí:** la tabla `games` es la única fuente del catálogo (decisión del usuario). Elimina la fuente duplicada en código.
- **No:** sembrar los 8 juegos hardcodeados en `games` (decisión del usuario). Solo se ven los juegos realmente jugables; cada uno se inserta al portarse.
- **No:** fallback al mock cuando Supabase falla (decisión del usuario). Si falla, no se muestra ningún juego, en toda la app.
- **Sí:** estado vacío con mensaje único en español, reutilizable. Evita pantallas en blanco y el error de `games[0]` en el Salón de la Fama.
- **Sí:** error y tabla vacía comparten el mismo estado. Simplicidad; distinguirlos requeriría una UI de error aparte.
- **Sí:** `lib/games.ts` se conserva solo con tipos y `CATEGORIES`. Son importados por componentes; moverlos ampliaría el alcance sin beneficio.
- **Sí:** `best` y `plays` en 0 (decisión del usuario). Coherente con los rankings vacíos de la SPEC 06.
- **Sí:** conservar los estilos `.cover-*` y el simulador mock de `GamePlayer`. Se reutilizan o retiran al portar cada juego.
- **Sí:** feed de actividad del home fuera de alcance. Es mock de actividad, no catálogo; queda incoherente a propósito hasta su propia spec.
- **Sí:** guardado de puntuaciones sigue solo para `asteroids`. Ampliarlo implicaría tocar la política temporal de INSERT.

## Riesgos identificados

| Riesgo                                                                 | Mitigación                                                                                    |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `generateStaticParams` devuelve `[]` y rompe el build                  | Verificar el build con Supabase inaccesible; devolver un valor válido para `cacheComponents`. |
| `HallOfFame` accede a `games[0]` con lista vacía                       | Estado vacío antes de renderizar el componente o guarda explícita.                            |
| El home queda incoherente: actividad menciona juegos que ya no existen | Aceptado (fuera de alcance); registrado para una spec futura.                                 |
| Pérdida de enlaces antiguos a juegos mock                              | Aceptado: devuelven 404.                                                                      |
| `cacheComponents` cachea el catálogo y oculta cambios en la tabla      | Leer la guía antes del paso 3 y definir explícitamente qué se cachea y su revalidación.       |
| `params` fuera de `<Suspense>` en `/games/[id]` y `/play`              | Mantener `await params` dentro de componentes envueltos en `<Suspense>`; revisar la consola.  |

## Lo que **no** entra en esta spec

- Insertar los 8 juegos antes hardcodeados en `games`.
- Feed de actividad y estadísticas del home.
- Limpieza de `.cover-*` y del simulador mock de `GamePlayer`.
- Guardado de puntuaciones de otros juegos, autenticación, contador real de partidas, Realtime.
- Tests automatizados.

Cada uno, si se hace, va en su propia spec.
