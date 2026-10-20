# SPEC 08 — Juego Tetris integrado en la plataforma

> **Estado:** Approved
> **Depende de:** SPEC 05, SPEC 06, SPEC 07
> **Fecha:** 2026-10-19
> **Objetivo:** Portar `references/started-games/03-tetris/` a un motor TypeScript, registrarlo en `games` y jugarlo en `/games/tetris/play` con HUD de la plataforma, pausa, botón TEMA y guardado de puntaje en `leaderboard`.

## Alcance

**Dentro:**

- Motor en `lib/games/tetris/` (`types.ts`, `constants.ts`, `entities.ts`, `input.ts`, `render.ts`, `engine.ts`) portado de `game.js` con el contrato de Asteroides: `createTetrisEngine(canvas, callbacks)` devuelve `start`, `pause`, `resume`, `endGame`, `restart`, `destroy` y, además, `setTheme`; sin globals ni acceso a `document`/`window` al importar; callbacks solo cuando cambia el valor; `restart` emite los valores iniciales; `destroy` idempotente; pausa automática en `visibilitychange`.
- Reglas, física, puntajes y controles del original, incluida la 8ª pieza «N» (tuerca) que está en `game.js` y no en el README: tablero 10×20, bloque 30 px, 8 piezas con igual probabilidad, wall kicks `[0, -1, 1, -2, 2]`, ghost piece (`globalAlpha` 0.2), soft drop +1 por fila, hard drop +2 por celda, puntaje de líneas `[0, 100, 300, 500, 800] × nivel`, nivel = `floor(líneas / 10) + 1`, intervalo de caída `max(100, 1000 − (nivel − 1) × 90)` ms.
- Controles del original: `←` `→` mover, `↑` o `X` rotar, `↓` soft drop, `Espacio` hard drop, `P` pausar/reanudar.
- Canvas único de resolución interna 600×600: tablero de 300×600 centrado (x = 150) como en Asteroides, y panel de 150 px a la derecha dibujado por el motor (SCORE, LINES, LEVEL, siguiente pieza y lista de controles). El lado izquierdo queda libre.
- Overlay «GAME OVER» dibujado sobre el tablero. La pausa la muestra el CRT de la plataforma («EN PAUSA»); el reinicio solo ocurre con el botón «JUGAR DE NUEVO» del modal (Espacio no reinicia).
- Tema claro/oscuro del original conservado con un botón «TEMA» en la barra de acciones de `GamePlayer` (visible solo en Tetris). Cambia la paleta del canvas vía `engine.setTheme`; la preferencia persiste en `localStorage` con la clave `tetris-theme` (acceso en `try/catch`, solo en cliente).
- Callbacks: `onScoreChange`, `onLevelChange`, `onPauseChange` (la tecla `P` y el botón PAUSA comparten estado) y `onGameOver`. Sin `onLivesChange` ni `onLinesChange`: las líneas solo se ven en el panel del canvas.
- HUD de la plataforma: Jugador, Puntuación, Vidas (un solo «♥» fijo, sin vidas reales) y Nivel.
- Componente cliente `components/tetris-canvas.tsx` que monta y destruye el motor.
- Migración que inserta `tetris` en `public.games` (`PUZZLE`, `magenta`, cover `cover-tetris`) con estos textos:
  - `short`: «Apila, rota y limpia líneas antes de que llegue arriba.»
  - `long`: «Encaja las piezas que caen, completa filas para limpiarlas y sube de nivel cada 10 líneas. Cuidado con la tuerca: es hueca y difícil de encajar.»
- Migración que reemplaza la política temporal de `INSERT` de `leaderboard` para aceptar `asteroids` y `tetris` (mantiene `user_id is null`).
- Estilo `.cover-tetris` en `app/globals.css`: pila de piezas neón (paleta del juego) sobre fondo violeta oscuro, con una pieza cayendo y su ghost y brillo magenta. Distinta de `.cover-tetro`, que ya existe del catálogo mock.
- Integración en `components/game-player.tsx`: caso `tetris` en `renderGame`, config por juego mínima (ver Modelo de datos) y botón TEMA.
- Verificar que `saveScore` y `lib/score-rules.ts` aceptan el juego sin cambios de código y que el modal guarda en `leaderboard`.
- Solo teclado, textos visibles en español, código en inglés.

**Fuera de alcance (para futuras specs):**

- Controles táctiles / móvil.
- Sonido (el original no tiene).
- Autenticación y retiro de la política temporal de `INSERT`.
- Anti-trampas y validación de puntaje en servidor.
- Contador real de partidas (`plays_count`), `best` distinto de `MAX(score)`, Realtime.
- Mecánicas nuevas que no estén en el original (hold, 7-bag, rotación SRS, ghost opcional, niveles de inicio).
- Tests automatizados.
- Otros juegos del catálogo (Arkanoid y demás).

## Modelo de datos

Fila nueva en `games` (migración `<timestamp>_insert_tetris_game.sql`):

```sql
insert into public.games (id, title, short, long, category, cover, color)
values ('tetris', 'TETRIS', '<short>', '<long>', 'PUZZLE', 'cover-tetris', 'magenta');
```

Política de `INSERT` (migración `<timestamp>_extend_temporary_insert_policy_to_tetris.sql`). El nombre vigente se confirma con `pg_policies` antes de escribirla; al ampliarla deja de ser exacto («for asteroids»), así que se renombra:

```sql
drop policy "temporary anonymous insert for asteroids" on public.leaderboard;

create policy "temporary anonymous insert for ported games" on public.leaderboard
  for insert to anon, authenticated
  with check (game_id in ('asteroids', 'tetris') and user_id is null);
```

Tipos del motor (`lib/games/tetris/types.ts`):

```ts
interface TetrisCallbacks {
  onScoreChange: (score: number) => void;
  onLevelChange: (level: number) => void;
  onPauseChange: (isPaused: boolean) => void;
  onGameOver: (finalScore: number) => void;
}

interface TetrisEngine {
  start: () => void;
  pause: () => void;
  resume: () => void;
  endGame: () => void;
  restart: () => void;
  destroy: () => void;
  setTheme: (theme: TetrisTheme) => void;
}

type TetrisTheme = "dark" | "light";
type PieceType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // I O T S Z J L N
type Cell = 0 | PieceType;
interface ActivePiece {
  type: PieceType;
  shape: number[][];
  x: number;
  y: number;
}

function createTetrisEngine(
  canvas: HTMLCanvasElement,
  callbacks: TetrisCallbacks,
): TetrisEngine;
```

Config por juego en `components/game-player.tsx` (reemplaza `isRealGame = gameId === "asteroids"`):

```ts
const REAL_GAMES = {
  asteroids: { hasLives: true, hasThemeToggle: false },
  tetris: { hasLives: false, hasThemeToggle: true },
} as const;
```

Archivos:

| Archivo                                                              | Contenido                                                                                                 |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `lib/games/tetris/types.ts`                                          | Interfaces y tipos anteriores                                                                             |
| `lib/games/tetris/constants.ts`                                      | `COLS`, `ROWS`, `BLOCK`, `WIDTH`, `HEIGHT`, `BOARD_X`, `COLORS`, `PIECES`, `LINE_SCORES`, paletas de tema |
| `lib/games/tetris/entities.ts`                                       | Lógica pura del tablero: `createBoard`, `randomPiece`, `collide`, `rotateCW`, `merge`, `clearLines`       |
| `lib/games/tetris/input.ts`                                          | Teclado: mapa de códigos a acciones, `preventDefault` en flechas/Espacio, alta/baja de listeners          |
| `lib/games/tetris/render.ts`                                         | Dibujo: cuadrícula, tablero, ghost, pieza actual, panel lateral, overlay GAME OVER                        |
| `lib/games/tetris/engine.ts`                                         | `createTetrisEngine`: estado, loop, puntaje, nivel, pausa, callbacks                                      |
| `components/tetris-canvas.tsx`                                       | Cliente: monta/destruye el motor, aplica `isPaused` y `theme`                                             |
| `supabase/migrations/*_insert_tetris_game.sql`                       | Seed de `tetris`                                                                                          |
| `supabase/migrations/*_extend_temporary_insert_policy_to_tetris.sql` | Política de `INSERT` ampliada                                                                             |

Convenciones:

- Las constantes de `game.js` se portan literalmente, con `COLORS` y `PIECES` indexados por tipo de pieza (índice 0 vacío).
- Origen del port: `references/started-games/03-tetris/game.js`. No se copia su código a la spec.
- Cálculo de `dt`: acumulador contra `dropInterval` como el original. Al reanudar tras pausa o `visibilitychange` se reinicia `lastTime` para evitar saltos.
- `onPauseChange` solo se emite en cambios reales de estado (`P`, `pause`, `resume`, visibilidad) y el motor ignora `pause`/`resume` redundantes, para que el efecto de `GamePlayer` no genere bucles.
- En game over el motor ignora todas las teclas, incluida `P`.
- Tecla `P` y botón PAUSA: el motor emite `onPauseChange`; `GamePlayer` es el dueño de `isPaused`.
- Las flechas y `Espacio` llaman a `preventDefault` mientras el motor está activo (adaptación al navegador embebido; el original solo lo hacía con `Espacio`).
- Tema: `GamePlayer` lee `localStorage["tetris-theme"]` en un `useEffect` (valor inicial `dark` para no romper la hidratación) y lo escribe al pulsar TEMA.
- Los colores de las piezas son los del original en ambos temas; el tema cambia fondo, cuadrícula y textos del canvas.
- Las líneas y la siguiente pieza se dibujan solo en el canvas; no hay estado de React para ellas.

## Plan de implementación

Antes de escribir código Next.js, leer en `node_modules/next/dist/docs/` la guía de Client Components y la de `cacheComponents` (data fetching y `use cache`). Usar `/frontend-design` para `.cover-tetris`, el marco del canvas y el botón TEMA. Mantener `params` dentro de `<Suspense>` en `/games/[id]` y `/games/[id]/play`.

1. Crear y aplicar la migración que inserta `tetris` en `games` (`apply_migration`) y guardar el mismo SQL en `supabase/migrations/`. Verificar: `list_migrations` la muestra y `select id from public.games` devuelve `asteroids` y `tetris`.
2. Consultar `pg_policies` para confirmar el nombre vigente de la política de `INSERT`, crear y aplicar la migración que la reemplaza (y su archivo en `supabase/migrations/`). Verificar: un `insert` con rol `anon` para `tetris` con `user_id` nulo funciona (borrar la fila de prueba), para otro `game_id` o con `user_id` no nulo es rechazado, y `get_advisors` de seguridad no reporta problemas nuevos.
3. Agregar `.cover-tetris` en `app/globals.css` (revisar antes colisiones de nombre con `.cover-tetro`). Verificar: `/games` muestra la tarjeta «TETRIS» con su portada y los filtros `PUZZLE` y `TODOS` la incluyen.
4. Crear `lib/games/tetris/types.ts` y `constants.ts` (piezas incluida la N, colores, puntajes, paletas de tema, geometría 600×600). Verificar: `npx tsc --noEmit` pasa.
5. Crear `entities.ts` (lógica pura del tablero) e `input.ts` (acciones de teclado). Verificar: `npx tsc --noEmit` pasa.
6. Crear `engine.ts` con estado, loop, caída, bloqueo de pieza, limpieza de líneas, puntaje, nivel, pausa (`P`, `visibilitychange`), `endGame`, `restart`, `destroy` y callbacks; sin dibujo real todavía (llamada a un `draw` vacío). Verificar: `npx tsc --noEmit` y `npm run lint` pasan.
7. Crear `render.ts` (tablero, ghost, pieza, panel lateral, overlay GAME OVER, paletas claro/oscuro) y conectarlo al motor con `setTheme`. Verificar: `npx tsc --noEmit` y `npm run lint` pasan.
8. Crear `components/tetris-canvas.tsx` (`"use client"`): crea el motor en `useEffect`, lo destruye al desmontar, aplica `isPaused` y `theme`, expone `endGame`/`restart` por `ref`. Verificar: el juego se ve y responde al teclado en `/games/tetris/play` una vez conectado el caso mínimo en `GamePlayer`.
9. Integrar en `GamePlayer`: `REAL_GAMES` sustituye a `isRealGame`; caso `tetris` en `renderGame`; VIDAS muestra un «♥» fijo cuando `hasLives` es falso; `onPauseChange` actualiza `isPaused`; botón TEMA con persistencia en `localStorage`; FIN, «JUGAR DE NUEVO», modal de game over y `saveScore` funcionan para ambos juegos. Verificar: puntaje y nivel del HUD coinciden con los del canvas, `P` y el botón PAUSA se mantienen sincronizados, y el flujo de Asteroides no cambia.
10. Estilos del canvas (`.tetris-canvas`: ancho 100%, `aspect-ratio: 1 / 1`, centrado dentro del CRT, sin desbordes). Verificar: sin scroll horizontal a 375px y a 1280px.
11. Flujo completo con Playwright (jugar, mover/rotar/soltar, pausar con `P` y con el botón, cambiar tema, perder, guardar puntaje, verlo en `/games/tetris` y `/hall-of-fame`) y comprobar la consola. Luego ejecutar `npm run lint`, `npx tsc --noEmit` y `npm run build`.

## Criterios de aceptación

- [ ] `npm run build`, `npm run lint` y `npx tsc --noEmit` terminan sin errores.
- [ ] `select id from public.games` contiene `asteroids` y `tetris`.
- [ ] `list_migrations` muestra las dos migraciones nuevas y el mismo SQL existe en `supabase/migrations/`.
- [ ] `/games` muestra la tarjeta «TETRIS» (`PUZZLE`) con `.cover-tetris`, junto a «ASTEROIDES»; los filtros `PUZZLE` y `TODOS` la incluyen y `ARCADE`/`VERSUS` no.
- [ ] `/games/tetris` y `/games/tetris/play` cargan; un id inexistente sigue devolviendo 404.
- [ ] Los controles `←` `→` `↑`/`X` `↓` `Espacio` `P` funcionan como en el original.
- [ ] Hay 8 tipos de pieza, incluida la tuerca gris 3×3 hueca; la rotación aplica los wall kicks `[0, -1, 1, -2, 2]`.
- [ ] Soft drop suma 1 punto por fila, hard drop suma 2 por celda, y 1/2/3/4 líneas suman 100/300/500/800 × nivel.
- [ ] El nivel sube cada 10 líneas y el intervalo de caída es `max(100, 1000 − (nivel − 1) × 90)` ms.
- [ ] El ghost piece se muestra donde aterrizará la pieza actual.
- [ ] El tablero está centrado en el canvas y el panel lateral (SCORE, LINES, LEVEL, NEXT, controles) aparece a su derecha.
- [ ] El HUD de la plataforma muestra Puntuación y Nivel iguales a los del canvas en todo momento, y VIDAS muestra un único «♥».
- [ ] La pausa congela la caída e ignora las teclas de juego; `P` y el botón PAUSA/REANUDAR se mantienen sincronizados (el CRT muestra «EN PAUSA» en ambos casos).
- [ ] Cambiar de pestaña pausa el juego y al volver no hay salto en la caída.
- [ ] FIN y la llegada de una pieza a la parte superior abren el modal con el puntaje real y el canvas muestra «GAME OVER».
- [ ] En game over `Espacio` y `P` no reinician ni reanudan; solo «JUGAR DE NUEVO» reinicia con puntaje 0, nivel 1 y tablero vacío en canvas y HUD.
- [ ] El botón TEMA cambia entre paleta clara y oscura del canvas, y la preferencia sobrevive a recargar la página; sin `localStorage` el juego sigue funcionando en oscuro.
- [ ] El botón TEMA solo aparece en Tetris.
- [ ] Guardar crea una fila en `leaderboard` con `game_id = 'tetris'`, `user_id` nulo, el nombre y el puntaje finales, visible en `/games/tetris` y en el Salón de la Fama.
- [ ] Un nombre de menos de 3 caracteres o un puntaje inválido se rechazan con un error en español.
- [ ] Un `insert` con otro `game_id` (o `user_id` no nulo) sigue rechazado por RLS.
- [ ] Destruir el motor (SALIR o navegación) no deja listeners de teclado ni `requestAnimationFrame` activos, también con el doble montaje de `StrictMode`.
- [ ] Las flechas y `Espacio` no hacen scroll de la página mientras se juega.
- [ ] El canvas escala sin scroll horizontal a 375px y a 1280px.
- [ ] Sin errores de hidratación ni de Suspense en la consola de las pantallas afectadas.
- [ ] Asteroides sigue funcionando (HUD con 3 vidas, pausa, fin, reinicio, guardado).

## Decisiones tomadas y descartadas

- **Sí:** `id` `tetris`, título `TETRIS`, categoría `PUZZLE`, color `magenta` (decisión del usuario). Contrasta con el cyan de Asteroides.
- **Sí:** conservar la pieza «N» (tuerca) de `game.js` (decisión del usuario). Es el comportamiento real del código fuente, aunque el README hable de 7 piezas.
- **Sí:** VIDAS muestra un único «♥» fijo (decisión del usuario), sin callback de vidas. Mantiene el HUD uniforme sin inventar mecánicas.
- **No:** mostrar LÍNEAS en el HUD de la plataforma. No se pidió; las líneas se ven en el panel del canvas.
- **Sí:** conservar `P` además del botón PAUSA (decisión del usuario). Requiere `onPauseChange` para evitar desincronización.
- **Sí:** canvas único 600×600 con tablero centrado y panel a la derecha (decisión del usuario). Sigue el patrón de Asteroides y evita un segundo canvas.
- **No:** segundo canvas para NEXT como en el original. Añade lógica de montaje y estilos sin beneficio.
- **Sí:** `Espacio` no reinicia en game over (decisión del usuario). Es hard drop y se pulsa de forma repetida.
- **Sí:** conservar el toggle claro/oscuro como botón «TEMA» en la barra de acciones (decisión del usuario). Alternativas descartadas: tecla `T` dentro del motor (sin UI visible) y eliminar el toggle (pierde una función del original).
- **Sí:** `localStorage` solo para la preferencia de tema, con lectura en `useEffect` y valor inicial `dark`. Evita errores de hidratación; la preferencia es un conveniente por navegador, no un dato crítico.
- **Sí:** textos del catálogo propuestos en la entrevista (decisión del usuario).
- **Sí:** portada `.cover-tetris` con pila de piezas neón sobre violeta oscuro (decisión del usuario), diseñada con `/frontend-design`.
- **Sí:** config por juego mínima (`REAL_GAMES`) en `GamePlayer` (decisión del usuario). Reemplaza `isRealGame` sin un refactor mayor.
- **Sí:** reemplazar la política temporal de `INSERT` y renombrarla («for ported games»), porque el nombre «for asteroids» dejaría de ser cierto; sigue siendo fácil de localizar y retirar en la spec de auth.
- **No:** crear una segunda política de `INSERT` solo para `tetris`. Duplicaría una política que debe retirarse junta.
- **Sí:** `preventDefault` en flechas y `Espacio` mientras el motor está activo. En la plataforma, a diferencia del original, la página sí puede hacer scroll.
- **Sí:** reiniciar `lastTime` al reanudar. El original no limita `dt` y la pausa por visibilidad evitaría el salto de todos modos.
- **Sí:** alcance por defecto: solo teclado, sin sonido, sin mecánicas nuevas (decisión del usuario).

## Riesgos identificados

| Riesgo                                                                            | Mitigación                                                                                                                         |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `GamePlayer` está fijo a un solo juego (`isRealGame`, 3 vidas, sin pausa externa) | `REAL_GAMES` con `hasLives` y `hasThemeToggle`; verificar Asteroides tras el cambio (criterio de aceptación).                      |
| Nombre exacto de la política de `INSERT` distinto al documentado                  | Consultar `pg_policies` antes de escribir el `drop policy`; verificar con inserts de prueba como `anon`.                           |
| Doble montaje en `StrictMode` duplica listeners y loops                           | `destroy()` idempotente y llamado en el cleanup del `useEffect`; criterio de aceptación sobre listeners.                           |
| Bucle `onPauseChange` ↔ `isPaused` entre motor y `GamePlayer`                     | El motor ignora `pause`/`resume` redundantes y solo emite en cambios reales.                                                       |
| `cacheComponents` cambia la semántica de render                                   | Leer la guía antes del paso 8; la página de juego es un shell con un componente cliente.                                           |
| `params` fuera de `<Suspense>` en `/games/[id]` y `/play`                         | Mantener `await params` dentro de componentes envueltos en `<Suspense>`; revisar la consola.                                       |
| Hidratación por el tema leído de `localStorage`                                   | Valor inicial `dark` y lectura en `useEffect`; `try/catch` en lectura y escritura.                                                 |
| Controles distintos a Asteroides (`Espacio` es hard drop, repetición de teclas)   | La repetición de `keydown` mueve la pieza como en el original; `Espacio` no reinicia; el motor ignora teclas en pausa y game over. |
| Colisión de nombre `.cover-tetris` / `.cover-tetro`                               | Revisar `app/globals.css` antes del paso 3 y usar un nombre exclusivo.                                                             |
| Panel y tablero ilegibles al escalar el canvas en pantallas pequeñas              | Resolución interna fija 600×600 y verificación a 375px en el paso 10.                                                              |
| Puntajes falsificados por el `INSERT` anónimo temporal                            | Riesgo ya asumido en la SPEC 06; se mitiga con los `CHECK` y se retira en la spec de auth.                                         |

## Lo que **no** entra en esta spec

- Controles táctiles o móvil.
- Sonido y mecánicas nuevas (hold, 7-bag, SRS, niveles de inicio).
- Autenticación, retiro de la política temporal y anti-trampas.
- Contador real de partidas y Realtime.
- Otros juegos del catálogo.
- Tests automatizados.

Cada uno, si se hace, va en su propia spec.
