# SPEC 05 — Juego Asteroides integrado en la plataforma

> **Estado:** Implemented
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-18
> **Objetivo:** Portar el juego `references/started-games/02-asteroids/` a un motor TypeScript y jugarlo en `/games/asteroids/play`, con el HUD de la plataforma (puntaje, vidas, nivel, pausa, fin) alimentado por el motor.

## Alcance

**Dentro:**

- Motor del juego en TypeScript (`lib/games/asteroids/`), portado de `game.js` sin cambiar reglas, física, puntajes ni controles (← → rotar, ↑ propulsar, Espacio disparar; incluye power-up de triple disparo y partículas).
- API del motor sin globals ni acceso a `document`: recibe el `canvas` y callbacks, y expone control de ciclo de vida.
- Nueva entrada de catálogo `asteroids` en `lib/games.ts` (título "ASTEROIDES", categoría `SHOOTER`, color `cyan`) con su `cover-asteroids` en `app/globals.css`. La entrada `rocas` no se toca.
- `GamePlayer` renderiza el juego real cuando `gameId === "asteroids"` y conserva el simulador mock para los demás juegos.
- Componente cliente `AsteroidsCanvas` que monta el motor en un `<canvas>` y lo destruye al desmontar (listeners, `requestAnimationFrame`).
- HUD de la plataforma (jugador, puntuación, vidas, nivel) refleja los valores reales del motor vía callbacks.
- HUD dibujado en el canvas (SCORE, NIVEL, vidas, contador de triple disparo) y overlay "GAME OVER" se mantienen.
- PAUSA congela el loop; FIN fuerza game over; "JUGAR DE NUEVO" del modal y `Espacio` reinician la partida.
- El loop se pausa automáticamente si la pestaña pierde visibilidad.
- Canvas con resolución interna 800×600 y ancho fluido por CSS (`aspect-ratio: 4/3`) dentro del CRT.
- Textos visibles en español, código y rutas en inglés.

**Fuera de alcance (para futuras specs):**

- Guardar la puntuación (el botón "GUARDAR PUNTUACIÓN" sigue mock) y tabla `scores` en Supabase.
- Controles táctiles / móvil (solo teclado).
- Tecla de pausa dentro del juego.
- Sonido, OVNIs u otras mecánicas nuevas.
- Portar los otros 7 juegos del catálogo.
- Tests automatizados.

## Modelo de datos

Sin persistencia. Se tipan la interfaz del motor y sus callbacks en `lib/games/asteroids/types.ts`.

```ts
// lib/games/asteroids/types.ts
interface AsteroidsCallbacks {
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

interface AsteroidsEngine {
  start: () => void; // inicia el loop y los listeners de teclado
  pause: () => void;
  resume: () => void;
  endGame: () => void; // fuerza game over (botón FIN)
  restart: () => void;
  destroy: () => void; // cancela rAF y quita listeners
}

type AsteroidsState = "playing" | "dead" | "gameover";

function createAsteroidsEngine(
  canvas: HTMLCanvasElement,
  callbacks: AsteroidsCallbacks,
): AsteroidsEngine;
```

Estructura de archivos prevista:

| Archivo                            | Contenido                                                                |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `lib/games/asteroids/types.ts`     | Interfaces anteriores                                                    |
| `lib/games/asteroids/constants.ts` | `WIDTH`, `HEIGHT`, `RADII`, `SPEEDS`, `POINTS`, `INITIAL_LIVES`          |
| `lib/games/asteroids/entities.ts`  | Clases `Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`               |
| `lib/games/asteroids/input.ts`     | Seguimiento de teclas (`keys`, `justPressed`) con alta/baja de listeners |
| `lib/games/asteroids/engine.ts`    | `createAsteroidsEngine`: estado, loop, colisiones, dibujo                |
| `components/asteroids-canvas.tsx`  | Cliente: monta y destruye el motor                                       |

Convenciones:

- Las constantes y la lógica se portan literalmente de `game.js`; solo cambia la estructura (módulos, tipos, estado encapsulado en el motor).
- Los callbacks se invocan solo cuando el valor cambia, no en cada frame.
- `dt` se limita a 50 ms igual que el original.
- La opción `GamePlayer` hace `switch` por `gameId` hacia el componente de juego; el mock queda como valor por defecto.

## Plan de implementación

Antes de escribir código Next.js, leer en `node_modules/next/dist/docs/` la guía de Client Components y la de `cacheComponents`. Usar `/frontend-design` para `cover-asteroids` y el marco del canvas.

1. Agregar la entrada `asteroids` a `GAMES` en `lib/games.ts` y `.cover-asteroids` en `app/globals.css`. Verificar: `/games` muestra la ficha y `/games/asteroids` carga con el mock actual.
2. Crear `lib/games/asteroids/types.ts` y `constants.ts`. Verificar: `npx tsc --noEmit` pasa.
3. Crear `input.ts` y `entities.ts` portando `Bullet`, `Asteroid`, `Ship`, `Particle` y `PowerUp` de `game.js`. Verificar: `npx tsc --noEmit` pasa.
4. Crear `engine.ts` con `createAsteroidsEngine` (estado encapsulado, loop, update/draw, callbacks, `pause`/`resume`/`endGame`/`restart`/`destroy`, pausa por `visibilitychange`). Verificar: `npx tsc --noEmit` y `npm run lint` pasan.
5. Crear `components/asteroids-canvas.tsx` (`"use client"`) que crea el motor en `useEffect`, lo destruye al desmontar y expone el control por `ref`/props. Verificar: el juego se ve y responde al teclado en una página de prueba temporal o en `/games/asteroids/play`.
6. Integrar en `GamePlayer`: para `asteroids` renderizar `AsteroidsCanvas` dentro de `crt-screen` en lugar de `game-arena`; conectar callbacks al estado de score/lives/level; PAUSA → `pause`/`resume`; FIN → `endGame`; `onGameOver` abre el modal; "JUGAR DE NUEVO" → `restart`. Los demás juegos conservan el mock. Verificar: puntaje, vidas y nivel del HUD de la plataforma coinciden con los del canvas durante la partida.
7. Estilos del canvas (ancho 100%, `aspect-ratio: 4/3`, sin desbordes ≤ 840px). Verificar: sin scroll horizontal a 375px y a 1280px.
8. Probar el flujo completo con Playwright (jugar, pausar, perder, reiniciar, salir) y ejecutar `npm run lint` y `npm run build`.

## Criterios de aceptación

- [ ] `npm run build`, `npm run lint` y `npx tsc --noEmit` terminan sin errores.
- [ ] `/games` muestra la ficha "ASTEROIDES" (`SHOOTER`) y `rocas` sigue igual.
- [ ] `/games/asteroids/play` muestra el juego real en el CRT; los otros 7 juegos siguen mostrando el mock.
- [ ] Los controles ← → ↑ y Espacio funcionan como en el original; reglas y puntajes (grande 20, mediano 50, pequeño 100) no cambian.
- [ ] El HUD de la plataforma muestra puntaje, vidas y nivel iguales a los del HUD del canvas en todo momento.
- [ ] El HUD del canvas y el overlay "GAME OVER" siguen visibles.
- [ ] PAUSA congela asteroides, nave y partículas; REANUDAR continúa sin saltos de movimiento.
- [ ] Con el juego en pausa, las flechas y `Espacio` no tienen efecto (no se mueve ni dispara la nave) hasta reanudar.
- [ ] Cambiar de pestaña pausa el loop y al volver no hay salto de `dt`.
- [ ] FIN termina la partida y abre el modal con el puntaje actual.
- [ ] Al perder las 3 vidas se abre el modal con el puntaje final real.
- [ ] "JUGAR DE NUEVO" y `Espacio` (en game over) reinician con puntaje 0, 3 vidas y nivel 1 en canvas y HUD.
- [ ] "GUARDAR PUNTUACIÓN" sigue siendo mock y no persiste nada.
- [ ] Salir de la página (SALIR o navegación) destruye el motor: no quedan listeners de teclado ni `requestAnimationFrame` activos.
- [ ] Las teclas de flechas y Espacio no hacen scroll de la página mientras se juega.
- [ ] Con ancho ≤ 840px el canvas escala sin scroll horizontal.
- [ ] Sin errores ni warnings de hidratación en la consola.

## Decisiones tomadas y descartadas

- **Sí:** motor TypeScript con `createAsteroidsEngine` y callbacks. Permite que React refleje el estado real y que el juego se pueda destruir limpiamente.
- **No:** copiar `game.js` a `public/` con `<script>`. Mantiene globals, sin tipos ni comunicación con el HUD.
- **No:** `iframe`. Requiere `postMessage` para puntaje y pausa.
- **Sí:** entrada nueva `asteroids` en el catálogo (decisión del usuario), sin tocar `rocas`.
- **Sí:** mantener ambos HUD (decisión del usuario): el del canvas es parte del juego y el de la plataforma se alimenta del motor.
- **Sí:** overlay "GAME OVER" del canvas y modal de plataforma conviven. El overlay es parte del juego; el modal conecta con el flujo de guardado futuro.
- **Sí:** PAUSA congela el loop y FIN fuerza game over. Sin tecla de pausa nueva para no cambiar los controles originales.
- **Sí:** pausa automática al perder visibilidad de la pestaña, para evitar saltos de `dt`.
- **Sí:** canvas escalado por CSS con resolución interna 800×600. Conserva la lógica de coordenadas y funciona en pantallas pequeñas.
- **No:** controles táctiles. Se difieren a una spec propia.
- **Sí:** guardado de puntuaciones fuera de alcance. Depende de tablas `scores`, RLS y auth (specs futuras sobre SPEC 04).
- **Sí:** `GamePlayer` conserva el mock para los demás juegos. Cada juego se integrará en su propia spec.
- **Sí:** portar la lógica sin cambiar comportamiento; mejoras de jugabilidad van aparte.

## Riesgos identificados

| Riesgo                                                  | Mitigación                                                                                               |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Doble montaje en `StrictMode` duplica listeners y loops | `destroy()` idempotente y llamado en el cleanup del `useEffect`; criterio de aceptación sobre listeners. |
| Los callbacks por frame provocan re-renders excesivos   | Se invocan solo al cambiar el valor.                                                                     |
| Flechas y Espacio hacen scroll de la página             | `preventDefault` en las teclas del juego mientras el motor está activo.                                  |
| Referencia a `document`/`window` durante SSR            | El motor solo se crea dentro de `useEffect`; el módulo no accede a globals al importarse.                |
| `cacheComponents` cambia la semántica de render         | Leer la guía antes del paso 5; la página de juego es un shell estático con un componente cliente.        |
| El HUD de React se desincroniza del motor al reiniciar  | `restart` emite los tres callbacks con los valores iniciales.                                            |
| Dibujo en canvas escalado se ve borroso                 | Resolución interna fija 800×600 y `image-rendering` revisado en el paso 7.                               |
| Colisión de clases al agregar `cover-asteroids`         | Revisar nombres existentes en `app/globals.css` antes de agregarla.                                      |

## Lo que **no** entra en esta spec

- Guardado de puntuaciones, tabla `scores`, ranking real.
- Controles táctiles o móvil.
- Sonido, nuevas mecánicas u OVNIs.
- Integración de los otros juegos del catálogo.
- Tests automatizados.

Cada uno, si se hace, va en su propia spec.
