# SPEC 13 — Rendimiento de la skin Neon de Frogger

> **Estado:** Borrador
> **Depende de:** SPEC 11
> **Fecha:** 2026-10-23
> **Objetivo:** Documentar y dejar corregido el lag de la skin Neon de Frogger para que corra a la par de las demás skins.

## Por qué existe esta spec

En Frogger, todas las skins corrían fluidas excepto Neon, que se trababa a simple vista.

Esta spec registra:

- Cada problema que apareció, tanto en el juego como al medirlo, y cómo se resolvió.
- Los problemas de rendimiento que podrían haberse presentado y cómo se abordarían.

Sirve de referencia para futuros juegos, pero su alcance es solo Frogger.

## Alcance

**Dentro:**

- Diagnóstico y corrección del lag de la skin Neon en `lib/games/frogger/render.ts`.
- Snippet de medición de fps por skin en `scripts/measure-fps.js`.
- Ajustes de herramientas para el snippet: `eslint.config.mjs` y `.prettierignore`.
- Registro de los problemas encontrados, los intentos descartados y la solución final.
- Catálogo de problemas que podrían haberse presentado en Frogger y cómo abordarlos.

**Fuera de alcance (para futuras specs):**

- Asteroides, Tetris, Arkanoid y Snake: también usan `shadowBlur` en su skin Neon y cada uno se revisa en su propia spec.
- Rendimiento de las páginas React, de la carga inicial o de Supabase.
- Tests de rendimiento automáticos en CI.
- Medir en Safari o Firefox.
- Cambios de gameplay o del look de las skins.

## Modelo de datos

Esta spec no introduce estructuras de datos nuevas.

| Archivo                       | Cambio                                                                                                            |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `lib/games/frogger/render.ts` | Se elimina `applyGlow` (`shadowBlur`); Neon usa bloom por downscale (`GLOW_SCALE`, `drawActors`, `drawGlowWorld`) |
| `scripts/measure-fps.js`      | Snippet de Playwright: fps, p95 y % de frames lentos por skin, con veredicto OK/FALLA                             |
| `eslint.config.mjs`           | Ignora `scripts/**`                                                                                               |
| `.prettierignore`             | Ignora `scripts`                                                                                                  |

Constantes nuevas en `render.ts`: `GLOW_SCALE = 8`. Se eliminan `GLOW_BLUR`, `applyGlow` y `entityColor`. `createPixelBuffer` pasa a ser `createScaledBuffer(scale)`, compartido por pixel y neon.

## Problemas encontrados y cómo se solucionaron

### P1 — Neon a la mitad de fps (causa raíz)

- **Síntoma:** Neon corría a 24–28 fps (p95 de 50–67 ms, 119–133 frames de más de 20 ms en 5 s). Retro, Pastel y Pixel iban a ~60 fps.
- **Efecto extra:** el loop limita cada paso a `MAX_DT_MS = 50`. Con frames de más de 50 ms, el juego no solo se trababa: también avanzaba más lento.
- **Causa:** `applyGlow` activaba `shadowBlur = 12` antes de dibujar cada entidad, y el blur se aplicaba a cada `fill`/`stroke` de la figura:
  - Auto: 4 ruedas + carrocería = 5 desenfoques.
  - Tronco: cuerpo + un `stroke()` por veta, de 5 a 12.
  - Tortuga: relleno + escamas.
  - Rana: patas, cuerpo y 4 ojos.
  - Las 5 metas.

  En total eran cientos de desenfoques gaussianos por frame.

### P2 — Intento 1: caché de sprites con glow en `HTMLCanvasElement` (descartado)

- **Qué se hizo:** cada entidad se pintaba una vez con glow en un canvas aparte, y en cada frame se copiaba con `drawImage`.
- **Resultado:** el usuario siguió notando lag. La rana y las metas seguían con `shadowBlur` por frame.
- **Por qué no bastó:** son ~35 canvas pequeños, y Chrome no acelera los menores de 256×256, así que cada `drawImage` sube una textura a la GPU.

### P3 — Intento 2: caché en `ImageBitmap`, con rana y metas incluidas (descartado)

- **Qué se hizo:** los sprites pasaron a `OffscreenCanvas` → `transferToImageBitmap` (texturas en GPU). También se cachearon la rana y las metas, dejando Neon sin ningún `shadowBlur` por frame.
- **Resultado:** no se pudo demostrar que mejorara (ver P5). Además añadía complejidad: claves de caché, liberar los bitmaps al cambiar de skin y painters en coordenadas locales.

### P4 — Solución final: bloom por downscale

En cada frame, `drawGlowWorld`:

1. Dibuja los actores (metas, entidades y rana) en un buffer a 1/8 de resolución (80×70).
2. Dibuja el fondo en el canvas principal.
3. Escala el buffer a 640×560 con `imageSmoothingQuality = "high"`. El suavizado lo vuelve difuso: ese es el halo.
4. Dibuja encima los actores nítidos.

- **Costo:** un buffer pequeño y un `drawImage`, igual que la skin pixel. Cero `shadowBlur` en el mundo.
- **Resultado:** Neon a 58–60 fps con 0–8 frames lentos, a la par de Retro, tanto a 1200×783 con DPR 1 como a 1440×900 con DPR 2.
- **Look:** el halo se conserva. Es levemente más suave que con `shadowBlur`.

### P5 — Mediciones engañosas

| Problema de medición                                                     | Qué pasaba                                                                                                                                                | Solución                                                              |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Medir solo el tiempo de JS del callback de `requestAnimationFrame`       | Todas las skins daban ~0,4 ms: el costo del blur está en el rasterizado (GPU), no en JS                                                                   | Medir el intervalo real entre frames                                  |
| Forzar el dibujo con `getImageData` tras cada frame                      | Pasaba el canvas a CPU y obligaba a leer cada bitmap de la GPU. Neon daba ~20–25 ms incluso sin blur.                                                     | Descartado: no usar readback para medir                               |
| Suponer que el navegador de Playwright era headless con GPU por software | En realidad usa la GPU real del Mac (Intel Iris Plus 650, Chrome). Se comprobó con `WEBGL_debug_renderer_info`.                                           | Verificar la GPU antes de sacar conclusiones                          |
| Cambiar de skin con el `<select>` sin recargar                           | Daba fps poco fiables, con mucha varianza entre skins                                                                                                     | Guardar la skin en `localStorage["frogger-skin"]` y recargar por skin |
| Medir en un contexto nuevo (`browser.newContext`)                        | Si quedaba en segundo plano, el navegador lo limitaba a ~1 fps. Si quedaba al frente, competía por la GPU con la pestaña original: todas las skins caían. | Medir en la misma pestaña                                             |
| Máquina cargada (load average de 102)                                    | Todas las skins caían, incluida Retro, y la comparación no servía                                                                                         | El snippet devuelve «Medición inválida» si Retro < 55 fps             |

### P6 — Herramientas para conservar el snippet

- **ESLint:** marcaba `scripts/measure-fps.js` con `no-unused-expressions`, porque el archivo es una función flecha suelta y no un módulo. Se añadió `scripts/**` a `globalIgnores`.
- **Prettier:** el hook le añadía un `;` final y Playwright fallaba con `SyntaxError: Unexpected token ';'`. Se añadió `scripts` a `.prettierignore`.

## Problemas que podrían haberse presentado y cómo se abordarían

| #   | Posible problema                                                                | Cómo detectarlo                                                | Cómo se abordaría                                                                                       |
| --- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | El halo del bloom se ve pixelado (rombos) al escalar 8×                         | Captura de Neon con zoom                                       | Bajar `GLOW_SCALE` a 4–6, o escalar en dos pasos (1/8 → 1/4 → completo)                                 |
| 2   | `imageSmoothingQuality = "high"` costoso en algún navegador                     | El fps de Neon cae frente a Pixel                              | Usar `"low"` (bilineal); el halo apenas cambia                                                          |
| 3   | Safari ejecuta `shadowBlur` y `ctx.filter` mucho más lento que Chrome           | Medir en Safari con el mismo snippet (adaptado)                | Ya mitigado: el mundo no usa blur. Queda el `shadowBlur = 4` del texto del HUD; cachearlo si molestara. |
| 4   | Un `stroke()` por veta de tronco                                                | Leer `drawLog`                                                 | Un solo `beginPath()` con todas las vetas y un único `stroke()`                                         |
| 5   | Fondo (carriles y marcas discontinuas) redibujado en cada frame                 | Leer `drawBackground`                                          | Pre-renderizar el fondo en un canvas por skin y copiarlo con un `drawImage`                             |
| 6   | `setLineDash([16, 12])` crea un array nuevo en cada frame                       | Leer `drawBackground`; GC frecuente en Performance de DevTools | Constante de módulo con el patrón                                                                       |
| 7   | Callbacks a React en cada frame (puntaje, vidas, nivel)                         | Leer `syncCallbacks` del engine                                | Emitir solo cuando el valor cambia (el engine ya lo hace)                                               |
| 8   | Canvas a resolución `devicePixelRatio` en pantallas Retina (4× píxeles)         | Revisar `width`/`height` en `components/frogger-canvas.tsx`    | Mantener 640×560 lógicos y escalar con CSS (así está hoy)                                               |
| 9   | Lectura del canvas (`getImageData`) dentro del loop                             | `grep -n getImageData lib/games/frogger`                       | Eliminarla; si fuera imprescindible, `getContext("2d", { willReadFrequently: true })`                   |
| 10  | Pestaña en segundo plano consume CPU y GPU                                      | `visibilitychange` en el engine                                | Pausar al ocultarse (el engine ya lo hace con `hiddenPaused`)                                           |
| 11  | El juego se ralentiza en lugar de saltar cuando bajan los fps (por `MAX_DT_MS`) | Comparar el tiempo de ronda real con el reloj                  | Mantener el tope, que evita atravesar colisiones, y corregir la causa de los fps bajos                  |
| 12  | Fuga de memoria al cambiar de skin si hubiera cachés (bitmaps sin `close()`)    | Memoria en DevTools tras varios cambios de skin                | Liberar la caché al cambiar de skin. La solución final no usa caché.                                    |

## Plan de implementación

Cada paso deja el sistema funcional y commiteable.

1. Reemplazar `applyGlow` por el bloom por downscale en `lib/games/frogger/render.ts` (`GLOW_SCALE`, `drawActors`, `drawGlowWorld`, `createScaledBuffer`). Verificar con `npx tsc --noEmit` y `npm run lint`. Las demás skins se dibujan igual que antes.
2. Crear `scripts/measure-fps.js` y excluir `scripts` en `eslint.config.mjs` y `.prettierignore`. Verificar que `npm run lint` pasa y que el snippet corre con `browser_run_code_unsafe` sobre `/games/frogger/play`.
3. Medir las 4 skins con el snippet, con la máquina libre, y capturar cada skin en `.playwright-screenshots/frogger-<skin>.png`.

## Criterios de aceptación

- [ ] `scripts/measure-fps.js` sobre `/games/frogger/play` devuelve `OK` en las 4 skins: cada una ≥ 55 fps, a no más de 5 fps de Retro y con ≤ 2 % de frames de más de 20 ms.
- [ ] `grep -n shadowBlur lib/games/frogger` solo devuelve el HUD de texto.
- [ ] Neon conserva el halo alrededor de autos, troncos, tortugas, rana y metas (captura).
- [ ] Retro, Pastel y Pixel se ven igual que antes del cambio (capturas).
- [ ] `npx tsc --noEmit`, `npm run lint` y `npm run build` terminan sin errores.
- [ ] La consola del navegador no muestra errores al jugar ni al cambiar de skin.

## Decisiones tomadas y descartadas

- **Sí:** bloom por downscale. Su costo es predecible, igual al de la skin pixel, y no necesita caché.
- **No:** caché de sprites en `HTMLCanvasElement`. Son demasiados canvas pequeños no acelerados, y la rana y las metas seguían con blur.
- **No:** caché en `ImageBitmap`. No hubo una mejora comprobable y requería claves de caché y liberar los bitmaps.
- **No:** limitar el glow a la silueta de cada figura. Reduce los desenfoques, pero no los elimina.
- **Sí:** umbral de paridad con Retro (decisión del usuario).
- **Sí:** medir en la misma pestaña, recargando por skin.
- **No:** medir con `getImageData` o en un contexto nuevo (ver P5).
- **Sí:** conservar el snippet en `scripts/measure-fps.js` y no en un `.md` (decisión del usuario).
- **No:** corregir los otros juegos en esta spec (decisión del usuario).

## Riesgos

| Riesgo                                                       | Mitigación                                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Máquina cargada: todas las skins caen y la medición no sirve | El snippet devuelve «Medición inválida» si Retro < 55 fps; revisar `uptime` y repetir |
| Varianza entre corridas                                      | 2 rondas por skin; se toma la mejor                                                   |
| El halo del bloom difiere levemente del de `shadowBlur`      | Comparación por capturas; ajustar `GLOW_SCALE` si hiciera falta                       |
| Safari más lento con efectos de canvas                       | El mundo ya no usa blur; medir en Safari queda para otra spec                         |

## Lo que **no** entra en esta spec

- Revisar Asteroides, Tetris, Arkanoid o Snake.
- Optimizar React, la carga de páginas o Supabase.
- Tests de rendimiento en CI.
- Medir en Safari o Firefox.

Cada uno, si llega, va en su propia spec.
