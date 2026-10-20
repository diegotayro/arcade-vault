# SPEC 10 — Juego Snake integrado en la plataforma

> **Estado:** Approved
> **Depende de:** SPEC 05, SPEC 06, SPEC 07, SPEC 08, SPEC 09
> **Fecha:** 2026-10-19
> **Objetivo:** Crear un Snake nuevo con motor TypeScript y las frutas de `references/source-assets/snake-assets/`, registrarlo en `games` y jugarlo en `/games/snake/play` con HUD de la plataforma, pausa y guardado de puntaje en `leaderboard`.

## Alcance

**Dentro:**

- Motor en `lib/games/snake/` (`types.ts`, `constants.ts`, `sprites.ts`, `entities.ts`, `input.ts`, `render.ts`, `engine.ts`) con el contrato de Asteroides y Arkanoid: `createSnakeEngine(canvas, callbacks)` devuelve `start`, `pause`, `resume`, `endGame`, `restart`, `destroy`; sin globals ni acceso a `document`/`window`/`Image` al importar; callbacks solo cuando cambia el valor; `restart` emite los valores iniciales; `destroy` idempotente; pausa automática en `visibilitychange`.
- Reglas del juego (diseño nuevo, estilo Snake clásico):
  - Canvas 800×600, grilla de 20 columnas × 15 filas con celdas de 40 px.
  - La serpiente avanza una celda por tick en su dirección; empieza con 3 segmentos en el centro, mirando a la derecha.
  - Chocar con una pared o con su propio cuerpo termina la partida (sin wrap-around, sin vidas).
  - Hay una sola fruta a la vez, en una celda libre al azar; comerla suma 10 puntos y hace crecer un segmento.
  - Cada fruta tiene un sprite al azar entre las 22 del atlas; es solo cosmético, todas valen 10.
  - Nivel = 1 + `floor(frutasComidas / 5)`. El intervalo entre ticks empieza en 140 ms y baja 10 ms por nivel hasta un mínimo de 60 ms.
  - Si la serpiente ocupa las 300 celdas, el motor pasa a victoria, el canvas muestra «¡Tablero completo!» y se emite `onGameOver` con el puntaje real.
- Controles: `←` `↑` `→` `↓` y `W` `A` `S` `D` giran la serpiente; `P` o `Esc` pausan/reanudan. No se permite la reversa directa; hay una cola de máximo 2 giros para no perder pulsaciones rápidas entre ticks. `Espacio` no hace nada.
- Dibujo vectorial en canvas con estilo neón verde: fondo con grilla tenue, cuerpo con segmentos redondeados y brillo, cabeza con ojos orientados a la dirección. Las frutas se dibujan con el atlas de sprites, escaladas para caber en la celda sin deformarse.
- Sin sonido.
- Canvas dibuja su propio overlay «GAME OVER» y «¡Tablero completo!». La pausa la muestra el CRT de la plataforma («EN PAUSA»).
- Callbacks: `onScoreChange`, `onLevelChange`, `onPauseChange` y `onGameOver`. No hay `onLivesChange`. El HUD de la plataforma muestra Jugador, Puntuación, Vidas (un `♥` fijo, como Tetris) y Nivel.
- Componente cliente `components/snake-canvas.tsx` que monta y destruye el motor.
- Assets: `fruits.png` copiado a `public/games/snake/fruits.png`. El atlas de `sprites.js` se reescribe en `sprites.ts` como constante exportada (sin `window` ni `<script>`) y `sprites.js` no se copia al proyecto. El motor carga la imagen en `start()` y no arranca el loop hasta que carga; `destroy()` antes de la carga cancela el arranque.
- Migración que inserta `snake` en `public.games` (`ARCADE`, `green`, cover `cover-snake`) con estos textos:
  - `short`: «Come frutas, crece y no choques contigo ni con la pared.»
  - `long`: «Guía a la serpiente por una grilla, come frutas para sumar 10 puntos y crecer, y sube de nivel cada 5 frutas. Un solo choque termina la partida.»
- Migración que reemplaza la política temporal de `INSERT` de `leaderboard` para aceptar `asteroids`, `tetris`, `arkanoid` y `snake` (mantiene `user_id is null`).
- Estilo `.cover-snake` en `app/globals.css`: se **reemplaza** el mock existente (serpiente verde sobre fondo oscuro con una fruta magenta) por una portada nueva diseñada con `/frontend-design`.
- Integración en `components/game-player.tsx`: entrada `snake` en `REAL_GAMES` (`hasLives: false`, `hasThemeToggle: false`) y caso `snake` en `renderGame` con `onPauseChange`, sin `onLivesChange`.
- Verificar que `saveScore` y `lib/score-rules.ts` aceptan el juego sin cambios de código y que el modal guarda en `leaderboard`.
- Estilo `.snake-canvas` (ancho 100%, `aspect-ratio: 4 / 3`) junto a `.asteroids-canvas` y `.arkanoid-canvas`.
- Textos visibles en español, código en inglés.

**Fuera de alcance (para futuras specs):**

- Controles táctiles / móvil.
- Sonido, música o control de volumen.
- Vidas, obstáculos, niveles con muros, wrap-around, frutas especiales con puntos distintos u otros power-ups.
- Selector de dificultad o de tamaño de tablero.
- Autenticación y retiro de la política temporal de `INSERT`.
- Anti-trampas y validación de puntaje en servidor.
- Contador real de partidas (`plays_count`), `best` distinto de `MAX(score)`, Realtime.
- Tests automatizados.
- Otros juegos del catálogo.

## Modelo de datos

Fila nueva en `games` (migración `<timestamp>_insert_snake_game.sql`):

```sql
insert into public.games (id, title, short, long, category, cover, color)
values ('snake', 'SNAKE', '<short>', '<long>', 'ARCADE', 'cover-snake', 'green');
```

Política de `INSERT` (migración `<timestamp>_extend_temporary_insert_policy_to_snake.sql`). El nombre vigente se confirma con `pg_policies` antes de escribirla; hoy es `temporary anonymous insert for ported games` (SPEC 08, conservado en SPEC 09):

```sql
drop policy "temporary anonymous insert for ported games" on public.leaderboard;

create policy "temporary anonymous insert for ported games" on public.leaderboard
  for insert to anon, authenticated
  with check (game_id in ('asteroids', 'tetris', 'arkanoid', 'snake') and user_id is null);
```

Tipos del motor (`lib/games/snake/types.ts`):

```ts
interface SnakeCallbacks {
  onScoreChange: (score: number) => void;
  onLevelChange: (level: number) => void;
  onPauseChange: (isPaused: boolean) => void;
  onGameOver: (finalScore: number) => void;
}

interface SnakeEngine {
  start: () => void;
  pause: () => void;
  resume: () => void;
  endGame: () => void;
  restart: () => void;
  destroy: () => void;
}

type SnakeState = "playing" | "gameover" | "win";
type Direction = "up" | "down" | "left" | "right";
type FruitName = keyof typeof FRUIT_SPRITES;

interface Cell {
  col: number;
  row: number;
}
interface Fruit extends Cell {
  name: FruitName;
}
interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function createSnakeEngine(
  canvas: HTMLCanvasElement,
  callbacks: SnakeCallbacks,
): SnakeEngine;
```

Constantes (`constants.ts`):

```ts
const WIDTH = 800;
const HEIGHT = 600;
const CELL_SIZE = 40;
const COLS = 20;
const ROWS = 15;
const INITIAL_LENGTH = 3;
const POINTS_PER_FRUIT = 10;
const FRUITS_PER_LEVEL = 5;
const INITIAL_TICK_MS = 140;
const TICK_STEP_MS = 10;
const MIN_TICK_MS = 60;
const MAX_INPUT_QUEUE = 2;
const MAX_DT = 0.05;
const FRUITS_SPRITESHEET_URL = "/games/snake/fruits.png";
```

Config por juego en `components/game-player.tsx` (se amplía `REAL_GAMES` de la SPEC 09):

```ts
const REAL_GAMES = {
  asteroids: { hasLives: true, hasThemeToggle: false },
  tetris: { hasLives: false, hasThemeToggle: true },
  arkanoid: { hasLives: true, hasThemeToggle: false },
  snake: { hasLives: false, hasThemeToggle: false },
} as const;
```

Archivos:

| Archivo                                                             | Contenido                                                                                                                     |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `lib/games/snake/types.ts`                                          | Interfaces y tipos anteriores                                                                                                 |
| `lib/games/snake/constants.ts`                                      | Dimensiones, grilla, puntos, velocidades, `MAX_DT`, ruta del spritesheet                                                      |
| `lib/games/snake/sprites.ts`                                        | `FRUIT_SPRITES` (atlas de 22 frutas, coordenadas de `sprites.js`), `loadFruitsSpritesheet`, `drawFruit`                       |
| `lib/games/snake/entities.ts`                                       | Lógica pura: `createSnake`, `nextHead`, `isOppositeDirection`, `isOutOfBounds`, `hitsBody`, `pickFreeCell`, `tickIntervalFor` |
| `lib/games/snake/input.ts`                                          | Teclado (flechas, WASD, `P`/`Esc`), cola de giros, `preventDefault` en flechas, alta/baja de listeners                        |
| `lib/games/snake/render.ts`                                         | Fondo y grilla, cuerpo, cabeza, fruta, overlays GAME OVER y tablero completo                                                  |
| `lib/games/snake/engine.ts`                                         | `createSnakeEngine`: estado, loop con acumulador de ticks, crecimiento, niveles, victoria, pausa, callbacks                   |
| `components/snake-canvas.tsx`                                       | Cliente: monta/destruye el motor, aplica `isPaused`                                                                           |
| `public/games/snake/fruits.png`                                     | Copia de `references/source-assets/snake-assets/fruits.png`                                                                   |
| `supabase/migrations/*_insert_snake_game.sql`                       | Seed de `snake`                                                                                                               |
| `supabase/migrations/*_extend_temporary_insert_policy_to_snake.sql` | Política de `INSERT` ampliada                                                                                                 |

Convenciones:

- Origen de los sprites: `references/source-assets/snake-assets/sprites.js` y `fruits.png` (obtenidos de The Spriters Resource, «Google Snake Game»). El juego en sí no tiene código de referencia, es un diseño nuevo.
- Las coordenadas del atlas se portan literalmente. Cada fruta se dibuja escalada para encajar en una celda de 40 px con margen, preservando su proporción (los recortes miden 110–170 × 160 px) y centrada.
- Coordenadas de grilla con origen arriba a la izquierda; `dt` en segundos.
- El loop usa `requestAnimationFrame` con un acumulador: cada frame suma `dt` (limitado con `MAX_DT`) y avanza un tick cada vez que supera el intervalo del nivel. El render ocurre en cada frame.
- Al reanudar tras pausa o `visibilitychange` se reinicia `lastTime` y el acumulador no conserva tiempo.
- Orden del tick: aplicar el siguiente giro válido de la cola, calcular la cabeza nueva, comprobar pared y cuerpo (la cola actual no cuenta como choque si no se come), comer fruta y crecer, subir de nivel, comprobar tablero completo.
- La cola de giros descarta direcciones iguales a la última o contrarias a ella, y no pasa de `MAX_INPUT_QUEUE`.
- La pausa congela ticks y descarta teclas de giro. En `gameover` y `win` el motor ignora `P`/`Esc`.
- `onPauseChange` solo se emite en cambios reales; el motor ignora `pause`/`resume` redundantes.
- `endGame` (botón FIN) pasa a `gameover`, dibuja el overlay y emite `onGameOver` con el puntaje actual.
- `restart` deja el estado inicial (puntaje 0, nivel 1, longitud 3) y emite puntaje y nivel iniciales.
- Las flechas, `Espacio` y las teclas del juego llaman a `preventDefault` mientras el motor está activo.
- El PNG se sirve desde `/games/snake/fruits.png` (ruta absoluta).

## Plan de implementación

Antes de escribir código Next.js, leer en `node_modules/next/dist/docs/` la guía de Client Components y la de `cacheComponents` (data fetching y `use cache`). Usar `/frontend-design` para `.cover-snake` y el marco del canvas. Mantener `params` dentro de `<Suspense>` en `/games/[id]` y `/games/[id]/play`.

1. Crear y aplicar la migración que inserta `snake` en `games` (`apply_migration`) y guardar el mismo SQL en `supabase/migrations/`. Verificar: `list_migrations` la muestra y `select id from public.games` devuelve `asteroids`, `tetris`, `arkanoid` y `snake`.
2. Consultar `pg_policies` para confirmar el nombre vigente de la política de `INSERT`, crear y aplicar la migración que la reemplaza (y su archivo en `supabase/migrations/`). Verificar: un `insert` con rol `anon` para `snake` con `user_id` nulo funciona (borrar la fila de prueba), para otro `game_id` o con `user_id` no nulo es rechazado, los otros tres juegos siguen aceptados, y `get_advisors` de seguridad no reporta problemas nuevos.
3. Reemplazar `.cover-snake` en `app/globals.css` con la portada nueva. Verificar: `/games` muestra la tarjeta «SNAKE» con su portada y los filtros `ARCADE` y `TODOS` la incluyen.
4. Copiar `fruits.png` a `public/games/snake/`. Verificar: `curl -I` a `/games/snake/fruits.png` devuelve 200 con el servidor de desarrollo.
5. Crear `lib/games/snake/types.ts` y `constants.ts`. Verificar: `npx tsc --noEmit` pasa.
6. Crear `sprites.ts` (atlas y carga de imagen sin ejecutar nada al importar) y `entities.ts` (lógica pura). Verificar: `npx tsc --noEmit` pasa.
7. Crear `input.ts` (teclado, cola de giros, pausa, `preventDefault`). Verificar: `npx tsc --noEmit` pasa.
8. Crear `engine.ts` con estado, loop con acumulador y `MAX_DT`, crecimiento, colisiones, niveles, victoria, pausa (`P`, `Esc`, `visibilitychange`), `endGame`, `restart`, `destroy` y callbacks; con un `draw` vacío. Verificar: `npx tsc --noEmit` y `npm run lint` pasan.
9. Crear `render.ts` (fondo, serpiente, fruta, overlays) y conectarlo al motor. Verificar: `npx tsc --noEmit` y `npm run lint` pasan.
10. Crear `components/snake-canvas.tsx` (`"use client"`): crea el motor en `useEffect`, lo destruye al desmontar, aplica `isPaused`, expone `endGame`/`restart` por `ref`. Verificar: compila con `npx tsc --noEmit`.
11. Integrar en `GamePlayer`: entrada `snake` en `REAL_GAMES` y caso `snake` en `renderGame`. Verificar en `/games/snake/play`: puntaje y nivel del HUD coinciden con los del canvas, el HUD muestra un `♥` fijo, `P`/`Esc` y el botón PAUSA se mantienen sincronizados, y los flujos de Asteroides, Tetris y Arkanoid no cambian.
12. Estilos del canvas (`.snake-canvas`: ancho 100%, `aspect-ratio: 4 / 3`, sin desbordes). Verificar: sin scroll horizontal a 375px y a 1280px.
13. Flujo completo con Playwright (jugar con flechas y WASD, comer frutas, subir de nivel, pausar con `P`, `Esc` y botón, chocar con la pared y con el cuerpo, guardar puntaje, verlo en `/games/snake` y `/hall-of-fame`, y comprobar la consola). Luego ejecutar `npm run lint`, `npx tsc --noEmit` y `npm run build`.

## Criterios de aceptación

- [ ] `npm run build`, `npm run lint` y `npx tsc --noEmit` terminan sin errores.
- [ ] `select id from public.games` contiene `asteroids`, `tetris`, `arkanoid` y `snake`.
- [ ] `list_migrations` muestra las dos migraciones nuevas y el mismo SQL existe en `supabase/migrations/`.
- [ ] `/games` muestra la tarjeta «SNAKE» (`ARCADE`) con la nueva `.cover-snake`, junto a los otros tres juegos; los filtros `ARCADE` y `TODOS` la incluyen y `PUZZLE`/`VERSUS` no.
- [ ] `/games/snake` y `/games/snake/play` cargan; un id inexistente sigue devolviendo 404.
- [ ] `/games/snake/fruits.png` responde 200 y las frutas se ven en el canvas.
- [ ] La serpiente empieza con 3 segmentos en el centro, mirando a la derecha, y avanza una celda por tick.
- [ ] Las flechas y `W` `A` `S` `D` giran la serpiente; la reversa directa se ignora; dos giros rápidos dentro de un mismo tick se aplican en ticks consecutivos.
- [ ] Comer una fruta suma exactamente 10 puntos, agrega un segmento y genera otra fruta en una celda libre (nunca sobre la serpiente).
- [ ] Las frutas del canvas usan sprites distintos del atlas y no se ven deformadas.
- [ ] El nivel sube cada 5 frutas, el HUD de la plataforma lo refleja y el intervalo baja 10 ms por nivel sin bajar de 60 ms.
- [ ] Chocar con una pared o con el propio cuerpo muestra «GAME OVER» en el canvas y abre el modal con el puntaje real.
- [ ] Si la serpiente llena las 300 celdas, el canvas muestra «¡Tablero completo!» y se abre el modal con el puntaje real.
- [ ] El HUD de la plataforma muestra Puntuación y Nivel iguales a los del canvas y un `♥` fijo en Vidas.
- [ ] La pausa congela la serpiente e ignora las teclas de giro; `P`, `Esc` y el botón PAUSA/REANUDAR se mantienen sincronizados (el CRT muestra «EN PAUSA» en todos los casos).
- [ ] Cambiar de pestaña pausa el juego y al volver no hay salto de varias celdas.
- [ ] FIN abre el modal con el puntaje real y el canvas muestra «GAME OVER».
- [ ] En game over y victoria `P` y `Esc` no reanudan; solo «JUGAR DE NUEVO» reinicia con puntaje 0, nivel 1 y longitud 3 en canvas y HUD.
- [ ] Guardar crea una fila en `leaderboard` con `game_id = 'snake'`, `user_id` nulo, el nombre y el puntaje finales, visible en `/games/snake` y en el Salón de la Fama.
- [ ] Un nombre de menos de 3 caracteres o un puntaje inválido se rechazan con un error en español.
- [ ] Un `insert` con otro `game_id` (o `user_id` no nulo) sigue rechazado por RLS.
- [ ] Destruir el motor (SALIR o navegación) no deja listeners de teclado ni `requestAnimationFrame` activos, también con el doble montaje de `StrictMode` y si se destruye antes de que cargue el spritesheet.
- [ ] Flechas, `Espacio` y WASD no hacen scroll de la página mientras se juega.
- [ ] El canvas escala sin scroll horizontal a 375px y a 1280px.
- [ ] Sin errores de hidratación ni de Suspense en la consola de las pantallas afectadas.
- [ ] Asteroides, Tetris y Arkanoid siguen funcionando (HUD, pausa, fin, reinicio, guardado).

## Decisiones tomadas y descartadas

- **Sí:** `id` `snake`, título `SNAKE`, categoría `ARCADE`, color `green` (decisión del usuario). Verde no lo usan los otros juegos y encaja con la serpiente.
- **Sí:** textos del catálogo propuestos en la entrevista (decisión del usuario).
- **Sí:** diseño nuevo con reglas del Snake clásico, sin código de referencia: muerte al chocar pared o cuerpo (decisión del usuario). **No:** wrap-around; cambia el tipo de juego y la dificultad.
- **Sí:** sin vidas, con nivel en el HUD (decisión del usuario). El nivel sube cada 5 frutas y acelera la serpiente. **No:** 3 vidas; se aleja del original y añade lógica de reaparición.
- **Sí:** 10 puntos por fruta, con el sprite elegido al azar entre las 22 del atlas (decisión del usuario). **No:** puntos distintos por fruta; añadiría una tabla de balance nueva. El atlas de `sprites.js` tiene 22 frutas, no 25.
- **Sí:** dificultad con tick inicial de 140 ms, −10 ms por nivel y mínimo de 60 ms (decisión del usuario, valores propuestos). **No:** niveles con muros; es una mecánica nueva y más grande.
- **Sí:** canvas 800×600 con grilla 20×15 de 40 px (decisión del usuario). Mantiene el aspect-ratio 4/3 de los otros juegos y deja sprites legibles. **No:** 40×30 de 20 px; sprites diminutos y partida más difícil.
- **Sí:** flechas y WASD, `P`/`Esc` para pausar (decisión del usuario), con cola de 2 giros y sin reversa directa para evitar muertes injustas por input rápido.
- **Sí:** serpiente dibujada de forma vectorial en canvas con estilo neón; solo las frutas usan sprites (decisión del usuario). **No:** cuadrados planos; menos acabado.
- **Sí:** copiar `fruits.png` y reescribir el atlas en `sprites.ts`; rediseñar `.cover-snake` con `/frontend-design` (decisión del usuario). **No:** copiar `sprites.js`: depende de `window` y de un `<script>`. **No:** conservar el mock actual de `.cover-snake`.
- **Sí:** sin sonido (decisión del usuario); no hay audios de referencia.
- **Sí:** llenar las 300 celdas es victoria y abre el modal con el puntaje real (decisión del usuario), como Arkanoid.
- **Sí:** loop con `requestAnimationFrame` y acumulador de ticks, con `MAX_DT = 0.05`. Mantiene el contrato de pausa y `visibilitychange` de los otros motores y evita `setInterval`.
- **Sí:** reemplazar la política de `INSERT` conservando el nombre `temporary anonymous insert for ported games`. **No:** una política aparte para `snake`; debe retirarse junta en la spec de auth.
- **Sí:** no existe `onLivesChange`; `GamePlayer` muestra el `♥` fijo con `hasLives: false`, como Tetris.
- **Sí:** alcance por defecto: solo teclado, sin auth.

## Riesgos identificados

| Riesgo                                                                           | Mitigación                                                                                                                          |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `GamePlayer` cerrado a Asteroides, Tetris y Arkanoid                             | Añadir `snake` a `REAL_GAMES`; verificar los otros tres juegos tras el cambio (criterio de aceptación).                             |
| Nombre exacto de la política de `INSERT` distinto al documentado                 | Consultar `pg_policies` antes de escribir el `drop policy`; verificar con inserts de prueba como `anon`.                            |
| Doble montaje en `StrictMode` duplica listeners, loops o cargas de imagen        | `destroy()` idempotente, llamado en el cleanup del `useEffect`; cancelar el arranque si se destruye antes de la carga de la imagen. |
| `fruits.png` no carga (404, red) y el juego queda en negro                       | Verificar la ruta en el paso 4; si falla la carga, el motor no inicia el loop y deja un mensaje en `console.error`.                 |
| Coordenadas del atlas imprecisas para alguna fruta (recortes con bordes)         | Revisar las 22 frutas en el canvas durante el paso 13 y corregir en `sprites.ts` solo los recortes que se vean cortados.            |
| Giros rápidos que producen reversa o muerte injusta                              | Cola de máximo 2 giros que descarta iguales y opuestas a la última dirección; verificar en Playwright.                              |
| Fruta generada sobre la serpiente o bucle infinito al quedar pocas celdas libres | `pickFreeCell` elige entre la lista de celdas libres, no por reintento al azar; con 0 celdas libres se dispara la victoria.         |
| Acumulador de ticks que salta varias celdas tras pausa o cambio de pestaña       | `MAX_DT`, reinicio de `lastTime` y acumulador a 0 al reanudar.                                                                      |
| Bucle `onPauseChange` ↔ `isPaused` entre motor y `GamePlayer`                    | El motor ignora `pause`/`resume` redundantes y solo emite en cambios reales.                                                        |
| `cacheComponents` cambia la semántica de render                                  | Leer la guía antes del paso 10; la página de juego es un shell con un componente cliente.                                           |
| `params` fuera de `<Suspense>` en `/games/[id]` y `/play`                        | Mantener `await params` dentro de componentes envueltos en `<Suspense>`; revisar la consola.                                        |
| Controles distintos a los otros juegos (WASD, sin `Espacio`, sin mouse)          | `preventDefault` en flechas y `Espacio` solo con el motor activo; verificar que ninguna tecla del juego hace scroll.                |
| Reemplazar `.cover-snake` rompe otra pantalla que lo use                         | Buscar usos de `cover-snake` (hoy solo `lib/home.ts` lo menciona) y verificar la home y `/games` tras el cambio.                    |
| Puntajes falsificados por el `INSERT` anónimo temporal                           | Riesgo ya asumido en la SPEC 06; se mitiga con los `CHECK` y se retira en la spec de auth.                                          |

## Lo que **no** entra en esta spec

- Controles táctiles o móvil.
- Sonido, música, volumen o silencio.
- Vidas, obstáculos, muros, wrap-around y frutas con puntos distintos.
- Autenticación, retiro de la política temporal y anti-trampas.
- Contador real de partidas y Realtime.
- Otros juegos del catálogo.
- Tests automatizados.

Cada uno, si se hace, va en su propia spec.
