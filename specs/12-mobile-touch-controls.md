# SPEC 12 — Controles táctiles para jugar en móvil

> **Estado:** Approved
> **Depende de:** SPEC 05, SPEC 08, SPEC 09, SPEC 10, SPEC 11
> **Fecha:** 2026-10-21
> **Objetivo:** Permitir jugar los 4 juegos en pantallas táctiles con un gamepad virtual bajo el CRT, mostrado solo con puntero `coarse`, ocultando el HUD de React y moviendo PAUSA/FIN/SALIR y el selector de skin al pie del reproductor.

## Alcance

**Dentro:**

- Gamepad virtual en `components/touch-gamepad.tsx` (`"use client"`): D-pad de 4 direcciones a la izquierda y botones de acción A/B a la derecha, debajo del CRT.
- El gamepad despacha `KeyboardEvent` sintéticos (`keydown`/`keyup`) en `window` con el mismo `code` que el teclado. Los motores no cambian su input.
- Asignación por juego (config en `lib/games/touch-controls.ts`):

  | Juego      | D-pad activo                                  | A                 | B               |
  | ---------- | --------------------------------------------- | ----------------- | --------------- |
  | Asteroides | ← → girar, ↑ propulsión                       | DISPARO (`Space`) | —               |
  | Tetris     | ← → mover, ↓ caída suave, ↑ rotar (`ArrowUp`) | ROTAR (`KeyX`)    | CAÍDA (`Space`) |
  | Arkanoid   | ← → mover paleta                              | —                 | —               |
  | Snake      | ← ↑ → ↓ girar                                 | —                 | —               |

- El D-pad siempre muestra las 4 direcciones; las que el juego no usa se ven deshabilitadas y no emiten eventos. Los botones A/B que el juego no usa no se renderizan.
- Auto-repetición solo en el D-pad: al mantener pulsado se emite `keydown` con `repeat: true` tras 250 ms y luego cada 60 ms (mueve la pieza en Tetris como el teclado). A y B emiten un solo `keydown` por toque y `keyup` al soltar.
- Multitáctil: cada botón sigue su propio `pointerId` (Pointer Events), así en Asteroides se puede girar y disparar a la vez.
- Al soltar (`pointerup`, `pointercancel`, `lostpointercapture`), al pausar, al ocultarse la pestaña y al desmontar se emite `keyup` de todas las teclas pulsadas (sin teclas atascadas).
- Detección solo por CSS con `@media (pointer: coarse)`: el gamepad y el pie móvil siempre están en el DOM y se ocultan con `display: none` en puntero `fine`. Sin `matchMedia` en JS ni toggle manual.
- Con puntero `coarse`:
  - Se oculta `.player-hud` (stats y botones) y la barra `.crt-bottom`.
  - El CRT queda arriba, a todo el ancho disponible, y el gamepad debajo.
  - Pie `.player-footer` con PAUSA/REANUDAR, FIN, SALIR y el selector de skin (mismo `<select>`, misma persistencia `localStorage["<id>-skin"]`).
- Orientación (sin bloquear la rotación):
  - Vertical: CRT arriba, gamepad debajo, pie al final.
  - Horizontal (`orientation: landscape`): D-pad a la izquierda del CRT, A/B a la derecha, CRT limitado al alto visible (`100dvh`), pie debajo.
- Sin scroll ni zoom accidental: `touch-action: none`, `user-select: none`, `-webkit-touch-callout: none` y `contextmenu` cancelado en el gamepad y el canvas.
- Snake dibuja «SCORE» y «NIVEL» en el canvas (como Asteroides y Arkanoid), también en escritorio, con colores de la skin activa.
- PAUSA/FIN/SALIR del pie y del HUD comparten estado: `P`/`Esc`, el botón del HUD y el del pie quedan sincronizados.
- Diseño del gamepad y del pie con `/frontend-design`, en la estética del sitio. Etiquetas en español.

**Fuera de alcance (para futuras specs):**

- Gestos sobre el canvas (swipe, tap, arrastrar la paleta).
- Vibración (`navigator.vibrate`) y Fullscreen API.
- Diagonales en el D-pad o deslizar el dedo entre direcciones.
- Toggle manual para mostrar/ocultar el gamepad.
- Cambios en el header global, en otras pantallas o en el modal de fin de juego.
- Cambios en los motores fuera del HUD de Snake.
- Tests automatizados.

## Modelo de datos

Sin cambios en Supabase. Config estática en `lib/games/touch-controls.ts`:

```ts
type DpadDirection = "up" | "down" | "left" | "right";

interface TouchButton {
  label: string; // «DISPARO», «ROTAR», «CAÍDA»
  code: string; // KeyboardEvent.code, p. ej. "Space"
}

interface TouchLayout {
  dpad: Partial<Record<DpadDirection, string>>; // dirección → code; ausente = deshabilitada
  a?: TouchButton;
  b?: TouchButton;
}

const TOUCH_LAYOUTS: Record<RealGameId, TouchLayout>;
```

Constantes: `KEY_REPEAT_DELAY_MS = 250`, `KEY_REPEAT_INTERVAL_MS = 60`.

Snake: `RenderState` de `lib/games/snake/types.ts` incluye `score` y `level` si aún no los tiene; `SkinDefinition` de Snake añade `hudText` si ningún color existente sirve.

| Archivo                        | Cambio                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `lib/games/touch-controls.ts`  | tipos, `TOUCH_LAYOUTS` y constantes de repetición                             |
| `components/touch-gamepad.tsx` | D-pad + A/B, Pointer Events, despacho de eventos y auto-repetición            |
| `components/game-player.tsx`   | renderiza el gamepad y `.player-footer`; pasa `isPaused` para liberar teclas  |
| `app/globals.css`              | estilos del gamepad, pie, `@media (pointer: coarse)` y orientación horizontal |
| `lib/games/snake/render.ts`    | HUD «SCORE» y «NIVEL» en el canvas                                            |
| `lib/games/snake/constants.ts` | fuente/posición del HUD y color por skin si hace falta                        |
| `lib/games/snake/types.ts`     | `score`/`level` en `RenderState` si faltan                                    |

`RealGameId` se exporta desde `game-player.tsx` o se mueve a `lib/games/touch-controls.ts` para evitar dependencias circulares.

## Plan de implementación

Cada paso deja el sistema funcional.

1. HUD de Snake en el canvas (`render.ts`, `constants.ts`, `types.ts`). Verificar: en escritorio se ven SCORE y NIVEL en las 4 skins y se actualizan al comer.
2. `lib/games/touch-controls.ts` con tipos, `TOUCH_LAYOUTS` y constantes. Verificar: `npx tsc --noEmit` pasa.
3. `components/touch-gamepad.tsx` con Pointer Events, despacho de `KeyboardEvent`, auto-repetición del D-pad y liberación de teclas (soltar, pausa, `visibilitychange`, desmontaje). Sin integrar. Verificar: `npx tsc --noEmit` y `npm run lint` pasan.
4. Integrar el gamepad y `.player-footer` en `GamePlayer` (sin estilos móviles aún, visibles en todos los punteros). Verificar: en escritorio, tocar/clicar el D-pad mueve cada juego y PAUSA del pie sincroniza con el HUD.
5. CSS con `/frontend-design`: ocultar gamepad y pie con puntero `fine`; con `coarse`, ocultar `.player-hud` y `.crt-bottom`, layout vertical. Verificar con Playwright emulando móvil táctil a 390×844: CRT arriba, gamepad debajo, pie con PAUSA/FIN/SALIR/SKIN, sin scroll horizontal.
6. Layout horizontal y `touch-action`/`user-select`/`contextmenu`. Verificar con Playwright a 844×390: D-pad a la izquierda, A/B a la derecha, CRT visible entero sin scroll vertical para verlo.
7. Flujo completo con Playwright en contexto táctil (`hasTouch`, `isMobile`) jugando los 4 juegos con `tap`/pointer, pausa, fin, guardar puntaje y cambio de skin desde el pie; luego a 1280px sin táctil. Después `npm run lint`, `npx tsc --noEmit` y `npm run build`.

## Criterios de aceptación

- [ ] `npm run build`, `npm run lint` y `npx tsc --noEmit` terminan sin errores.
- [ ] Con puntero `fine` (escritorio 1280px) el gamepad y el pie no se ven, y el HUD y el reproductor se ven igual que antes de esta spec.
- [ ] Con puntero `coarse` no se ve `.player-hud` ni `.crt-bottom`; se ven el gamepad bajo el CRT y el pie con PAUSA/REANUDAR, FIN, SALIR y SKIN.
- [ ] Asteroides: ← → giran, ↑ propulsa, A dispara; ↓ se ve deshabilitado; se puede girar y disparar a la vez con dos dedos.
- [ ] Tetris: ← → mueven (mantener repite), ↓ caída suave, ↑ y A rotan, B hace caída dura.
- [ ] Arkanoid: ← → mueven la paleta; ↑ ↓ deshabilitados; no hay botones A/B.
- [ ] Snake: las 4 direcciones giran la serpiente; no hay botones A/B; SCORE y NIVEL se dibujan en el canvas también en escritorio.
- [ ] Al levantar el dedo, pausar o cambiar de pestaña no queda ninguna tecla pulsada (la nave deja de girar, la paleta se detiene).
- [ ] PAUSA del pie, `P`/`Esc` y PAUSA del HUD muestran el mismo estado.
- [ ] La skin elegida en el pie se aplica al instante y sobrevive a recargar.
- [ ] Tocar el gamepad o el canvas no hace scroll, zoom, selección de texto ni menú contextual.
- [ ] A 390×844 y 844×390 táctil no hay scroll horizontal; en horizontal el D-pad queda a la izquierda y A/B a la derecha del CRT.
- [ ] El modal de fin permite escribir el nombre y guardar el puntaje en `leaderboard` desde móvil.
- [ ] Consola sin errores ni avisos de hidratación.

## Decisiones tomadas y descartadas

- **Sí:** gamepad virtual con D-pad + A/B bajo el CRT (decisión del usuario, con boceto). Descartado: gestos por juego, 4 esquemas distintos y mal encaje en Asteroides.
- **Sí:** mostrar solo con `pointer: coarse`, resuelto en CSS (decisión del usuario). Descartado: toggle manual y `matchMedia` en JS, que añade riesgo de hidratación.
- **Sí:** ocultar el HUD de React en móvil y usar el HUD del canvas (decisión del usuario). Snake gana su HUD en canvas para que los 4 juegos sean consistentes. Descartado: mini barra React solo para Snake.
- **Sí:** PAUSA/FIN/SALIR y skin en el pie (decisión del usuario). Descartado: ocultar el selector de skin en móvil.
- **Sí:** 2 botones A/B asignados por juego, ocultos si no se usan. Descartado: rombo de 4 botones con huecos deshabilitados.
- **Sí:** `KeyboardEvent` sintéticos en `window`. Cero cambios en los motores. Descartado: API `press`/`release` en cada motor.
- **Sí:** auto-repetición solo en el D-pad. A/B emiten una vez por toque, como mantener la tecla en el teclado.
- **Sí:** ambas orientaciones con layout adaptado, sin bloquear la rotación (decisión del usuario).
- **Sí:** ocultar `.crt-bottom` en móvil para ganar alto. Es decorativa.
- **Sí:** el header global no cambia.
- **No:** bloquear el zoom en el `viewport` global. Perjudica la accesibilidad; basta `touch-action` en la zona de juego.
- **No:** diagonales en el D-pad. En Asteroides se usan dos dedos (D-pad + A).

## Riesgos identificados

| Riesgo                                                         | Mitigación                                                                                |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Teclas atascadas si se pierde el `pointerup`                   | Liberar en `pointercancel`, `lostpointercapture`, pausa, `visibilitychange` y desmontaje. |
| Girar y propulsar a la vez en Asteroides con un solo pulgar    | Se documenta como limitación; diagonales en otra spec si hace falta.                      |
| Un motor ignora eventos sintéticos (`isTrusted`)               | Ningún motor revisa `isTrusted`; se verifica con Playwright en el paso 4.                 |
| CRT demasiado pequeño en horizontal con el gamepad a los lados | Limitar el CRT a `100dvh` y botones compactos; revisar con capturas.                      |
| Tablets o portátiles táctiles con puntero `coarse` sin teclado | Es el comportamiento deseado: ven el gamepad.                                             |

## Lo que **no** entra en esta spec

- Gestos, vibración, pantalla completa, diagonales o toggle manual del gamepad.
- Cambios en otras pantallas, el header o el modal de fin.
- Tests automatizados.

Cada uno, si se hace, va en su propia spec.
