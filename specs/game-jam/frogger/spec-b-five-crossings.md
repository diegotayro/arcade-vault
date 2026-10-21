# SPEC GJ — RANA AL CRUCE (variante B: cinco cruces con victoria)

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06, SPEC 07, SPEC 09, SPEC 10
> **Fecha:** 2026-10-21
> **Juego pedido:** Frogger — cruza la carretera y el río sin convertirse en papilla.
> **Objetivo:** Crear un Frogger con motor TypeScript y dibujo vectorial, con 3 vidas, 5 niveles diseñados que añaden amenazas nuevas, mosca bonus y victoria al completar el último, registrarlo en `games` y jugarlo en `/games/frogger/play` con HUD de la plataforma, pausa y guardado de puntaje en `leaderboard`.

## Alcance

**Dentro:**

- Motor en `lib/games/frogger/` (`types.ts`, `constants.ts`, `levels.ts`, `entities.ts`, `input.ts`, `render.ts`, `engine.ts`) con el contrato de Asteroides, Arkanoid y Snake: `createFroggerEngine(canvas, callbacks)` devuelve `start`, `pause`, `resume`, `endGame`, `restart`, `destroy`; sin globals ni acceso a `document`/`window`/`Image`/`Audio` al importar; callbacks solo cuando cambia el valor; `restart` emite los valores iniciales; `destroy` idempotente; pausa automática en `visibilitychange`.
- Reglas del juego (diseño nuevo con las reglas del Frogger arcade y sus amenazas reconocibles):
  - Canvas 800×600, grilla de 20 columnas × 15 filas con celdas de 40 px. Filas de arriba abajo: 0 franja de información, 1 casas, 2–6 río, 7 mediana, 8–12 carretera, 13 salida segura, 14 franja de tiempo y vidas.
  - La rana empieza en la fila 13 con el centro en `x = 400`, mirando hacia arriba. Cada pulsación la mueve exactamente una celda (40 px); el salto es lógico e inmediato y se anima 80 ms en el render. Entre saltos hay un enfriamiento de 100 ms y un búfer de 1 salto. No puede bajar de la fila 13 ni saltar fuera de `x ∈ [20, 780]`.
  - Carretera: 5 carriles con vehículos. Si la caja de la rana (28 px de ancho centrada) se solapa con un vehículo de su fila, muere.
  - Río: 5 carriles con troncos, tortugas y, desde el nivel 3, cocodrilos. La rana debe tener su centro sobre una plataforma visible; si no, se ahoga. Sobre una plataforma se desplaza con ella; si su centro sale de `[0, 800]`, muere.
  - Tortugas que bucean: ciclo de 4 s en superficie, 1 s de aviso (parpadeo) y 1,5 s sumergidas. Sumergidas no son plataforma. Cuando bucean todos los grupos de un carril, cada grupo `i` arranca el ciclo con un desfase de `i × 1,6 s` para que nunca se hundan todos a la vez.
  - Cocodrilo: 4 celdas (160 px). Las 3 celdas traseras son plataforma; la celda delantera (la cabeza, en el sentido de avance) mata si el centro de la rana cae en ella.
  - Serpiente de la mediana: 2 celdas (80 px), recorre la fila 7 a 40 px/s × multiplicador del nivel y rebota en `x = 0` y `x = 800`. Su caja (inset de 8 px por lado) mata a la rana al solaparse con la de esta.
  - Casas: 5 huecos en la fila 1 con centros en `x = 80, 240, 400, 560, 720`. Saltar a la fila 1 con el centro a ≤ 24 px de una casa libre la ocupa y aparece una rana nueva en la salida. Caer en el seto, en una casa ocupada o en una casa con cocodrilo mata a la rana.
  - Mosca bonus: mientras haya casas libres, una mosca aparece 5 s en una casa libre al azar y desaparece 5 s. Entrar en esa casa con la mosca visible suma 200 puntos extra.
  - Cocodrilo en casa (solo nivel 5): ciclo de 8 s, 5 s ausente y 3 s asomado en una casa libre al azar distinta de la de la mosca. Solo aparece si quedan al menos 2 casas libres.
  - Tiempo: 40 s por rana; se reinicia con cada rana nueva. Si llega a 0, la rana muere.
  - Muerte: animación de 0,8 s sin input; se pierde una vida y, si quedan, aparece una rana nueva en la salida. Con 0 vidas, «GAME OVER».
  - Puntos: 10 por cada fila nueva más alta de la rana actual; 50 al llegar a casa; 10 por cada segundo entero restante al llegar a casa; 200 por la mosca; 1000 al completar un nivel; al completar el nivel 5, 500 por cada vida restante.
  - Vidas: 3 iniciales, sin vidas extra.
  - Niveles: 5, diseñados en `levels.ts` (tabla abajo). Al ocupar las 5 casas se suma el bonus, las casas se vacían, se cargan los carriles del nivel siguiente y el canvas muestra durante 1,5 s el cartel «NIVEL N — NOMBRE» con carriles y tiempo congelados e input ignorado.
  - Victoria: al ocupar las 5 casas del nivel 5 el motor pasa a `win`, el canvas muestra «¡CRUCE COMPLETO!» y se emite `onGameOver` con el puntaje real.
- Controles: `←` `↑` `→` `↓` y `W` `A` `S` `D` saltan; `P` o `Esc` pausan/reanudan. Se ignoran las repeticiones automáticas del teclado (`event.repeat`). `Espacio` no hace nada.
- Dibujo vectorial en canvas con estilo neón: río, asfalto con líneas discontinuas, mediana y salida moradas, seto con 5 huecos; rana verde con brillo orientada al último salto; vehículos con faros; troncos con vetas; tortugas con parpadeo rojo de aviso; cocodrilo con mandíbula abierta en la cabeza; serpiente ondulante; mosca con alas; cocodrilo asomado en la casa. El nivel 5 usa una paleta nocturna (fondo más oscuro y faros más brillantes), solo cosmética.
- Sin sonido.
- El canvas dibuja en la fila 0 el puntaje y «NIVEL N/5», y en la fila 14 la barra de tiempo (verde, amarilla bajo 10 s, roja bajo 5 s) y las vidas como ranas pequeñas. Overlays «GAME OVER», «¡CRUCE COMPLETO!» y el cartel de nivel. La pausa la muestra el CRT de la plataforma («EN PAUSA»).
- Callbacks: `onScoreChange`, `onLivesChange`, `onLevelChange`, `onPauseChange` y `onGameOver`. El HUD de la plataforma muestra Jugador, Puntuación, Vidas (reales, 3 iniciales) y Nivel.
- Componente cliente `components/frogger-canvas.tsx` que monta y destruye el motor.
- Migración que inserta `frogger` en `public.games` (`ARCADE`, `green`, cover `cover-frogger`) con estos textos:
  - `short`: «Cruza la carretera y el río sin convertirte en papilla.»
  - `long`: «Lleva cinco ranas a casa en cinco cruces cada vez más peligrosos: tortugas que se hunden, cocodrilos, una serpiente y tráfico de hora punta. Atrapa la mosca para sumar 200 y supera el quinto nivel con tus 3 vidas.»
- Migración que reemplaza la política temporal de `INSERT` de `leaderboard` para aceptar `asteroids`, `tetris`, `arkanoid`, `snake` y `frogger` (mantiene `user_id is null`).
- Estilo `.cover-frogger` en `app/globals.css`, diseñado con `/frontend-design`: carriles de asfalto con autos neón abajo, río con troncos y un cocodrilo arriba y la rana verde brillante en la mediana. Distinta de `.cover-rana`, mock del catálogo antiguo que no se toca.
- Integración en `components/game-player.tsx`: entrada `frogger` en `REAL_GAMES` (`hasLives: true`, `hasSkinSelector: false`) y caso `frogger` en `renderGame` con `onLivesChange={handleLivesChange}` y `onPauseChange`. Se comprueba que la victoria con vidas restantes no cierra el modal.
- Verificar que `saveScore` y `lib/score-rules.ts` aceptan el juego sin cambios de código y que el modal guarda en `leaderboard`.
- Estilo `.frogger-canvas` (ancho 100%, `aspect-ratio: 4 / 3`) junto a `.asteroids-canvas`, `.arkanoid-canvas` y `.snake-canvas`.
- Textos visibles en español, código en inglés.

**Fuera de alcance (para futuras specs):**

- Controles táctiles / móvil.
- Sonido, música o control de volumen.
- Rana dama, nutrias, vida extra y niveles después del 5 (modo infinito).
- Selector de nivel inicial (falsea el ranking).
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

type FroggerState = "intro" | "playing" | "gameover" | "win";
type FrogStatus = "alive" | "dying";
type DeathCause = "road" | "water" | "time" | "hedge" | "crocodile" | "snake";
type Direction = "up" | "down" | "left" | "right";
type LaneKind = "road" | "river";
type ObstacleSkin =
  | "car"
  | "tractor"
  | "racer"
  | "sedan"
  | "truck"
  | "log"
  | "turtles"
  | "crocodile";
type DivePhase = "surface" | "warning" | "submerged";
type DivingGroups = "none" | "first" | "all";

interface Frog {
  x: number;
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
  speed: number; // px/s antes del multiplicador del nivel
  lengthCells: number;
  count: number;
  skin: ObstacleSkin;
}
interface Obstacle {
  x: number;
  width: number;
  diving: boolean;
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
interface MedianSnake {
  x: number;
  direction: -1 | 1;
}
interface HomeBonus {
  homeIndex: number | null;
  elapsed: number;
}
interface LevelConfig {
  name: string;
  speedMultiplier: number;
  lanes: LaneConfig[];
  divingGroups: DivingGroups;
  hasMedianSnake: boolean;
  hasHomeCrocodile: boolean;
  isNight: boolean;
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
const LANE_TRACK_LENGTH = 960;
const INITIAL_LIVES = 3;
const MAX_LEVEL = 5;
const TIME_PER_FROG_S = 40;
const DEATH_ANIMATION_S = 0.8;
const LEVEL_INTRO_S = 1.5;
const POINTS_PER_ROW = 10;
const POINTS_PER_HOME = 50;
const POINTS_PER_SECOND_LEFT = 10;
const POINTS_PER_FLY = 200;
const POINTS_PER_LEVEL = 1000;
const VICTORY_POINTS_PER_LIFE = 500;
const TURTLE_SURFACE_S = 4;
const TURTLE_WARNING_S = 1;
const TURTLE_SUBMERGED_S = 1.5;
const TURTLE_GROUP_OFFSET_S = 1.6;
const CROCODILE_LENGTH_CELLS = 4;
const SNAKE_LENGTH = 80;
const SNAKE_SPEED = 40;
const SNAKE_HITBOX_INSET = 8;
const FLY_VISIBLE_S = 5;
const FLY_HIDDEN_S = 5;
const HOME_CROC_ABSENT_S = 5;
const HOME_CROC_PRESENT_S = 3;
const MAX_DT = 0.05;
```

Carriles base (`levels.ts`, `BASE_LANES`; `←` es `direction = -1`):

| Fila | Tipo  | Dirección | Velocidad (px/s) | Largo (celdas) | Cantidad | Dibujo              |
| ---- | ----- | --------- | ---------------- | -------------- | -------- | ------------------- |
| 2    | río   | →         | 60               | 4              | 3        | tronco mediano      |
| 3    | río   | ←         | 65               | 2              | 4        | grupo de 2 tortugas |
| 4    | río   | →         | 85               | 5              | 2        | tronco largo        |
| 5    | río   | →         | 45               | 3              | 3        | tronco corto        |
| 6    | río   | ←         | 55               | 3              | 4        | grupo de 3 tortugas |
| 8    | calle | ←         | 65               | 2              | 3        | camión blanco       |
| 9    | calle | →         | 75               | 1              | 3        | sedán cian          |
| 10   | calle | ←         | 100              | 1              | 3        | deportivo magenta   |
| 11   | calle | →         | 50               | 1              | 4        | tractor verde       |
| 12   | calle | ←         | 60               | 1              | 4        | auto amarillo       |

Niveles (`levels.ts`, `LEVELS`):

| Nivel | Nombre       | Velocidad | Carriles                                                                                   | Tortugas que bucean | Serpiente | Cocodrilo en casa | Paleta |
| ----- | ------------ | --------- | ------------------------------------------------------------------------------------------ | ------------------- | --------- | ----------------- | ------ |
| 1     | «AMANECER»   | ×1,00     | Base                                                                                       | Ninguna             | No        | No                | Día    |
| 2     | «MAREA»      | ×1,10     | Base                                                                                       | Primer grupo        | No        | No                | Día    |
| 3     | «PANTANO»    | ×1,20     | Base; fila 4 pasa a 2 cocodrilos de 4 celdas (→, 85 px/s)                                  | Primer grupo        | Sí        | No                | Día    |
| 4     | «HORA PUNTA» | ×1,30     | Como nivel 3; filas 9–12 con un vehículo más; fila 8 con camiones de 3 celdas (cantidad 3) | Todos (con desfase) | Sí        | No                | Día    |
| 5     | «NOCHE»      | ×1,40     | Como nivel 4                                                                               | Todos (con desfase) | Sí        | Sí                | Noche  |

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

| Archivo                                                               | Contenido                                                                                                                                                                               |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/games/frogger/types.ts`                                          | Interfaces y tipos anteriores                                                                                                                                                           |
| `lib/games/frogger/constants.ts`                                      | Dimensiones, filas, casas, tiempos, puntos, vidas, buceo, cocodrilo, serpiente, mosca, `MAX_DT`                                                                                         |
| `lib/games/frogger/levels.ts`                                         | `BASE_LANES` y `LEVELS`: los 5 niveles de la tabla anterior                                                                                                                             |
| `lib/games/frogger/entities.ts`                                       | Lógica pura: `createFrog`, `hopFrog`, `createLanes`, `moveLane`, `advanceDive`, `hitsVehicle`, `platformUnder`, `hitsCrocodileHead`, `moveSnake`, `hitsSnake`, `homeAt`, `pickFreeHome` |
| `lib/games/frogger/input.ts`                                          | Teclado (flechas, WASD, `P`/`Esc`), descarte de `event.repeat`, búfer de 1 salto, `preventDefault`, alta/baja de listeners                                                              |
| `lib/games/frogger/render.ts`                                         | Fondo por zonas y paleta día/noche, casas con mosca y cocodrilo, carriles, serpiente, rana con animación, franjas, cartel de nivel, overlays GAME OVER y victoria                       |
| `lib/games/frogger/engine.ts`                                         | `createFroggerEngine`: estado, loop con `dt`, saltos, colisiones, río, casas, mosca, tiempo, vidas, niveles, victoria, pausa, callbacks                                                 |
| `components/frogger-canvas.tsx`                                       | Cliente: monta/destruye el motor, aplica `isPaused`, expone `endGame`/`restart`                                                                                                         |
| `supabase/migrations/*_insert_frogger_game.sql`                       | Seed de `frogger`                                                                                                                                                                       |
| `supabase/migrations/*_extend_temporary_insert_policy_to_frogger.sql` | Política de `INSERT` ampliada                                                                                                                                                           |

Convenciones:

- Diseño nuevo, sin código ni assets de referencia: todo se dibuja con primitivas de canvas.
- Coordenadas con origen arriba a la izquierda; la fila `r` ocupa `y ∈ [r × 40, r × 40 + 40)`. Velocidades en px/s, `dt` en segundos, limitado con `MAX_DT = 0.05`.
- El loop usa `requestAnimationFrame`; update y render en cada frame. Al reanudar tras pausa o `visibilitychange` se reinicia `lastTime` para evitar saltos.
- Orden del update en `playing`: aplicar el salto del búfer si la rana está viva y pasó el enfriamiento (sumando puntos de fila nueva), mover carriles y serpiente con el multiplicador del nivel, avanzar buceo, mosca y cocodrilo en casa, arrastrar a la rana si está sobre una plataforma, resolver la fila actual (carretera: choque; mediana: serpiente; río: plataforma, cabeza de cocodrilo o ahogo; fila 1: casa, mosca, cocodrilo o seto; bordes: fuera de pantalla), descontar tiempo, avanzar la muerte y el respawn, comprobar 5 casas (nivel siguiente o victoria), emitir callbacks.
- En `intro` solo avanza el contador del cartel; al terminar pasa a `playing`.
- Las colisiones se evalúan en cada frame, no solo al aterrizar.
- La pausa congela todo y descarta los saltos. En `gameover` y `win` el motor ignora `P`/`Esc`.
- `onPauseChange` solo se emite en cambios reales; el motor ignora `pause`/`resume` redundantes.
- `endGame` (botón FIN) pasa a `gameover`, dibuja el overlay y emite `onGameOver` con el puntaje actual sin tocar las vidas.
- La victoria emite `onScoreChange` con el bonus y luego `onGameOver`, sin emitir `onLivesChange`.
- `restart` carga el nivel 1 (con su cartel), deja puntaje 0, 3 vidas y casas vacías y emite puntaje, vidas y nivel iniciales.
- Las flechas, `Espacio` y las teclas del juego llaman a `preventDefault` mientras el motor está activo.
- No hay assets: no se carga ninguna imagen ni sonido, así que el motor arranca el loop directamente en `start()`.
- La mosca y el cocodrilo en casa usan `Math.random` solo para elegir la casa; el resto del juego es determinista.

## Plan de implementación

Antes de escribir código Next.js, leer en `node_modules/next/dist/docs/` la guía de Client Components y la de `cacheComponents` (data fetching y `use cache`). Usar `/frontend-design` para `.cover-frogger` y el marco del canvas. Mantener `params` dentro de `<Suspense>` en `/games/[id]` y `/games/[id]/play`.

1. Crear y aplicar la migración que inserta `frogger` en `games` (`apply_migration`) y guardar el mismo SQL en `supabase/migrations/`. Verificar: `list_migrations` la muestra y `select id from public.games` devuelve `asteroids`, `tetris`, `arkanoid`, `snake` y `frogger`.
2. Consultar `pg_policies` para confirmar el nombre vigente de la política de `INSERT`, crear y aplicar la migración que la reemplaza (y su archivo en `supabase/migrations/`). Verificar: un `insert` con rol `anon` para `frogger` con `user_id` nulo funciona (borrar la fila de prueba), para otro `game_id` o con `user_id` no nulo es rechazado, los otros cuatro juegos siguen aceptados, y `get_advisors` de seguridad no reporta problemas nuevos.
3. Agregar `.cover-frogger` en `app/globals.css` con `/frontend-design` (sin tocar `.cover-rana`). Verificar: `/games` muestra la tarjeta «RANA AL CRUCE» con su portada y los filtros `ARCADE` y `TODOS` la incluyen.
4. Crear `lib/games/frogger/types.ts`, `constants.ts` y `levels.ts`. Verificar: `npx tsc --noEmit` pasa.
5. Crear `entities.ts` (lógica pura: rana, carriles, wrap, buceo con desfase, cocodrilo, serpiente, casas). Verificar: `npx tsc --noEmit` pasa.
6. Crear `input.ts` (teclado, descarte de `event.repeat`, búfer de 1 salto, pausa, `preventDefault`). Verificar: `npx tsc --noEmit` pasa.
7. Crear `engine.ts` con estados `intro`/`playing`/`gameover`/`win`, loop con `MAX_DT`, saltos, colisiones, río, casas, mosca, cocodrilo en casa, tiempo, muerte y respawn, vidas, carga de niveles, victoria, pausa (`P`, `Esc`, `visibilitychange`), `endGame`, `restart`, `destroy` y callbacks; con un `draw` vacío. Verificar: `npx tsc --noEmit` y `npm run lint` pasan.
8. Crear `render.ts` (zonas, paletas día/noche, casas, obstáculos, cocodrilos, serpiente, mosca, rana con animación, franjas, cartel de nivel, overlays) y conectarlo al motor. Verificar: `npx tsc --noEmit` y `npm run lint` pasan.
9. Crear `components/frogger-canvas.tsx` (`"use client"`): crea el motor en `useEffect`, lo destruye al desmontar, aplica `isPaused`, expone `endGame`/`restart` por `ref`. Verificar: compila con `npx tsc --noEmit`.
10. Integrar en `GamePlayer`: entrada `frogger` en `REAL_GAMES`, caso `frogger` en `renderGame` y revisión de `handleLivesChange` para que la victoria con vidas restantes no cierre el modal. Verificar en `/games/frogger/play`: puntaje, vidas y nivel del HUD coinciden con los del canvas, `P`/`Esc` y el botón PAUSA se mantienen sincronizados, y los flujos de Asteroides, Tetris, Arkanoid y Snake no cambian.
11. Estilos del canvas (`.frogger-canvas`: ancho 100%, `aspect-ratio: 4 / 3`, sin desbordes). Verificar: sin scroll horizontal a 375px y a 1280px.
12. Flujo completo con Playwright (saltar con flechas y WASD, morir por cada causa, atrapar la mosca, completar niveles hasta ver cocodrilos y serpiente, pausar con `P`, `Esc` y botón, cambiar de pestaña, perder las 3 vidas, guardar puntaje, verlo en `/games/frogger` y `/hall-of-fame`, y comprobar la consola). La victoria se verifica cargando temporalmente el nivel 5 desde el código en local, sin commitear ese cambio. Luego ejecutar `npm run lint`, `npx tsc --noEmit` y `npm run build`.

## Criterios de aceptación

- [ ] `npm run build`, `npm run lint` y `npx tsc --noEmit` terminan sin errores.
- [ ] `select id from public.games` contiene `asteroids`, `tetris`, `arkanoid`, `snake` y `frogger`.
- [ ] `list_migrations` muestra las dos migraciones nuevas y el mismo SQL existe en `supabase/migrations/`.
- [ ] `/games` muestra la tarjeta «RANA AL CRUCE» (`ARCADE`) con `.cover-frogger`, junto a los otros cuatro juegos; los filtros `ARCADE` y `TODOS` la incluyen y `PUZZLE`/`SHOOTER`/`VERSUS` no.
- [ ] `/games/frogger` y `/games/frogger/play` cargan; un id inexistente sigue devolviendo 404.
- [ ] La partida empieza con el cartel «NIVEL 1 — AMANECER» durante 1,5 s y luego la rana en la fila 13 centrada.
- [ ] Cada pulsación de flecha o `W` `A` `S` `D` mueve la rana exactamente una celda; mantener la tecla pulsada no encadena saltos; la rana no baja de la fila 13 ni sale por los lados al saltar.
- [ ] Los carriles de cada nivel coinciden con las tablas (dirección, velocidad × multiplicador, largo y cantidad) y reaparecen por el lado contrario sin huecos ni saltos visibles.
- [ ] Tocar un vehículo mata a la rana, también si el vehículo la alcanza quieta.
- [ ] En el río la rana viaja sobre troncos, tortugas y el cuerpo de los cocodrilos; caer al agua, pisar la cabeza de un cocodrilo o salir por un borde arrastrada la mata.
- [ ] En el nivel 1 ninguna tortuga bucea; en los niveles 2 y 3 bucea el primer grupo de cada carril; en los niveles 4 y 5 bucean todos con desfase y nunca está todo un carril sumergido a la vez.
- [ ] Desde el nivel 3 la serpiente recorre la mediana, rebota en los bordes y mata al tocar a la rana.
- [ ] Entrar en una casa libre suma 50 + 10 × segundos enteros restantes; con la mosca visible suma además 200; caer en el seto, en una casa ocupada o en una con cocodrilo mata a la rana.
- [ ] En el nivel 5 el cocodrilo se asoma 3 s de cada 8 en una casa libre distinta de la de la mosca y no aparece si queda una sola casa libre.
- [ ] Cada fila nueva más alta de la rana actual suma 10 puntos; volver a una fila ya alcanzada no suma.
- [ ] El tiempo empieza en 40 s por rana, la barra cambia a amarillo bajo 10 s y a rojo bajo 5 s, y al llegar a 0 la rana muere.
- [ ] Cada muerte muestra la animación de 0,8 s, resta una vida en canvas y HUD, y la rana nueva aparece en la salida con 40 s.
- [ ] Al ocupar las 5 casas de los niveles 1–4 se suman 1000 puntos, el nivel sube en canvas y HUD, se muestra su cartel y las casas se vacían.
- [ ] Al ocupar las 5 casas del nivel 5 se suman 1000 + 500 × vidas, el canvas muestra «¡CRUCE COMPLETO!» y se abre el modal con el puntaje real, que sigue abierto aunque queden vidas.
- [ ] Con 0 vidas el canvas muestra «GAME OVER» y se abre el modal con el puntaje real.
- [ ] El HUD de la plataforma muestra Puntuación, Vidas y Nivel iguales a los del canvas en todo momento.
- [ ] La pausa congela carriles, serpiente, mosca, tiempo, cartel y animaciones e ignora los saltos; `P`, `Esc` y el botón PAUSA/REANUDAR se mantienen sincronizados (el CRT muestra «EN PAUSA» en todos los casos).
- [ ] Cambiar de pestaña pausa el juego y al volver no hay salto en los carriles ni en el tiempo.
- [ ] FIN abre el modal con el puntaje real y el canvas muestra «GAME OVER» sin cambiar las vidas.
- [ ] En game over y victoria `P` y `Esc` no reanudan; solo «JUGAR DE NUEVO» reinicia con puntaje 0, 3 vidas, nivel 1 y casas vacías en canvas y HUD.
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
- **Sí:** esta variante es la de **niveles diseñados con victoria**: cada nivel enseña una amenaza nueva del clásico (buceo, cocodrilos, serpiente, tráfico denso, cocodrilo en casa) y el juego termina al superar el quinto (decisión del agente). Se distingue de la A (dificultad sin fin solo por velocidad) y de la C (contrarreloj sin vidas).
- **Sí:** canvas 800×600 con grilla 20×15 de 40 px y el trazado clásico de 5 carriles de río y 5 de carretera (decisión del agente). Mantiene el aspect-ratio 4/3 de los otros juegos.
- **Sí:** salto lógico inmediato con 80 ms de animación, 100 ms de enfriamiento e `event.repeat` ignorado (decisión del agente). Colisiones simples y sin muertes por repetición automática.
- **Sí:** 40 s por rana en lugar de 30 (decisión del agente). Los niveles 3–5 exigen esperar a cocodrilos y tortugas.
- **Sí:** desfase de 1,6 s entre grupos que bucean (decisión del agente). **No:** buceo sincronizado; puede dejar un carril sin plataformas y crear muertes inevitables.
- **Sí:** el cocodrilo en casa solo aparece con 2 o más casas libres y nunca en la de la mosca (decisión del agente). Evita bloquear la última casa.
- **Sí:** mosca de 200 puntos y bonus de 500 por vida al ganar (decisión del agente). Premian el riesgo y terminar con vidas, y diferencian el ranking entre quienes ganan.
- **Sí:** victoria al completar el nivel 5 con el modal de guardado, como Arkanoid (decisión del agente). **No:** volver al nivel 1 con más velocidad; sería la variante A.
- **No:** vida extra (decisión del agente); con 5 niveles cerrados, 3 vidas son el reto.
- **No:** rana dama y nutrias (decisión del agente); suman reglas sin cambiar la experiencia lo bastante para justificar el coste.
- **Sí:** cartel de nivel de 1,5 s (decisión del agente). Anuncia la amenaza nueva y da un respiro.
- **Sí:** paleta nocturna solo cosmética en el nivel 5 (decisión del agente). **No:** reducir la visibilidad; sería injusto en pantallas pequeñas.
- **Sí:** dibujo vectorial y sin sonido (decisión del agente). No hay assets de Frogger en `public/games/` ni en `references/source-assets/`.
- **Sí:** el canvas dibuja puntaje, nivel, tiempo y vidas en sus franjas, como Arkanoid (decisión del agente).
- **Sí:** reemplazar la política de `INSERT` conservando el nombre `temporary anonymous insert for ported games`. **No:** una política aparte para `frogger`; debe retirarse junta en la spec de auth.
- **Sí:** `.cover-frogger` nueva. **No:** reutilizar `.cover-rana`; es un mock genérico del catálogo antiguo.
- **Sí:** alcance por defecto: solo teclado, sin auth.

## Riesgos identificados

| Riesgo                                                                   | Mitigación                                                                                                                                      |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `GamePlayer` y `REAL_GAMES` cerrados a los cuatro juegos actuales        | Añadir `frogger` con los flags vigentes (`hasLives`, `hasSkinSelector`); verificar los otros cuatro juegos tras el cambio.                      |
| `handleLivesChange` cierra el modal cuando la victoria termina con vidas | En la victoria no se emite `onLivesChange`; revisar el orden de callbacks en el paso 10 y verificar que el modal sigue abierto.                 |
| Nombre exacto de la política de `INSERT` distinto al documentado         | Consultar `pg_policies` antes de escribir el `drop policy`; verificar con inserts de prueba como `anon`.                                        |
| Doble montaje en `StrictMode` duplica listeners o loops                  | `destroy()` idempotente, llamado en el cleanup del `useEffect`; `start()` ignora llamadas tras `destroy`.                                       |
| Bucle `onPauseChange` ↔ `isPaused` entre motor y `GamePlayer`            | El motor ignora `pause`/`resume` redundantes y solo emite en cambios reales.                                                                    |
| `cacheComponents` cambia la semántica de render                          | Leer la guía antes del paso 9; la página de juego es un shell con un componente cliente.                                                        |
| `params` fuera de `<Suspense>` en `/games/[id]` y `/play`                | Mantener `await params` dentro de componentes envueltos en `<Suspense>`; revisar la consola.                                                    |
| Controles distintos a los otros juegos (saltos discretos, sin `Espacio`) | `preventDefault` en flechas, WASD y `Espacio` solo con el motor activo; verificar que ninguna tecla hace scroll ni encadena saltos.             |
| Saltos de `dt` que teletransportan carriles o vacían el tiempo           | `MAX_DT`, reinicio de `lastTime` al reanudar y pausa automática en `visibilitychange`.                                                          |
| Niveles 4–5 imposibles por combinaciones de buceo, cocodrilos y tráfico  | Desfase de buceo, cocodrilo en casa restringido y 40 s por rana; jugar cada nivel completo en el paso 12 y ajustar solo valores de `levels.ts`. |
| Probar la victoria exige jugar los 5 niveles                             | Verificación local cargando el nivel 5 desde el código sin commitear; no se añade selector de nivel al juego.                                   |
| Wrap de carriles con huecos o solapes visibles                           | Pista de 960 px y reparto `LANE_TRACK_LENGTH / count`; revisar cada nivel en el paso 12.                                                        |
| Puntajes falsificados por el `INSERT` anónimo temporal                   | Riesgo ya asumido en la SPEC 06; se mitiga con los `CHECK` y se retira en la spec de auth.                                                      |

## Lo que **no** entra en esta spec

- Controles táctiles o móvil.
- Sonido, música, volumen o silencio.
- Rana dama, nutrias, vida extra, modo infinito y selector de nivel.
- Autenticación, retiro de la política temporal y anti-trampas.
- Contador real de partidas y Realtime.
- Otros juegos del catálogo.
- Tests automatizados.

Cada uno, si se hace, va en su propia spec.
