# SPEC 09 — Juego Arkanoid integrado en la plataforma

> **Estado:** Approved
> **Depende de:** SPEC 05, SPEC 06, SPEC 07, SPEC 08
> **Fecha:** 2026-10-19
> **Objetivo:** Portar `references/started-games/04-arkanoid/` a un motor TypeScript, registrarlo en `games` y jugarlo en `/games/arkanoid/play` con HUD de la plataforma, pausa, sonidos y guardado de puntaje en `leaderboard`.

## Alcance

**Dentro:**

- Motor en `lib/games/arkanoid/` (`types.ts`, `constants.ts`, `levels.ts`, `sprites.ts`, `entities.ts`, `input.ts`, `render.ts`, `engine.ts`) portado de `game.js`, `levels.js` y `assets/spritesheet.js` con el contrato de Asteroides: `createArkanoidEngine(canvas, callbacks)` devuelve `start`, `pause`, `resume`, `endGame`, `restart`, `destroy`; sin globals ni acceso a `document`/`window`/`Audio`/`Image` al importar; callbacks solo cuando cambia el valor; `restart` emite los valores iniciales; `destroy` idempotente; pausa automática en `visibilitychange`.
- Reglas, física y puntajes del original: canvas 800×600, paleta de 81×14 px (el ancho de `game.js`; el README dice 162, que es el ancho del sprite) a `y = 560` con velocidad 400 px/s, bola 16×16, velocidad base `vx = 200`, `vy = −300` multiplicada por el `speed` del nivel, bloques 64×24 en parrilla de 10 columnas con origen `(80, 80)`, 10 puntos por bloque, 3 vidas, 5 niveles con `speed` 1.00 / 1.10 / 1.21 / 1.33 / 1.46, un solo bloque destruido por frame, la bola invierte `vy` al romper un bloque, rebote en paleta solo con `vy > 0`, y al limpiar un nivel se carga el siguiente con la bola sobre la paleta (sin vida perdida).
- Controles: `←` `→` mueven la paleta, el mouse la mueve sobre el canvas (posición escalada al tamaño CSS del canvas, como el original), `P` o `Esc` pausan/reanudan.
- Animación de explosión de 4 frames (150 ms) al romper un bloque, con los frames del spritesheet.
- Sonidos del original (`ball-bounce.mp3` en rebotes de pared, techo y paleta; `break-sound.mp3` al romper bloque), copiados a `public/games/arkanoid/sounds/`. Se reproducen con un clon del `Audio`, con el `Promise` de `play()` capturado para no lanzar errores si el navegador lo bloquea.
- Spritesheet `spritesheet-breakout.png` copiado a `public/games/arkanoid/`. El motor carga la imagen en `start()` y no arranca el loop hasta que carga; `destroy()` antes de la carga cancela el arranque.
- Canvas dibuja su propio HUD durante el juego (Score a la izquierda, Nivel al centro, vidas como bolas a la derecha) y los overlays «GAME OVER» y «¡Completaste el juego!». La pausa la muestra el CRT de la plataforma («EN PAUSA»).
- Al limpiar el nivel 5 el motor pasa a estado de victoria, el canvas muestra «¡Completaste el juego!» y se emite `onGameOver` con el puntaje real para abrir el modal de guardado.
- Callbacks: `onScoreChange`, `onLivesChange`, `onLevelChange`, `onPauseChange` y `onGameOver`. El HUD de la plataforma muestra Jugador, Puntuación, Vidas (reales, 3 iniciales) y Nivel.
- Componente cliente `components/arkanoid-canvas.tsx` que monta y destruye el motor.
- Migración que inserta `arkanoid` en `public.games` (`ARCADE`, `yellow`, cover `cover-arkanoid`) con estos textos:
  - `short`: «Rompe todos los bloques con la bola y no dejes que caiga.»
  - `long`: «Mueve la paleta, rebota la bola y destruye los bloques de 5 niveles cada vez más rápidos. Tienes 3 vidas y cada bloque suma 10 puntos.»
- Migración que reemplaza la política temporal de `INSERT` de `leaderboard` para aceptar `asteroids`, `tetris` y `arkanoid` (mantiene `user_id is null`).
- Estilo `.cover-arkanoid` en `app/globals.css`: bloques neón en filas, paleta y bola con brillo amarillo sobre fondo oscuro. Distinta de `.cover-bricks`, que ya existe sin uso y no se toca.
- Integración en `components/game-player.tsx`: entrada `arkanoid` en `REAL_GAMES` (`hasLives: true`, `hasThemeToggle: false`) y caso `arkanoid` en `renderGame`. `onPauseChange` y la lógica de `handleLivesChange` ya existen; solo se comprueba que no interfieran con la victoria.
- Verificar que `saveScore` y `lib/score-rules.ts` aceptan el juego sin cambios de código y que el modal guarda en `leaderboard`.
- Estilo `.arkanoid-canvas` (ancho 100%, `aspect-ratio: 4 / 3`) junto a `.asteroids-canvas`.
- Textos visibles en español, código en inglés.

**Fuera de alcance (para futuras specs):**

- Controles táctiles / móvil.
- Selector de nivel en la pausa (cheat que falsea el ranking; ver decisiones).
- Sonido adicional, música o control de volumen/silencio.
- Autenticación y retiro de la política temporal de `INSERT`.
- Anti-trampas y validación de puntaje en servidor.
- Contador real de partidas (`plays_count`), `best` distinto de `MAX(score)`, Realtime.
- Mecánicas nuevas que no estén en el original (power-ups, ángulo de rebote según la zona de la paleta, bloques resistentes, niveles extra).
- Tests automatizados.
- Otros juegos del catálogo.

## Modelo de datos

Fila nueva en `games` (migración `<timestamp>_insert_arkanoid_game.sql`):

```sql
insert into public.games (id, title, short, long, category, cover, color)
values ('arkanoid', 'ARKANOID', '<short>', '<long>', 'ARCADE', 'cover-arkanoid', 'yellow');
```

Política de `INSERT` (migración `<timestamp>_extend_temporary_insert_policy_to_arkanoid.sql`). El nombre vigente se confirma con `pg_policies` antes de escribirla; hoy es `temporary anonymous insert for ported games` (SPEC 08) y se conserva porque sigue siendo exacto:

```sql
drop policy "temporary anonymous insert for ported games" on public.leaderboard;

create policy "temporary anonymous insert for ported games" on public.leaderboard
  for insert to anon, authenticated
  with check (game_id in ('asteroids', 'tetris', 'arkanoid') and user_id is null);
```

Tipos del motor (`lib/games/arkanoid/types.ts`):

```ts
interface ArkanoidCallbacks {
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onPauseChange: (isPaused: boolean) => void;
  onGameOver: (finalScore: number) => void;
}

interface ArkanoidEngine {
  start: () => void;
  pause: () => void;
  resume: () => void;
  endGame: () => void;
  restart: () => void;
  destroy: () => void;
}

type ArkanoidState = "playing" | "gameover" | "win";
type BlockColor =
  "gray" | "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green";

interface Paddle {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Ball {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
}
interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  alive: boolean;
}
interface Explosion {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  elapsed: number;
}
interface LevelBlock {
  col: number;
  row: number;
  color: BlockColor;
}
interface Level {
  speed: number;
  blocks: LevelBlock[];
}

function createArkanoidEngine(
  canvas: HTMLCanvasElement,
  callbacks: ArkanoidCallbacks,
): ArkanoidEngine;
```

Config por juego en `components/game-player.tsx` (se amplía `REAL_GAMES` de la SPEC 08):

```ts
const REAL_GAMES = {
  asteroids: { hasLives: true, hasThemeToggle: false },
  tetris: { hasLives: false, hasThemeToggle: true },
  arkanoid: { hasLives: true, hasThemeToggle: false },
} as const;
```

Archivos:

| Archivo                                                                | Contenido                                                                                                                    |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `lib/games/arkanoid/types.ts`                                          | Interfaces y tipos anteriores                                                                                                |
| `lib/games/arkanoid/constants.ts`                                      | Dimensiones, velocidades, `POINTS_PER_BLOCK`, `INITIAL_LIVES`, `MAX_LEVEL`, `MAX_DT`, rutas de assets, duración de explosión |
| `lib/games/arkanoid/levels.ts`                                         | `LEVELS`: los 5 niveles generados como en `levels.js`, con `speed` y bloques                                                 |
| `lib/games/arkanoid/sprites.ts`                                        | `SPRITES`, `EXPLOSION_FRAMES`, `loadSpritesheet`, `drawSprite`, `drawFrame` (portado de `assets/spritesheet.js`)             |
| `lib/games/arkanoid/entities.ts`                                       | Lógica pura: `createBlocks`, `createPaddle`, `createBall`, `collidesWithBlock`                                               |
| `lib/games/arkanoid/input.ts`                                          | Teclado (`←` `→`, `P`/`Esc`), mouse sobre el canvas, `preventDefault` en flechas, alta/baja de listeners                     |
| `lib/games/arkanoid/render.ts`                                         | Fondo, bloques, explosiones, paleta, bola, HUD del canvas, overlays GAME OVER y victoria                                     |
| `lib/games/arkanoid/engine.ts`                                         | `createArkanoidEngine`: estado, loop, física, niveles, vidas, sonidos, pausa, callbacks                                      |
| `components/arkanoid-canvas.tsx`                                       | Cliente: monta/destruye el motor, aplica `isPaused`                                                                          |
| `public/games/arkanoid/spritesheet-breakout.png`                       | Copia de `assets/spritesheet-breakout.png`                                                                                   |
| `public/games/arkanoid/sounds/ball-bounce.mp3`, `break-sound.mp3`      | Copias de `assets/sounds/`                                                                                                   |
| `supabase/migrations/*_insert_arkanoid_game.sql`                       | Seed de `arkanoid`                                                                                                           |
| `supabase/migrations/*_extend_temporary_insert_policy_to_arkanoid.sql` | Política de `INSERT` ampliada                                                                                                |

Convenciones:

- Origen del port: `references/started-games/04-arkanoid/game.js`, `levels.js` y `assets/spritesheet.js`. No se copia su código a la spec.
- Las constantes de `game.js` se portan literalmente. Coordenadas con origen arriba a la izquierda, velocidades en px/s, `dt` en segundos.
- `dt` limitado con `MAX_DT = 0.05`, como Asteroides. El original no lo limita; evita saltos si un frame tarda.
- Al reanudar tras pausa o `visibilitychange` se reinicia `lastTime` para evitar saltos.
- La pausa congela física, explosiones y teclas de movimiento; el mouse no mueve la paleta en pausa.
- `onPauseChange` solo se emite en cambios reales de estado (`P`, `Esc`, `pause`, `resume`, visibilidad) y el motor ignora `pause`/`resume` redundantes. En `gameover` y `win` el motor ignora `P`/`Esc`.
- `endGame` (botón FIN) pasa a `gameover`, dibuja el overlay y emite `onGameOver` con el puntaje actual sin tocar las vidas.
- `restart` carga el nivel 1, deja 3 vidas, puntaje 0 y emite los valores iniciales de puntaje, vidas y nivel.
- Los sonidos usan `new Audio(url)` creado dentro de `createArkanoidEngine`, nunca al importar el módulo.
- Las flechas llaman a `preventDefault` mientras el motor está activo.
- Los mp3 y el PNG se sirven desde `/games/arkanoid/…` (rutas absolutas, no relativas al HTML).

## Plan de implementación

Antes de escribir código Next.js, leer en `node_modules/next/dist/docs/` la guía de Client Components y la de `cacheComponents` (data fetching y `use cache`). Usar `/frontend-design` para `.cover-arkanoid` y el marco del canvas. Mantener `params` dentro de `<Suspense>` en `/games/[id]` y `/games/[id]/play`.

1. Crear y aplicar la migración que inserta `arkanoid` en `games` (`apply_migration`) y guardar el mismo SQL en `supabase/migrations/`. Verificar: `list_migrations` la muestra y `select id from public.games` devuelve `asteroids`, `tetris` y `arkanoid`.
2. Consultar `pg_policies` para confirmar el nombre vigente de la política de `INSERT`, crear y aplicar la migración que la reemplaza (y su archivo en `supabase/migrations/`). Verificar: un `insert` con rol `anon` para `arkanoid` con `user_id` nulo funciona (borrar la fila de prueba), para otro `game_id` o con `user_id` no nulo es rechazado, `asteroids` y `tetris` siguen aceptados, y `get_advisors` de seguridad no reporta problemas nuevos.
3. Agregar `.cover-arkanoid` en `app/globals.css` (revisar antes colisiones de nombre con `.cover-bricks`). Verificar: `/games` muestra la tarjeta «ARKANOID» con su portada y los filtros `ARCADE` y `TODOS` la incluyen.
4. Copiar `spritesheet-breakout.png` y los dos mp3 a `public/games/arkanoid/`. Verificar: `curl -I` a `/games/arkanoid/spritesheet-breakout.png` y a los dos sonidos devuelve 200 con el servidor de desarrollo.
5. Crear `lib/games/arkanoid/types.ts`, `constants.ts` y `levels.ts`. Verificar: `npx tsc --noEmit` pasa.
6. Crear `sprites.ts` (carga de imagen sin ejecutar nada al importar) y `entities.ts` (lógica pura). Verificar: `npx tsc --noEmit` pasa.
7. Crear `input.ts` (teclado, mouse, pausa, `preventDefault`). Verificar: `npx tsc --noEmit` pasa.
8. Crear `engine.ts` con estado, loop con `MAX_DT`, física, colisiones, niveles, vidas, victoria, sonidos, pausa (`P`, `Esc`, `visibilitychange`), `endGame`, `restart`, `destroy` y callbacks; con un `draw` vacío. Verificar: `npx tsc --noEmit` y `npm run lint` pasan.
9. Crear `render.ts` (fondo, bloques, explosiones, paleta, bola, HUD del canvas, overlays) y conectarlo al motor. Verificar: `npx tsc --noEmit` y `npm run lint` pasan.
10. Crear `components/arkanoid-canvas.tsx` (`"use client"`): crea el motor en `useEffect`, lo destruye al desmontar, aplica `isPaused`, expone `endGame`/`restart` por `ref`. Verificar: compila con `npx tsc --noEmit`.
11. Integrar en `GamePlayer`: entrada `arkanoid` en `REAL_GAMES`, caso `arkanoid` en `renderGame` y revisión de `handleLivesChange` para que la victoria con vidas restantes no cierre el modal. Verificar en `/games/arkanoid/play`: puntaje, vidas y nivel del HUD coinciden con los del canvas, `P`/`Esc` y el botón PAUSA se mantienen sincronizados, y los flujos de Asteroides y Tetris no cambian.
12. Estilos del canvas (`.arkanoid-canvas`: ancho 100%, `aspect-ratio: 4 / 3`, sin desbordes). Verificar: sin scroll horizontal a 375px y a 1280px, y la paleta con mouse sigue la posición del cursor con el canvas escalado.
13. Flujo completo con Playwright (jugar con teclado y mouse, pausar con `P`, `Esc` y botón, perder vidas, perder la partida, guardar puntaje, verlo en `/games/arkanoid` y `/hall-of-fame`, y comprobar la consola). Luego ejecutar `npm run lint`, `npx tsc --noEmit` y `npm run build`.

## Criterios de aceptación

- [ ] `npm run build`, `npm run lint` y `npx tsc --noEmit` terminan sin errores.
- [ ] `select id from public.games` contiene `asteroids`, `tetris` y `arkanoid`.
- [ ] `list_migrations` muestra las dos migraciones nuevas y el mismo SQL existe en `supabase/migrations/`.
- [ ] `/games` muestra la tarjeta «ARKANOID» (`ARCADE`) con `.cover-arkanoid`, junto a «ASTEROIDES» y «TETRIS»; los filtros `ARCADE` y `TODOS` la incluyen y `PUZZLE`/`VERSUS` no.
- [ ] `/games/arkanoid` y `/games/arkanoid/play` cargan; un id inexistente sigue devolviendo 404.
- [ ] `/games/arkanoid/spritesheet-breakout.png`, `/games/arkanoid/sounds/ball-bounce.mp3` y `/games/arkanoid/sounds/break-sound.mp3` responden 200 y la imagen aparece en el canvas.
- [ ] `←` `→` y el mouse mueven la paleta; `P` y `Esc` pausan y reanudan, como en el original.
- [ ] Hay 5 niveles con los patrones del original (parrilla, pirámide, ajedrez, filas con huecos, marco con cruz) y velocidades ×1.00 / 1.10 / 1.21 / 1.33 / 1.46.
- [ ] Cada bloque destruido suma exactamente 10 puntos y muestra la animación de explosión de 4 frames.
- [ ] La bola rebota en paredes, techo y paleta, y suena `ball-bounce.mp3`; al romper un bloque suena `break-sound.mp3`.
- [ ] Al caer la bola se pierde una vida y la bola vuelve a la paleta; con 0 vidas el canvas muestra «GAME OVER» y se abre el modal.
- [ ] Al limpiar un nivel (1–4) se carga el siguiente con la bola sobre la paleta y el HUD de la plataforma sube el nivel.
- [ ] Al limpiar el nivel 5 el canvas muestra «¡Completaste el juego!» y se abre el modal con el puntaje real.
- [ ] El HUD de la plataforma muestra Puntuación, Vidas y Nivel iguales a los del canvas en todo momento.
- [ ] La pausa congela bola, paleta y explosiones e ignora teclas y mouse; `P`, `Esc` y el botón PAUSA/REANUDAR se mantienen sincronizados (el CRT muestra «EN PAUSA» en todos los casos).
- [ ] Cambiar de pestaña pausa el juego y al volver no hay salto en la posición de la bola.
- [ ] FIN abre el modal con el puntaje real y el canvas muestra «GAME OVER» sin cambiar las vidas.
- [ ] En game over y victoria `P` y `Esc` no reanudan; solo «JUGAR DE NUEVO» reinicia con puntaje 0, 3 vidas y nivel 1 en canvas y HUD.
- [ ] El overlay de pausa no ofrece salto de nivel.
- [ ] Guardar crea una fila en `leaderboard` con `game_id = 'arkanoid'`, `user_id` nulo, el nombre y el puntaje finales, visible en `/games/arkanoid` y en el Salón de la Fama.
- [ ] Un nombre de menos de 3 caracteres o un puntaje inválido se rechazan con un error en español.
- [ ] Un `insert` con otro `game_id` (o `user_id` no nulo) sigue rechazado por RLS.
- [ ] Destruir el motor (SALIR o navegación) no deja listeners de teclado ni de mouse ni `requestAnimationFrame` activos, también con el doble montaje de `StrictMode` y si se destruye antes de que cargue el spritesheet.
- [ ] Las flechas no hacen scroll de la página mientras se juega.
- [ ] El canvas escala sin scroll horizontal a 375px y a 1280px.
- [ ] Sin errores de hidratación ni de Suspense en la consola de las pantallas afectadas, y sin rechazos de `play()` sin capturar.
- [ ] Asteroides y Tetris siguen funcionando (HUD, pausa, fin, reinicio, guardado).

## Decisiones tomadas y descartadas

- **Sí:** `id` `arkanoid`, título `ARKANOID`, categoría `ARCADE`, color `yellow` (decisión del usuario). Los bloques del original son amarillos y rojos y no repite cyan ni magenta.
- **Sí:** portada nueva `.cover-arkanoid` (decisión del usuario), diseñada con `/frontend-design`. **No:** reutilizar `.cover-bricks`, un mock genérico que seguiría sin uso.
- **Sí:** portar los dos sonidos del original (decisión del usuario). **No:** dejar el juego mudo; se pierde fidelidad.
- **Sí:** conservar el control con mouse además de `←` `→` (decisión del usuario). Es parte del original y el escalado al tamaño CSS ya estaba resuelto allí.
- **Sí:** quitar el selector de nivel de la pausa (decisión del usuario). Permitía saltar al nivel 5 y falsear el ranking; la pausa la muestra el CRT. **No:** conservarlo con clics dentro del canvas: añade lógica de UI al motor y rompe la integridad del ranking.
- **Sí:** al limpiar el nivel 5 el juego termina y abre el modal de guardado (decisión del usuario). **No:** reiniciar sumando niveles; sería una mecánica nueva.
- **Sí:** pausa con `P` y `Esc` además del botón PAUSA (decisión del usuario), con `onPauseChange` para evitar desincronización, como en Tetris.
- **Sí:** textos del catálogo propuestos en la entrevista (decisión del usuario).
- **Sí:** paleta de 81 px como en `game.js`, no 162 como dice el README. Es el comportamiento real del código fuente.
- **Sí:** `MAX_DT = 0.05`, igual que Asteroides. El original no lo limita, pero en la plataforma un frame largo no debe atravesar bloques.
- **Sí:** vidas reales en el HUD de la plataforma (`hasLives: true`), con `onLivesChange`. **No:** `onLinesChange` ni equivalentes: no existen en este juego.
- **Sí:** assets en `public/games/arkanoid/` con rutas absolutas, y carga del spritesheet dentro del motor, no al importar. Evita acceso a `Image`/`document` en el servidor.
- **Sí:** la carga del spritesheet en `start()` retrasa el loop hasta que la imagen está lista. **No:** dibujar sin sprites mientras carga; el original tampoco lo hacía.
- **Sí:** reemplazar la política de `INSERT` conservando el nombre `temporary anonymous insert for ported games`, que sigue siendo exacto (SPEC 08). **No:** una política aparte para `arkanoid`; debe retirarse junta en la spec de auth.
- **Sí:** `FIN` no toca las vidas; solo cambia a `gameover` y emite `onGameOver`.
- **Sí:** alcance por defecto: solo teclado y mouse, sin mecánicas nuevas, sin auth (decisión del usuario).

## Riesgos identificados

| Riesgo                                                                                                 | Mitigación                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `GamePlayer` cerrado a Asteroides y Tetris                                                             | Añadir `arkanoid` a `REAL_GAMES`; verificar ambos juegos tras el cambio (criterio de aceptación).                                             |
| `handleLivesChange` cierra el modal cuando las vidas son mayores que 0 y la victoria termina con vidas | Revisar el orden de callbacks en el paso 11: en la victoria no se emite `onLivesChange`; verificar que el modal sigue abierto.                |
| Nombre exacto de la política de `INSERT` distinto al documentado                                       | Consultar `pg_policies` antes de escribir el `drop policy`; verificar con inserts de prueba como `anon`.                                      |
| Doble montaje en `StrictMode` duplica listeners, loops o cargas de imagen                              | `destroy()` idempotente, llamado en el cleanup del `useEffect`; cancelar el arranque si se destruye antes de la carga de la imagen.           |
| El spritesheet no carga (404, red) y el juego queda en negro                                           | Verificar la ruta en el paso 4; si falla la carga, el motor no inicia el loop y deja un mensaje en `console.error`, como el original.         |
| Navegador bloquea `Audio.play()` hasta que hay interacción                                             | Capturar el `Promise` de `play()`; el primer sonido ocurre tras una tecla o mouse, que cuenta como interacción.                               |
| Mouse y canvas escalado por CSS desalinean la paleta                                                   | Convertir `clientX` con la escala `canvas.width / rect.width` como el original; verificar a 375px y a 1280px en el paso 12.                   |
| Bucle `onPauseChange` ↔ `isPaused` entre motor y `GamePlayer`                                          | El motor ignora `pause`/`resume` redundantes y solo emite en cambios reales.                                                                  |
| `cacheComponents` cambia la semántica de render                                                        | Leer la guía antes del paso 10; la página de juego es un shell con un componente cliente.                                                     |
| `params` fuera de `<Suspense>` en `/games/[id]` y `/play`                                              | Mantener `await params` dentro de componentes envueltos en `<Suspense>`; revisar la consola.                                                  |
| Controles distintos a Asteroides y Tetris (mouse, `Esc`, sin disparo ni `Espacio`)                     | `Esc` y `P` pausan solo con el motor activo; el mouse solo se escucha sobre el canvas; verificar que `Espacio` no hace nada y no hace scroll. |
| Bola que atraviesa bloques o paleta con frames largos                                                  | `MAX_DT` y reinicio de `lastTime` al reanudar.                                                                                                |
| Puntajes falsificados por el `INSERT` anónimo temporal                                                 | Riesgo ya asumido en la SPEC 06; se mitiga con los `CHECK` y se retira en la spec de auth.                                                    |

## Lo que **no** entra en esta spec

- Controles táctiles o móvil.
- Selector de nivel en la pausa y cualquier mecánica nueva (power-ups, ángulo de rebote por zona, bloques resistentes).
- Música, volumen o silencio.
- Autenticación, retiro de la política temporal y anti-trampas.
- Contador real de partidas y Realtime.
- Otros juegos del catálogo.
- Tests automatizados.

Cada uno, si se hace, va en su propia spec.
