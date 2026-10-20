# SPEC 11 — Skins del Tetris (corrige SPEC 08)

> **Estado:** Approved
> **Depende de:** SPEC 08
> **Fecha:** 2026-10-20
> **Objetivo:** Reemplazar el tema claro/oscuro y el botón TEMA del Tetris por un selector de skins Retro/Neon/Pastel/Pixel Art persistido en `localStorage`, y retirar la pieza «N» (tuerca).

## Alcance

**Dentro (modifica SPEC 08):**

- Selector de skin con 4 opciones (`retro`, `neon`, `pastel`, `pixel`; etiquetas «RETRO», «NEON», «PASTEL», «PIXEL ART») en `.player-hud` de `GamePlayer`, junto al stat NIVEL, visible solo en Tetris.
- Cada skin define paleta completa (colores de las 7 piezas, fondo, cuadrícula, etiquetas, texto, overlay) y estilo de dibujo del bloque (retro = actual con brillo superior; neon = contorno con glow; pastel = relleno suave redondeado; pixel = bloques con bordes duros de 2 niveles de tono). El ghost conserva `GHOST_ALPHA`.
- `Retro` replica el look actual oscuro y es la skin por defecto.
- Persistencia en `localStorage["tetris-skin"]` (lectura en `useEffect`, valor inicial `retro`, `try/catch`). Valor inválido o sin `localStorage` → `retro`. La clave `tetris-theme` se ignora.
- Cambiar de skin se aplica al instante, incluso en pausa, sin reiniciar la partida.
- Se elimina el botón TEMA, `hasThemeToggle`, `TetrisTheme`, `THEMES` y `setTheme`; se reemplazan por `hasSkinSelector`, `TetrisSkin`, `SKINS` y `setSkin`.
- Pieza «N» (tuerca) retirada: comentada en `PIECES` y `COLORS`, `PieceType` pasa a `1..7`, `PIECE_TYPES_COUNT = 7`, `randomPiece` elige entre 7 piezas con igual probabilidad.
- Migración que actualiza `games.long` de `tetris` quitando la frase de la tuerca.
- Enmienda de SPEC 08 (nota al inicio: «Corregida por SPEC 11» en las secciones de tema y pieza N).

**Fuera de alcance:**

- Skins que cambien la geometría, controles o reglas.
- Skins desbloqueables, por usuario en BD o sincronizadas entre dispositivos.
- Skins para otros juegos; sonido; tests automatizados.
- Cambiar el tema general de la plataforma.

## Modelo de datos

Sin tablas nuevas; una migración de datos (`<timestamp>_update_tetris_long_description.sql`):

```sql
update public.games
set long = 'Encaja las piezas que caen, completa filas para limpiarlas y sube de nivel cada 10 líneas.'
where id = 'tetris';
```

Tipos (`lib/games/tetris/types.ts`):

```ts
type TetrisSkin = "retro" | "neon" | "pastel" | "pixel";
type PieceType = 1 | 2 | 3 | 4 | 5 | 6 | 7; // I O T S Z J L

interface SkinDefinition {
  label: string;
  pieceColors: readonly string[]; // índice 0 vacío, 1..7
  canvasBackground: string;
  gridLine: string;
  labelText: string;
  text: string;
  overlayBackground: string;
  blockStyle: "bevel" | "glow" | "soft" | "pixel";
}

interface TetrisEngine {
  // ...resto igual
  setSkin: (skin: TetrisSkin) => void; // sustituye setTheme
}
```

Config en `GamePlayer`: `tetris: { hasLives: false, hasSkinSelector: true }`; el resto de juegos `hasSkinSelector: false`.

| Archivo                                                    | Cambio                                                                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `lib/games/tetris/types.ts`                                | `TetrisSkin`, `SkinDefinition`, `PieceType` 1..7; quitar `TetrisTheme`, `ThemePalette`                                 |
| `lib/games/tetris/constants.ts`                            | `SKINS`, `DEFAULT_SKIN`, `SKIN_STORAGE_KEY`; comentar N en `PIECES`/`COLORS`; `PIECE_TYPES_COUNT = 7`; quitar `THEMES` |
| `lib/games/tetris/render.ts`                               | `drawBlock` según `blockStyle`; paletas desde `SKINS[state.skin]`                                                      |
| `lib/games/tetris/engine.ts`                               | `setSkin` en lugar de `setTheme`                                                                                       |
| `components/tetris-canvas.tsx`                             | prop `skin` en lugar de `theme`                                                                                        |
| `components/game-player.tsx`                               | selector junto a NIVEL, estado `skin` + persistencia, quitar TEMA                                                      |
| `app/globals.css`                                          | estilos del selector dentro de `.player-hud`                                                                           |
| `specs/08-tetris-game.md`                                  | nota de corrección                                                                                                     |
| `supabase/migrations/*_update_tetris_long_description.sql` | migración anterior                                                                                                     |

## Plan de implementación

Usar `/frontend-design` para el selector y el estilo visual de cada skin. Cada paso deja el sistema funcional.

1. Migración de `games.long` (`apply_migration` + archivo en `supabase/migrations/`). Verificar: `select long from games where id = 'tetris'` no menciona la tuerca.
2. Retirar la pieza N: comentar en `PIECES`/`COLORS`, `PieceType` 1..7, `PIECE_TYPES_COUNT = 7`. Verificar: `npx tsc --noEmit` pasa y solo caen 7 tipos.
3. Tipos y `SKINS` en `types.ts`/`constants.ts` (4 skins; Retro = paleta oscura actual), conviviendo con `THEMES` hasta el paso 4. Verificar: `npx tsc --noEmit` pasa.
4. `render.ts` y `engine.ts`: `setSkin`, `drawBlock` por `blockStyle`, paletas por skin; eliminar `THEMES`/`setTheme`. Verificar: `npx tsc --noEmit` y `npm run lint` pasan.
5. `tetris-canvas.tsx`: prop `skin`. Verificar: `npx tsc --noEmit` pasa.
6. `GamePlayer`: quitar TEMA y `hasThemeToggle`; añadir selector junto a NIVEL con persistencia `tetris-skin`. Verificar: el selector solo aparece en Tetris y la skin cambia en vivo.
7. Estilos del selector. Verificar: sin scroll horizontal a 375px y a 1280px.
8. Nota de corrección en `specs/08-tetris-game.md`. Flujo completo con Playwright (cada skin, cambio en pausa, recarga conserva la skin, perder, guardar puntaje), consola limpia, y luego `npm run lint`, `npx tsc --noEmit` y `npm run build`.

## Criterios de aceptación

- [ ] `npm run build`, `npm run lint` y `npx tsc --noEmit` terminan sin errores.
- [ ] El botón TEMA no existe y no quedan referencias a `THEMES`, `TetrisTheme`, `setTheme`, `hasThemeToggle` ni `tetris-theme`.
- [ ] El selector muestra RETRO, NEON, PASTEL, PIXEL ART junto al stat NIVEL solo en Tetris; Asteroides, Arkanoid y Snake no lo muestran.
- [ ] Cada skin cambia colores de piezas, fondo, cuadrícula, panel y estilo del bloque, y las cuatro son visiblemente distintas.
- [ ] Cambiar de skin durante el juego o en pausa se aplica al instante sin alterar puntaje, nivel ni tablero.
- [ ] La skin elegida sobrevive a recargar la página; sin `localStorage` o con un valor inválido se usa Retro.
- [ ] En la primera visita se ve Retro, equivalente al oscuro actual.
- [ ] Solo caen 7 tipos de pieza; la tuerca no aparece y la N está comentada en `PIECES` y `COLORS`.
- [ ] `games.long` de `tetris` no menciona la tuerca y la migración existe en `supabase/migrations/`.
- [ ] Controles, puntajes, pausa, game over y guardado en `leaderboard` funcionan igual que en SPEC 08.
- [ ] Sin scroll horizontal a 375px y a 1280px; sin errores de hidratación en la consola.

## Decisiones tomadas y descartadas

- **Sí:** skin = paleta completa + estilo de bloque (decisión del usuario). Descartado: solo colores.
- **Sí:** selector en `.player-hud` junto a NIVEL (decisión del usuario). Descartado: dentro del canvas, sin UI accesible.
- **Sí:** eliminar TEMA y el claro/oscuro (decisión del usuario); Retro cubre el look actual.
- **Sí:** clave nueva `tetris-skin` con default `retro`. Descartado reutilizar `tetris-theme` para no interpretar valores viejos.
- **Sí:** retirar N con migración del texto del catálogo y `PieceType` 1..7. Descartado solo comentar: dejaría el catálogo inconsistente.
- **Sí:** esta spec corrige SPEC 08 sin reescribirla; SPEC 08 recibe una nota de enmienda.

## Riesgos identificados

| Riesgo                                                | Mitigación                                                            |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| Hidratación por leer `localStorage`                   | Valor inicial `retro`, lectura en `useEffect`, `try/catch`.           |
| Contraste ilegible del panel y overlay en Neon/Pastel | Definir `text` y `overlayBackground` por skin y revisar con capturas. |
| Costo de dibujo del glow/pixel por frame              | Evitar `shadowBlur` excesivo por celda; verificar fluidez.            |
| HUD apretado a 375px                                  | Verificar en el paso 7 y permitir wrap del selector.                  |

## Lo que **no** entra en esta spec

- Skins de otros juegos, desbloqueables o sincronizadas entre dispositivos.
- Mecánicas nuevas.
- Tests automatizados.

Cada uno, si se hace, va en su propia spec.
