# SPEC 06 — Tablas `games` y `leaderboard` con catálogo híbrido

> **Estado:** Approved
> **Depende de:** SPEC 04, SPEC 05
> **Fecha:** 2026-10-19
> **Objetivo:** Crear las tablas `games` y `leaderboard` en Supabase, mover `asteroids` del catálogo hardcodeado a la tabla y alimentar todos los rankings de la UI desde `leaderboard`, mostrando un estado vacío cuando un juego no tiene puntuaciones, y permitir guardar puntajes de `asteroids` de forma anónima y temporal.

## Alcance

**Dentro:**

- Migración con la tabla `public.games` (solo `asteroids` como seed) y RLS de solo lectura pública.
- Migración con la tabla `public.leaderboard` (sin seed) con columna `user_id` nullable (sin FK todavía) y RLS: lectura pública y una política de `INSERT` **temporal** limitada a `asteroids` con `user_id` nulo.
- Guardado de la puntuación de `asteroids` desde el modal de fin de partida mediante una Server Action (`saveScore`) que valida nombre y puntaje e inserta con `user_id = null`; tras guardar, el ranking se actualiza.
- Migración posterior (spec de auth) deberá reemplazar la política temporal por una que exija sesión.
- Vista `public.games_catalog` (`security_invoker`) que expone `games` más `best` calculado como `MAX(score)` del leaderboard (0 si no hay filas).
- Función `public.top_scores(p_limit int)` que devuelve las mejores N puntuaciones de cada juego en una sola consulta.
- Tipos regenerados en `lib/supabase/database.types.ts`.
- Catálogo híbrido en `lib/games.ts`: los 8 juegos hardcodeados permanecen y `asteroids` se elimina del mock; un cargador de servidor fusiona mock + tabla (la tabla va al final).
- Los rankings de `/games/[id]` y del Salón de la Fama leen `leaderboard` para cualquier juego, exista o no en `games`.
- Estado vacío cuando un juego no tiene registros: una única fila con el texto «¡Sé el primero en registrar tu puntaje!», con el mismo diseño actual.
- Eliminar `lib/scores.ts` (`seededScores`) por quedar sin uso.
- Si Supabase falla, el catálogo cae al mock sin romper la página y los rankings se muestran vacíos.
- Textos visibles en español, código y nombres de tablas en inglés.

**Fuera de alcance (para futuras specs):**

- Guardar puntuaciones de los demás juegos (siguen mock al no estar portados).
- Exigir sesión para guardar, asignar `user_id` real y la FK a `auth.users` (spec de auth/RLS).
- Políticas `UPDATE`/`DELETE` y anti-trampas robustas (validación del lado del servidor del juego, rate limit).
- Autenticación.
- Migrar los otros 8 juegos a la tabla `games` y añadir una FK desde `leaderboard.game_id`.
- Contador real de partidas (`plays_count` queda en 0 y sin incremento).
- Realtime del ranking.
- Tests automatizados.

## Modelo de datos

```sql
-- supabase/migrations/<timestamp>_create_games.sql
create table public.games (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  short text not null,
  long text not null,
  category text not null check (category in ('ARCADE', 'PUZZLE', 'SHOOTER', 'VERSUS')),
  cover text not null,
  color text not null check (color in ('cyan', 'magenta', 'yellow', 'green')),
  plays_count integer not null default 0 check (plays_count >= 0),
  created_at timestamptz not null default now()
);

alter table public.games enable row level security;
create policy "games are publicly readable" on public.games
  for select to anon, authenticated using (true);
-- seed: una fila `asteroids` con los textos actuales de lib/games.ts

-- supabase/migrations/<timestamp>_create_leaderboard.sql
create table public.leaderboard (
  id uuid primary key default gen_random_uuid(),
  game_id text not null check (game_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  user_id uuid, -- nulo mientras no exista auth; la FK a auth.users llega con su spec
  player_name text not null check (char_length(player_name) between 3 and 12),
  score integer not null check (score >= 0 and score <= 10000000),
  created_at timestamptz not null default now()
);

create index leaderboard_game_score_idx on public.leaderboard (game_id, score desc, created_at);

alter table public.leaderboard enable row level security;
create policy "leaderboard is publicly readable" on public.leaderboard
  for select to anon, authenticated using (true);
-- TEMPORAL: inserción anónima solo para asteroids hasta la spec de auth
create policy "temporary anonymous insert for asteroids" on public.leaderboard
  for insert to anon, authenticated
  with check (game_id = 'asteroids' and user_id is null);
-- sin políticas de UPDATE ni DELETE

-- supabase/migrations/<timestamp>_games_catalog_and_top_scores.sql
create view public.games_catalog with (security_invoker = true) as
  select g.*, coalesce(max(l.score), 0) as best
  from public.games g
  left join public.leaderboard l on l.game_id = g.id
  group by g.id;

create function public.top_scores(p_limit int)
returns table (game_id text, rank int, player_name text, score int, created_at timestamptz)
language sql stable security invoker set search_path = ''
as $$ /* row_number() over (partition by game_id order by score desc, created_at) <= p_limit */ $$;
```

Tipos de aplicación:

```ts
// lib/leaderboard.ts
interface ScoreEntry {
  rank: number;
  name: string;
  score: number;
  date: string; // dd/mm/yyyy
}
```

Convenciones:

- La política de INSERT es deliberadamente temporal y está nombrada como tal para localizarla y eliminarla en la spec de auth.
- `saveScore(gameId, playerName, score)` vive en `app/games/[id]/play/actions.ts` (`"use server"`), usa `lib/supabase/server.ts`, valida con las mismas reglas del `CHECK` y responde `{ ok: true }` o `{ ok: false }` sin detalles internos.
- Solo `asteroids` llama a la acción; los demás juegos conservan el guardado mock.
- `leaderboard.game_id` es texto **sin FK**: los 8 juegos hardcodeados no existen en `games` y aun así deben tener ranking.
- El tipo `Game` de `lib/games.ts` no cambia; `plays_count` se formatea a `plays` (string) y `best` viene de la vista.
- Desempate de ranking: mayor `score`, luego `created_at` más antiguo.
- Archivos nuevos: `lib/games-source.ts` (cargador mock + tabla), `lib/leaderboard.ts` (consulta y mapeo). Ambos usan `lib/supabase/server.ts`.
- Las migraciones se aplican con MCP `apply_migration` y el mismo SQL se guarda en `supabase/migrations/`.

## Plan de implementación

Antes de escribir código Next.js, leer en `node_modules/next/dist/docs/` la guía de `cacheComponents` (data fetching y `use cache`) y la de Server/Client Components. Mantener `params` dentro de `<Suspense>` en `/games/[id]` y `/games/[id]/play` (ver error previo). Usar `/frontend-design` para la fila de estado vacío.

1. Crear y aplicar la migración `games` con el seed de `asteroids`. Verificar: `list_migrations` la muestra y `select id from public.games` devuelve `asteroids`.
2. Crear y aplicar la migración `leaderboard` (con `user_id` nullable y la política temporal). Verificar: `get_advisors` de seguridad sin `rls_disabled`; un `insert` con rol `anon` para `asteroids` funciona y para otro `game_id` o con `user_id` no nulo es rechazado.
3. Crear y aplicar la migración de `games_catalog` y `top_scores`. Verificar: `select * from public.games_catalog` devuelve `best = 0` para `asteroids` y `select * from public.top_scores(10)` devuelve 0 filas sin error.
4. Regenerar `lib/supabase/database.types.ts` con MCP `generate_typescript_types`. Verificar: `npx tsc --noEmit` pasa.
5. Crear `lib/leaderboard.ts` con `getTopScores(gameId, limit)` y `getAllTopScores(limit)` (agrupado por `game_id`), con degradación a lista vacía ante error. Verificar: `npx tsc --noEmit` pasa.
6. Crear `lib/games-source.ts` con `getGames()` y `getGame(id)` que fusionan mock + `games_catalog` (tabla al final, mock como fallback). Eliminar la entrada `asteroids` de `GAMES` en `lib/games.ts`. Verificar: `/games` muestra "ASTEROIDES" una sola vez, con los 8 juegos mock.
7. Migrar a `getGames()`/`getGame()`: `app/games/page.tsx` y `components/library.tsx`, `components/home/games-preview.tsx`, `app/games/[id]/page.tsx`, `app/games/[id]/play/page.tsx` (incluido `generateStaticParams`). Verificar: `/games/asteroids` y `/games/asteroids/play` cargan; un id inexistente da 404; sin errores de Suspense en consola.
8. Conectar `/games/[id]` a `getTopScores` y reemplazar `seededScores`; crear el estado vacío «¡Sé el primero en registrar tu puntaje!» en una fila del leaderboard. Verificar: todos los juegos muestran la fila vacía.
9. Conectar `HallOfFame` a `getAllTopScores` (cargado en el servidor y pasado como prop por juego), con podio y tabla en estado vacío coherente. Verificar: cada pestaña muestra el estado vacío sin errores de hidratación.
10. Crear la Server Action `saveScore` y conectarla al botón "GUARDAR PUNTUACIÓN" del modal en `components/game-player.tsx` solo para `asteroids` (validar nombre de 3–10 caracteres, estado de carga, mensaje de error en español, refrescar el ranking). Verificar: jugar, perder, guardar, y ver la fila en `leaderboard` con `user_id` nulo.
11. Eliminar `lib/scores.ts`. Verificar: `npx tsc --noEmit`, `npm run lint` y `npm run build` pasan.
12. Probar con datos de prueba: insertar filas con `execute_sql` para `asteroids` y un juego mock, comprobar orden, `best` y podio, y borrarlas. Ejecutar `get_advisors` (security y performance).

## Criterios de aceptación

- [ ] `npm run build`, `npm run lint` y `npx tsc --noEmit` terminan sin errores.
- [ ] `list_migrations` muestra las tres migraciones y el mismo SQL existe en `supabase/migrations/`.
- [ ] `games` y `leaderboard` tienen RLS activado; `games` solo tiene `SELECT` y `leaderboard` tiene `SELECT` más la política temporal de `INSERT`.
- [ ] Un `insert` en `leaderboard` con `game_id = 'asteroids'` y `user_id` nulo es aceptado con la publishable key.
- [ ] Un `insert` con otro `game_id` o con `user_id` no nulo es rechazado, y `update`/`delete` en `leaderboard` y cualquier escritura en `games` también.
- [ ] Al terminar una partida de `asteroids` y pulsar "GUARDAR PUNTUACIÓN" se crea una fila con `game_id = 'asteroids'`, el nombre y el puntaje finales y `user_id` nulo.
- [ ] Tras guardar, el modal muestra "PUNTUACIÓN GUARDADA" y la fila aparece en `/games/asteroids` y en el Salón de la Fama.
- [ ] Nombres de menos de 3 caracteres o puntajes inválidos no se guardan y el modal muestra un error en español.
- [ ] Si falla el guardado, el modal muestra un error y permite reintentar sin perder el puntaje.
- [ ] Los demás juegos conservan el guardado mock y no escriben en la base.
- [ ] `leaderboard.score` negativo y `player_name` fuera de 3–12 caracteres son rechazados por `CHECK`.
- [ ] `games` contiene únicamente la fila `asteroids` tras la migración.
- [ ] `GAMES` en `lib/games.ts` no contiene `asteroids` y `/games` muestra "ASTEROIDES" exactamente una vez.
- [ ] El home sigue mostrando los mismos 6 juegos en la vista previa.
- [ ] `/games/asteroids` y `/games/asteroids/play` funcionan con datos de la tabla; un id inexistente devuelve 404.
- [ ] Un juego sin filas en `leaderboard` (hardcodeado o `asteroids`) muestra en `/games/[id]` una fila «¡Sé el primero en registrar tu puntaje!» en lugar del ranking simulado.
- [ ] Cada pestaña del Salón de la Fama muestra el mismo estado vacío cuando no hay registros.
- [ ] Con filas de prueba, el ranking se ordena por puntaje descendente (desempate por fecha) y el podio muestra el top 3.
- [ ] "Mejor global" de `asteroids` refleja el `MAX(score)` del leaderboard (0 si está vacío).
- [ ] Con `NEXT_PUBLIC_SUPABASE_URL` inválida, `/games` sigue mostrando los 8 juegos mock sin error 500.
- [ ] `lib/scores.ts` no existe y no hay referencias a `seededScores`.
- [ ] `get_advisors` de seguridad no reporta problemas nuevos (sin `rls_disabled`, sin función con `search_path` mutable).
- [ ] Sin errores de Suspense ni de hidratación en la consola de ninguna pantalla afectada.

## Decisiones tomadas y descartadas

- **Sí:** `player_name` como texto libre (3–12 caracteres). No hay auth todavía.
- **Sí:** columna `user_id` nullable sin FK, creada ya. Evita una migración de esquema posterior; la FK y el `NOT NULL` llegan con auth.
- **Sí:** INSERT anónimo temporal solo para `asteroids` (decisión del usuario, para probar el flujo de guardado). Riesgo asumido: cualquiera con la publishable key puede falsificar puntajes de `asteroids`; se mitiga con `CHECK`s y se retira en la spec de auth.
- **No:** INSERT abierto para todos los `game_id`. Ampliaría el riesgo a juegos que ni siquiera son jugables.
- **Sí:** guardado vía Server Action y no inserción directa desde el navegador. Centraliza validación y deja un único punto para exigir sesión después.
- **Sí:** lectura pública. El resto de escrituras (UPDATE/DELETE) quedan sin política.
- **Sí:** `games` solo con `asteroids` (decisión del usuario). El resto migra al portarse cada juego.
- **Sí:** catálogo híbrido; `asteroids` se elimina del mock para no duplicarse (decisión del usuario).
- **Sí:** `leaderboard.game_id` sin FK. Los juegos hardcodeados necesitan ranking sin tener fila en `games`. Contrapartida: sin integridad referencial hasta que se migren todos; la FK irá en una spec posterior.
- **No:** FK + seed de los 9 juegos. Contradice la decisión de que solo `asteroids` venga de la tabla.
- **Sí:** `CHECK` de formato slug sobre `game_id` para mitigar la falta de FK.
- **Sí:** sin seed de puntuaciones; los rankings quedan vacíos con la frase «¡Sé el primero…». Más honesto que datos inventados y no mezcla datos de prueba con reales.
- **Sí:** eliminar `seededScores`. Dejaría código muerto y datos simulados contradictorios con el estado vacío.
- **Sí:** `best` calculado en una vista (`games_catalog`) y no almacenado. Evita desincronización con el leaderboard.
- **Sí:** vista con `security_invoker = true`. Respeta RLS de las tablas base.
- **Sí:** `top_scores(p_limit)` en una sola consulta para el Salón de la Fama. Evita 9 llamadas por pestaña.
- **Sí:** `plays_count` almacenado, sin incrementar. El conteo real depende del guardado de partidas.
- **Sí:** degradar a mock/vacío si Supabase falla. El catálogo no debe depender de la disponibilidad de la base de datos para renderizar.

## Riesgos identificados

| Riesgo                                                               | Mitigación                                                                                                          |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `cacheComponents` prerenderiza o cachea consultas y oculta cambios   | Leer la guía antes del paso 5; definir explícitamente qué se cachea (`use cache` + revalidación) y qué es dinámico. |
| `generateStaticParams` ya no es síncrono si depende de la tabla      | Usar `getGames()` con fallback al mock; verificar `npm run build` sin Supabase accesible.                           |
| `game_id` sin FK permite ids huérfanos                               | `CHECK` de slug y la FK diferida a una spec posterior; documentado en decisiones.                                   |
| Puntajes falsificados por INSERT anónimo temporal | `CHECK` de rango, política limitada a `asteroids`, nombrada como temporal; se elimina en la spec de auth y se limpian filas de prueba. |
| Vista sin `security_invoker` evadiría RLS                            | Crearla con `security_invoker = true` y confirmarlo con `get_advisors`.                                             |
| Duplicados si `asteroids` queda en mock y en tabla                   | Criterio de aceptación explícito y filtro por `id` en el fusionador, con prioridad a la tabla.                      |
| Error de `params` fuera de `<Suspense>` en `/games/[id]` y `/play`   | Mantener `await params` dentro de componentes envueltos en `<Suspense>`; revisar la consola.                        |
| `HallOfFame` es cliente y no puede consultar con el cliente servidor | Cargar `getAllTopScores` en el servidor y pasarlo como prop serializable.                                           |
| Función `top_scores` con `search_path` mutable                       | `set search_path = ''` y nombres de esquema calificados.                                                            |

## Lo que **no** entra en esta spec

- Guardado de puntuaciones de juegos distintos de `asteroids`.
- Exigir sesión, `user_id` real y FK a `auth.users`.
- Anti-trampas robustas y rate limit.
- Autenticación.
- Migración de los otros 8 juegos a `games` y FK en `leaderboard`.
- Contador real de partidas y Realtime.
- Tests automatizados.

Cada uno, si se hace, va en su propia spec.
