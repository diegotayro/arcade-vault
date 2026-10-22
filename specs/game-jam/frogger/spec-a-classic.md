# SPEC GJ — RANA AL CRUCE (variante A: clásico arcade)

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06, SPEC 07, SPEC 09, SPEC 10
> **Fecha:** 2026-10-21
> **Juego pedido:** Frogger — cruza la carretera y el río sin convertirse en papilla.
> **Objetivo:** Crear un Frogger clásico con motor TypeScript y dibujo vectorial, con 3 vidas, 5 casas, temporizador por rana y dificultad creciente sin fin, registrarlo en `games` y jugarlo en `/games/frogger/play` con HUD de la plataforma, pausa y guardado de puntaje en `leaderboard`.

## Alcance

**Dentro:**

- Motor en `lib/games/frogger/` (`types.ts`, `constants.ts`, `lanes.ts`, `entities.ts`, `input.ts`, `render.ts`, `engine.ts`) con el contrato de Asteroides, Arkanoid y Snake: `createFroggerEngine(canvas, callbacks)` devuelve `start`, `pause`, `resume`, `endGame`, `restart`, `destroy`; sin globals ni acceso a `document`/`window`/`Image`/`Audio` al importar; callbacks solo cuando cambia el valor; `restart` emite los valores iniciales; `destroy` idempotente; pausa automática en `visibilitychange`.
- Reglas del juego (diseño nuevo con las reglas del Frogger arcade):
  - Canvas 800×600, grilla de 20 columnas × 15 filas con celdas de 40 px. Filas de arriba abajo: 0 franja de información, 1 casas, 2–6 río, 7 mediana segura, 8–12 carretera, 13 salida segura, 14 franja de tiempo y vidas.
  - La rana empieza en la fila 13 con el centro en `x = 400`, mirando hacia arriba. Cada pulsación la mueve exactamente una celda (40 px); el salto es lógico e inmediato y se anima 80 ms en el render. Entre saltos hay un enfriamiento de 100 ms y un búfer de 1 salto. No puede bajar de la fila 13 ni saltar fuera de `x ∈ [20, 780]`.
  - Carretera: 5 carriles con vehículos (tabla de `lanes.ts` abajo). Si la caja de la rana (28 px de ancho centrada) se solapa con un vehículo de su fila, muere.
  - Río: 5 carriles con troncos y grupos de tortugas. En una fila de río la rana debe tener su centro sobre una plataforma visible; si no, se ahoga. Sobre una plataforma la rana se desplaza con ella; si su centro sale de `[0, 800]`, muere.
  - Tortugas que bucean: desde el nivel 2, el primer grupo de cada carril de tortugas sigue un ciclo de 4 s en superficie, 1 s de aviso (parpadeo) y 1,5 s sumergido. Sumergido no es plataforma.
  - Casas: 5 huecos en la fila 1 con centros en `x = 80, 240, 400, 560, 720`. Saltar a la fila 1 con el centro a ≤ 24 px de una casa libre la ocupa (la rana se dibuja centrada en ella) y aparece una rana nueva en la salida. Caer en el seto, fuera de esa tolerancia, o en una casa ocupada mata a la rana.
  - Tiempo: 30 s por rana. Se reinicia con cada rana nueva (tras llegar a casa o tras morir). Si llega a 0, la rana muere.
  - Muerte: animación de 0,8 s (aplastada en carretera, salpicadura en el río), sin input; luego se pierde una vida y, si quedan, aparece una rana nueva en la salida.
  - Puntos: 10 por cada fila nueva más alta alcanzada por la rana actual; 50 al llegar a casa; 10 por cada segundo entero restante al llegar a casa; 1000 al ocupar las 5 casas. El puntaje se limita a `MAX_SCORE` (10 000 000) de `lib/score-rules.ts`.
  - Vidas: 3 iniciales; una vida extra al cruzar los 10 000 puntos, una sola vez por partida. Con 0 vidas, «GAME OVER».
  - Niveles: al ocupar las 5 casas el nivel sube en 1, las casas se vacían y la rana vuelve a la salida. Multiplicador de velocidad de todos los carriles = `min(1 + 0,15 × (nivel − 1), 2,5)`. No hay nivel máximo ni victoria.
- Controles: `←` `↑` `→` `↓` y `W` `A` `S` `D` saltan; `P` o `Esc` pausan/reanudan. Se ignoran las repeticiones automáticas del teclado (`event.repeat`): cada salto requiere una pulsación. `Espacio` no hace nada.
- Dibujo vectorial en canvas con estilo neón: río azul oscuro con ondas, asfalto con líneas discontinuas, mediana y salida moradas, seto verde oscuro con los 5 huecos; rana verde con brillo y orientada al último salto; autos, tractor y camión con faros; troncos marrones con vetas; tortugas con caparazón y parpadeo rojo durante el aviso de buceo.
- Sin sonido.
- El canvas dibuja en la fila 0 el puntaje y el nivel, y en la fila 14 la barra de tiempo (verde, amarilla bajo 10 s, roja bajo 5 s) y las vidas como ranas pequeñas. Overlay «GAME OVER». La pausa la muestra el CRT de la plataforma («EN PAUSA»).
- Callbacks: `onScoreChange`, `onLivesChange`, `onLevelChange`, `onPauseChange` y `onGameOver`. El HUD de la plataforma muestra Jugador, Puntuación, Vidas (reales, 3 iniciales) y Nivel.
- Componente cliente `components/frogger-canvas.tsx` que monta y destruye el motor.
- Migración que inserta `frogger` en `public.games` (`ARCADE`, `green`, cover `cover-frogger`) con estos textos:
  - `short`: «Cruza la carretera y el río sin convertirte en papilla.»
  - `long`: «Salta entre autos, troncos y tortugas para llevar cinco ranas a sus casas antes de que se acabe el tiempo. Tienes 3 vidas y cada nivel acelera el tráfico y el río.»
- Migración que reemplaza la política temporal de `INSERT` de `leaderboard` para aceptar `asteroids`, `tetris`, `arkanoid`, `snake` y `frogger` (mantiene `user_id is null`).
- Estilo `.cover-frogger` en `app/globals.css`, diseñado con `/frontend-design`: carriles de asfalto con autos neón abajo, río con troncos arriba y la rana verde brillante en la mediana. Distinta de `.cover-rana`, mock del catálogo antiguo que no se toca.
- Integración en `components/game-player.tsx`: entrada `frogger` en `REAL_GAMES` (`hasLives: true`, `hasSkinSelector: false`) y caso `frogger` en `renderGame` con `onLivesChange={handleLivesChange}` y `onPauseChange`.
- Verificar que `saveScore` y `lib/score-rules.ts` aceptan el juego sin cambios de código y que el modal guarda en `leaderboard`.
- Estilo `.frogger-canvas` (ancho 100%, `aspect-ratio: 4 / 3`) junto a `.asteroids-canvas`, `.arkanoid-canvas` y `.snake-canvas`.
- Textos visibles en español, código en inglés.

**Fuera de alcance (para futuras specs):**

- Controles táctiles / móvil.
- Sonido, música o control de volumen.
- Mosca bonus, rana dama, cocodrilos, serpientes, nutrias y niveles diseñados a mano.
- Pantalla de victoria o nivel máximo.
- Autenticación y retiro de la política temporal de `INSERT`.
- Anti-trampas y validación de puntaje en servidor.
- Contador real de partidas (`plays_count`), `best` distinto de `MAX(score)`, Realtime.
- Tests automatizados.
- Otros juegos del catálogo.

## Modelo de datos

Fila nueva en `games` (migración `<timestamp>_insert_frogger_game.sql`):

```sql
insert into public.games (id, title, short, long, category, cover, color)
values ('frogger', 'RANA AL CRUCE', '<short>', '<long>', 'ARCADE', 'cover-frogger', 'green');
```

Política de `INSERT` (migración `<timestamp>_extend_temporary_insert_policy_to_frogger.sql`). El nombre vigente se confirma con `pg_policies` antes de escribirla; hoy es `temporary anonymous insert for ported games` (SPEC 08, conservado en SPEC 09 y SPEC 10):

```sql
drop policy "temporary anonymous insert for ported games" on public.leaderboard;

create policy "temporary anonymous insert for ported games" on public.leaderboard
  for insert to anon, authenticated
  with check (game_id in ('asteroids', 'tetris', 'arkanoid', 'snake', 'frogger') and user_id is null);
```

Tipos del motor (`lib/games/frogger/types.ts`):

```ts
interface FroggerCallbacks {
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onPauseChange: (isPaused: boolean) => void;
  onGameOver: (finalScore: number) => void;
}

interface FroggerEngine {
  start: () => void;
  pause: () => void;
  resume: () => void;
  endGame: () => void;
  restart: () => void;
  destroy: () => void;
}

type FroggerState = "playing" | "gameover";
type FrogStatus = "alive" | "dying";
type DeathCause = "road" | "water" | "time" | "hedge";
type Direction = "up" | "down" | "left" | "right";
type LaneKind = "road" | "river";
type ObstacleSkin =
  "car" | "tractor" | "racer" | "sedan" | "truck" | "log" | "turtles";
type DivePhase = "surface" | "warning" | "submerged";

interface Frog {
  x: number; // centro en px
  row: number;
  facing: Direction;
  status: FrogStatus;
  bestRow: number;
  hopElapsed: number;
  deathElapsed: number;
  deathCause: DeathCause | null;
}
interface LaneConfig {
  row: number;
  kind: LaneKind;
  direction: -1 | 1;
  speed: number; // px/s en nivel 1
  lengthCells: number;
  count: number;
  skin: ObstacleSkin;
  divingGroup: boolean;
}
interface Obstacle {
  x: number; // borde izquierdo
  width: number;
  diveElapsed: number;
  divePhase: DivePhase;
}
interface Lane {
  config: LaneConfig;
  obstacles: Obstacle[];
}
interface Home {
  centerX: number;
  occupied: boolean;
}

function createFroggerEngine(
  canvas: HTMLCanvasElement,
  callbacks: FroggerCallbacks,
): FroggerEngine;
```

Constantes (`constants.ts`):

```ts
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const CELL_SIZE = 40;
const COLS = 20;
const ROWS = 15;
const HOME_ROW = 1;
const MEDIAN_ROW = 7;
const START_ROW = 13;
const START_X = 400;
const MIN_FROG_X = 20;
const MAX_FROG_X = 780;
const FROG_HITBOX_WIDTH = 28;
const HOP_ANIMATION_MS = 80;
const HOP_COOLDOWN_MS = 100;
const HOME_CENTERS = [80, 240, 400, 560, 720];
const HOME_TOLERANCE = 24;
const LANE_TRACK_LENGTH = 960; // 800 + 80 a cada lado para el wrap
const INITIAL_LIVES = 3;
const EXTRA_LIFE_SCORE = 10_000;
const TIME_PER_FROG_S = 30;
const DEATH_ANIMATION_S = 0.8;
const POINTS_PER_ROW = 10;
const POINTS_PER_HOME = 50;
const POINTS_PER_SECOND_LEFT = 10;
const POINTS_PER_LEVEL = 1000;
const SPEED_STEP = 0.15;
const MAX_SPEED_MULTIPLIER = 2.5;
const DIVE_FROM_LEVEL = 2;
const TURTLE_SURFACE_S = 4;
const TURTLE_WARNING_S = 1;
const TURTLE_SUBMERGED_S = 1.5;
const MAX_DT = 0.05;
```

Carriles (`lanes.ts`, velocidades de nivel 1; `←` es `direction = -1`):

| Fila | Tipo  | Dirección | Velocidad (px/s) | Largo (celdas) | Cantidad | Dibujo              | Bucea |
| ---- | ----- | --------- | ---------------- | -------------- | -------- | ------------------- | ----- |
| 2    | río   | →         | 60               | 4              | 3        | tronco mediano      | no    |
| 3    | río   | ←         | 65               | 2              | 4        | grupo de 2 tortugas | sí    |
| 4    | río   | →         | 85               | 5              | 2        | tronco largo        | no    |
| 5    | río   | →         | 45               | 3              | 3        | tronco corto        | no    |
| 6    | río   | ←         | 55               | 3              | 4        | grupo de 3 tortugas | sí    |
| 8    | calle | ←         | 65               | 2              | 3        | camión blanco       | —     |
| 9    | calle | →         | 75               | 1              | 3        | sedán cian          | —     |
| 10   | calle | ←         | 100              | 1              | 3        | deportivo magenta   | —     |
| 11   | calle | →         | 50               | 1              | 4        | tractor verde       | —     |
| 12   | calle | ←         | 60               | 1              | 4        | auto amarillo       | —     |

Los obstáculos de cada carril se reparten cada `LANE_TRACK_LENGTH / count` px, empezando en `x = −80`.

Config por juego en `components/game-player.tsx` (se amplía `REAL_GAMES` vigente):

```ts
const REAL_GAMES = {
  asteroids: { hasLives: true, hasSkinSelector: false },
  tetris: { hasLives: false, hasSkinSelector: true },
  arkanoid: { hasLives: true, hasSkinSelector: false },
  snake: { hasLives: false, hasSkinSelector: false },
  frogger: { hasLives: true, hasSkinSelector: false },
} as const;
```

Archivos:

| Archivo                                                               | Contenido                                                                                                                                      |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/games/frogger/types.ts`                                          | Interfaces y tipos anteriores                                                                                                                  |
| `lib/games/frogger/constants.ts`                                      | Dimensiones, filas, casas, tiempos, puntos, vidas, dificultad, ciclo de buceo, `MAX_DT`                                                        |
| `lib/games/frogger/lanes.ts`                                          | `LANES`: los 10 carriles de la tabla anterior                                                                                                  |
| `lib/games/frogger/entities.ts`                                       | Lógica pura: `createFrog`, `hopFrog`, `createLanes`, `moveLane`, `advanceDive`, `speedMultiplierFor`, `hitsVehicle`, `platformUnder`, `homeAt` |
| `lib/games/frogger/input.ts`                                          | Teclado (flechas, WASD, `P`/`Esc`), descarte de `event.repeat`, búfer de 1 salto, `preventDefault`, alta/baja de listeners                     |
| `lib/games/frogger/render.ts`                                         | Fondo por zonas, casas, carriles, rana con animación de salto y de muerte, franjas de información y tiempo, overlay GAME OVER                  |
| `lib/games/frogger/engine.ts`                                         | `createFroggerEngine`: estado, loop con `dt`, saltos, colisiones, río, casas, tiempo, vidas, niveles, pausa, callbacks                         |
| `components/frogger-canvas.tsx`                                       | Cliente: monta/destruye el motor, aplica `isPaused`, expone `endGame`/`restart`                                                                |
| `supabase/migrations/*_insert_frogger_game.sql`                       | Seed de `frogger`                                                                                                                              |
| `supabase/migrations/*_extend_temporary_insert_policy_to_frogger.sql` | Política de `INSERT` ampliada                                                                                                                  |

Convenciones:

- Diseño nuevo, sin código ni assets de referencia: todo se dibuja con primitivas de canvas.
- Coordenadas con origen arriba a la izquierda; la fila `r` ocupa `y ∈ [r × 40, r × 40 + 40)`. Velocidades en px/s, `dt` en segundos, limitado con `MAX_DT = 0.05`.
- El loop usa `requestAnimationFrame`; update y render en cada frame. Al reanudar tras pausa o `visibilitychange` se reinicia `lastTime` para evitar saltos.
- Orden del update: aplicar el salto del búfer si la rana está viva y pasó el enfriamiento (sumando puntos de fila nueva), mover carriles con el multiplicador del nivel y hacer wrap, avanzar ciclos de buceo, arrastrar a la rana si está sobre una plataforma, resolver la fila actual (carretera: choque; río: plataforma o ahogo; fila 1: casa o seto; bordes: fuera de pantalla), descontar tiempo, avanzar la animación de muerte y respawn, comprobar 5 casas y subir de nivel, comprobar vida extra, emitir callbacks.
- Las colisiones se evalúan en cada frame, no solo al aterrizar; un vehículo que alcanza a la rana quieta también la mata.
- La pausa congela carriles, tiempo, animaciones y descarta los saltos. En `gameover` el motor ignora `P`/`Esc`.
- `onPauseChange` solo se emite en cambios reales; el motor ignora `pause`/`resume` redundantes.
- `endGame` (botón FIN) pasa a `gameover`, dibuja el overlay y emite `onGameOver` con el puntaje actual sin tocar las vidas.
- `restart` deja el estado inicial (puntaje 0, 3 vidas, nivel 1, casas vacías, carriles en su posición inicial, vida extra disponible) y emite puntaje, vidas y nivel iniciales.
- Las flechas, `Espacio` y las teclas del juego llaman a `preventDefault` mientras el motor está activo.
- No hay assets: no se carga ninguna imagen ni sonido, así que el motor arranca el loop directamente en `start()`.

## Plan de implementación

Antes de escribir código Next.js, leer en `node_modules/next/dist/docs/` la guía de Client Components y la de `cacheComponents` (data fetching y `use cache`). Usar `/frontend-design` para `.cover-frogger` y el marco del canvas. Mantener `params` dentro de `<Suspense>` en `/games/[id]` y `/games/[id]/play`.

1. Crear y aplicar la migración que inserta `frogger` en `games` (`apply_migration`) y guardar el mismo SQL en `supabase/migrations/`. Verificar: `list_migrations` la muestra y `select id from public.games` devuelve `asteroids`, `tetris`, `arkanoid`, `snake` y `frogger`.
2. Consultar `pg_policies` para confirmar el nombre vigente de la política de `INSERT`, crear y aplicar la migración que la reemplaza (y su archivo en `supabase/migrations/`). Verificar: un `insert` con rol `anon` para `frogger` con `user_id` nulo funciona (borrar la fila de prueba), para otro `game_id` o con `user_id` no nulo es rechazado, los otros cuatro juegos siguen aceptados, y `get_advisors` de seguridad no reporta problemas nuevos.
3. Agregar `.cover-frogger` en `app/globals.css` con `/frontend-design` (sin tocar `.cover-rana`). Verificar: `/games` muestra la tarjeta «RANA AL CRUCE» con su portada y los filtros `ARCADE` y `TODOS` la incluyen.
4. Crear `lib/games/frogger/types.ts`, `constants.ts` y `lanes.ts`. Verificar: `npx tsc --noEmit` pasa.
5. Crear `entities.ts` (lógica pura: rana, carriles, wrap, buceo, colisiones, casas, multiplicador). Verificar: `npx tsc --noEmit` pasa.
6. Crear `input.ts` (teclado, descarte de `event.repeat`, búfer de 1 salto, pausa, `preventDefault`). Verificar: `npx tsc --noEmit` pasa.
7. Crear `engine.ts` con estado, loop con `MAX_DT`, saltos, carriles, río, casas, tiempo, muerte y respawn, vidas y vida extra, niveles, pausa (`P`, `Esc`, `visibilitychange`), `endGame`, `restart`, `destroy` y callbacks; con un `draw` vacío. Verificar: `npx tsc --noEmit` y `npm run lint` pasan.
8. Crear `render.ts` (zonas, casas, obstáculos, tortugas con aviso, rana con animación, franjas, overlay) y conectarlo al motor. Verificar: `npx tsc --noEmit` y `npm run lint` pasan.
9. Crear `components/frogger-canvas.tsx` (`"use client"`): crea el motor en `useEffect`, lo destruye al desmontar, aplica `isPaused`, expone `endGame`/`restart` por `ref`. Verificar: compila con `npx tsc --noEmit`.
10. Integrar en `GamePlayer`: entrada `frogger` en `REAL_GAMES` y caso `frogger` en `renderGame`. Verificar en `/games/frogger/play`: puntaje, vidas y nivel del HUD coinciden con los del canvas, `P`/`Esc` y el botón PAUSA se mantienen sincronizados, y los flujos de Asteroides, Tetris, Arkanoid y Snake no cambian.
11. Estilos del canvas (`.frogger-canvas`: ancho 100%, `aspect-ratio: 4 / 3`, sin desbordes). Verificar: sin scroll horizontal a 375px y a 1280px.
12. Flujo completo con Playwright (saltar con flechas y WASD, morir atropellado, ahogado y por tiempo, viajar en un tronco, llenar las 5 casas y subir de nivel, pausar con `P`, `Esc` y botón, cambiar de pestaña, perder las 3 vidas, guardar puntaje, verlo en `/games/frogger` y `/hall-of-fame`, y comprobar la consola). Luego ejecutar `npm run lint`, `npx tsc --noEmit` y `npm run build`.

## Criterios de aceptación

- [ ] `npm run build`, `npm run lint` y `npx tsc --noEmit` terminan sin errores.
- [ ] `select id from public.games` contiene `asteroids`, `tetris`, `arkanoid`, `snake` y `frogger`.
- [ ] `list_migrations` muestra las dos migraciones nuevas y el mismo SQL existe en `supabase/migrations/`.
- [ ] `/games` muestra la tarjeta «RANA AL CRUCE» (`ARCADE`) con `.cover-frogger`, junto a los otros cuatro juegos; los filtros `ARCADE` y `TODOS` la incluyen y `PUZZLE`/`SHOOTER`/`VERSUS` no.
- [ ] `/games/frogger` y `/games/frogger/play` cargan; un id inexistente sigue devolviendo 404.
- [ ] La rana empieza en la fila 13 centrada (`x = 400`) y cada pulsación de flecha o `W` `A` `S` `D` la mueve exactamente una celda; mantener la tecla pulsada no encadena saltos.
- [ ] La rana no baja de la fila 13 ni sale por los lados al saltar.
- [ ] Los 10 carriles se mueven con la dirección, velocidad, largo y cantidad de la tabla y reaparecen por el lado contrario sin huecos ni saltos visibles.
- [ ] Tocar un vehículo mata a la rana, también si el vehículo la alcanza quieta.
- [ ] En el río la rana viaja sobre troncos y tortugas; caer al agua o salir por un borde arrastrada la mata.
- [ ] En el nivel 1 ninguna tortuga bucea; desde el nivel 2 el primer grupo de cada carril de tortugas parpadea 1 s, se sumerge 1,5 s y ahoga a la rana si está encima.
- [ ] Entrar en una casa libre suma 50 + 10 × segundos enteros restantes y deja una rana dibujada en la casa; caer en el seto o en una casa ocupada mata a la rana.
- [ ] Cada fila nueva más alta de la rana actual suma 10 puntos; volver a una fila ya alcanzada no suma.
- [ ] El tiempo empieza en 30 s por rana, la barra cambia a amarillo bajo 10 s y a rojo bajo 5 s, y al llegar a 0 la rana muere.
- [ ] Cada muerte muestra la animación de 0,8 s, resta una vida en canvas y HUD, y la rana nueva aparece en la salida con 30 s.
- [ ] Al llegar a 10 000 puntos se suma una vida una sola vez y el HUD la refleja.
- [ ] Al ocupar las 5 casas se suman 1000 puntos, el nivel sube en canvas y HUD, las casas se vacían y los carriles van un 15% más rápido por nivel sin pasar de ×2,5.
- [ ] Con 0 vidas el canvas muestra «GAME OVER» y se abre el modal con el puntaje real.
- [ ] El HUD de la plataforma muestra Puntuación, Vidas y Nivel iguales a los del canvas en todo momento.
- [ ] La pausa congela carriles, tiempo y animaciones e ignora los saltos; `P`, `Esc` y el botón PAUSA/REANUDAR se mantienen sincronizados (el CRT muestra «EN PAUSA» en todos los casos).
- [ ] Cambiar de pestaña pausa el juego y al volver no hay salto en los carriles ni en el tiempo.
- [ ] FIN abre el modal con el puntaje real y el canvas muestra «GAME OVER» sin cambiar las vidas.
- [ ] En game over `P` y `Esc` no reanudan; solo «JUGAR DE NUEVO» reinicia con puntaje 0, 3 vidas, nivel 1 y casas vacías en canvas y HUD.
- [ ] Guardar crea una fila en `leaderboard` con `game_id = 'frogger'`, `user_id` nulo, el nombre y el puntaje finales, visible en `/games/frogger` y en el Salón de la Fama.
- [ ] Un nombre de menos de 3 caracteres o un puntaje inválido se rechazan con un error en español.
- [ ] Un `insert` con otro `game_id` (o `user_id` no nulo) sigue rechazado por RLS.
- [ ] Destruir el motor (SALIR o navegación) no deja listeners de teclado ni `requestAnimationFrame` activos, también con el doble montaje de `StrictMode`.
- [ ] Flechas, `Espacio` y WASD no hacen scroll de la página mientras se juega.
- [ ] El canvas escala sin scroll horizontal a 375px y a 1280px.
- [ ] Sin errores de hidratación ni de Suspense en la consola de las pantallas afectadas.
- [ ] Asteroides, Tetris, Arkanoid y Snake siguen funcionando (HUD, pausa, fin, reinicio, guardado).

## Decisiones tomadas y descartadas

- **Sí:** `id` `frogger`, derivado del nombre pedido; título `RANA AL CRUCE`, en español y sin la marca registrada (decisión del agente). **No:** título «FROGGER»; es marca de Konami.
- **Sí:** categoría `ARCADE` y color `green` (decisión del agente). La rana es verde y el género es arcade de habilidad. **No:** `cyan`; ya lo usa Asteroides y el verde identifica mejor al protagonista, aunque Snake también lo use.
- **Sí:** esta variante es el **arcade clásico**: vidas, casas, temporizador por rana y dificultad sin fin (decisión del agente). Se distingue de la B (5 niveles diseñados con amenazas nuevas y victoria) y de la C (contrarreloj sin vidas).
- **Sí:** canvas 800×600 con grilla 20×15 de 40 px y el trazado clásico de 5 carriles de río y 5 de carretera (decisión del agente). Mantiene el aspect-ratio 4/3 de los otros juegos. **No:** 13 columnas como el arcade original; no encaja con 800 px.
- **Sí:** salto lógico inmediato con 80 ms de animación y 100 ms de enfriamiento (decisión del agente). Las colisiones son simples y deterministas. **No:** posición interpolada durante el salto; complica el río y los choques.
- **Sí:** ignorar `event.repeat` (decisión del agente). En Frogger cada salto es deliberado; la repetición automática lleva a muertes injustas.
- **Sí:** 3 vidas, vida extra a los 10 000 puntos una sola vez, 30 s por rana y puntos 10/50/10 × s/1000 (decisión del agente), inspirados en el arcade. **No:** vidas extra repetidas; inflan partidas muy largas.
- **Sí:** niveles infinitos con multiplicador `1 + 0,15 × (nivel − 1)` y tope ×2,5 (decisión del agente). Al tope el carril más rápido va a 250 px/s, aún esquivable. **No:** victoria; el clásico es una carrera de puntaje sin final.
- **Sí:** tortugas que bucean desde el nivel 2 (decisión del agente). El nivel 1 sirve de aprendizaje.
- **No:** mosca, cocodrilos, serpiente y rana dama (decisión del agente); son el eje de la variante B y alargan esta implementación.
- **Sí:** dibujo vectorial y sin sonido (decisión del agente). No hay assets de Frogger en `public/games/` ni en `references/source-assets/`.
- **Sí:** archivo `lanes.ts` con la tabla de carriles (decisión del agente). Separa datos de lógica, como `levels.ts` de Arkanoid.
- **Sí:** el canvas dibuja puntaje, nivel, tiempo y vidas en sus franjas, como Arkanoid (decisión del agente). El tiempo no tiene sitio en el HUD de la plataforma.
- **Sí:** reemplazar la política de `INSERT` conservando el nombre `temporary anonymous insert for ported games`. **No:** una política aparte para `frogger`; debe retirarse junta en la spec de auth.
- **Sí:** `.cover-frogger` nueva. **No:** reutilizar `.cover-rana`; es un mock genérico del catálogo antiguo.
- **Sí:** alcance por defecto: solo teclado, sin auth.

## Riesgos identificados

| Riesgo                                                                   | Mitigación                                                                                                                            |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `GamePlayer` y `REAL_GAMES` cerrados a los cuatro juegos actuales        | Añadir `frogger` con los flags vigentes (`hasLives`, `hasSkinSelector`); verificar los otros cuatro juegos tras el cambio.            |
| `handleLivesChange` cierra el modal cuando recibe vidas mayores que 0    | Tras `gameover` el motor no emite `onLivesChange` hasta `restart`; la vida extra solo se emite en `playing`. Verificar en Playwright. |
| Nombre exacto de la política de `INSERT` distinto al documentado         | Consultar `pg_policies` antes de escribir el `drop policy`; verificar con inserts de prueba como `anon`.                              |
| Doble montaje en `StrictMode` duplica listeners o loops                  | `destroy()` idempotente, llamado en el cleanup del `useEffect`; `start()` ignora llamadas tras `destroy`.                             |
| Bucle `onPauseChange` ↔ `isPaused` entre motor y `GamePlayer`            | El motor ignora `pause`/`resume` redundantes y solo emite en cambios reales.                                                          |
| `cacheComponents` cambia la semántica de render                          | Leer la guía antes del paso 9; la página de juego es un shell con un componente cliente.                                              |
| `params` fuera de `<Suspense>` en `/games/[id]` y `/play`                | Mantener `await params` dentro de componentes envueltos en `<Suspense>`; revisar la consola.                                          |
| Controles distintos a los otros juegos (saltos discretos, sin `Espacio`) | `preventDefault` en flechas, WASD y `Espacio` solo con el motor activo; verificar que ninguna tecla hace scroll ni encadena saltos.   |
| Saltos de `dt` que teletransportan carriles o vacían el tiempo           | `MAX_DT`, reinicio de `lastTime` al reanudar y pausa automática en `visibilitychange`.                                                |
| Wrap de carriles con huecos o solapes visibles                           | Pista de 960 px y reparto `LANE_TRACK_LENGTH / count`; revisar cada carril en el paso 12.                                             |
| Rana arrastrada que queda desalineada y no encaja en una casa            | Tolerancia de 24 px alrededor del centro de cada casa; al ocuparla se dibuja centrada.                                                |
| Muertes injustas por la caja de colisión                                 | Caja de 28 px (más estrecha que la celda) contra vehículos y centro de la rana contra plataformas.                                    |
| Puntajes falsificados por el `INSERT` anónimo temporal                   | Riesgo ya asumido en la SPEC 06; se mitiga con los `CHECK` y se retira en la spec de auth.                                            |

## Lo que **no** entra en esta spec

- Controles táctiles o móvil.
- Sonido, música, volumen o silencio.
- Mosca, cocodrilos, serpiente, rana dama, niveles diseñados y victoria.
- Autenticación, retiro de la política temporal y anti-trampas.
- Contador real de partidas y Realtime.
- Otros juegos del catálogo.
- Tests automatizados.

Cada uno, si se hace, va en su propia spec.
