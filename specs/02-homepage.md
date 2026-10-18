# SPEC 02 — Homepage (landing) de Arcade Vault

> **Estado:** Aprovado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-17
> **Objetivo:** Implementar en `/` el homepage de `references/templates/home-about/home.jsx` (solo visual, datos mock) y mover la Biblioteca a `/games`.

## Alcance

**Dentro:**

- Homepage en `/` con las secciones de la plantilla: hero con siluetas flotantes, "¿Por qué Arcade Vault?", "Juegos disponibles ahora" (6 mini-tarjetas), stats, "Actividad en vivo" (últimas puntuaciones y top jugadores), precios con FAQ y CTA final.
- Animación de aparición al hacer scroll (clase `.reveal` + `IntersectionObserver`).
- Mover la Biblioteca de `/` a `/games` y actualizar todos los enlaces que apuntaban a `/` con ese sentido.
- Navbar: nuevo link "Inicio" (`/`) antes de "Biblioteca" (`/games`), en escritorio y en el panel móvil.
- Portar a `app/globals.css` los estilos del homepage de `references/templates/home-about/styles.css` que aún no existen.
- Datos mock tipados para actividad, top jugadores y stats.
- Textos visibles en español, rutas y código en inglés.

**Fuera de alcance (para futuras specs):**

- Pantalla "Acerca de" (`about.jsx`) y su link en el navbar.
- Datos reales o en vivo: la actividad, el top y las stats son texto fijo.
- Que las promesas del copy (guardar puntuaciones, ranking global, "sin registro") sean funcionales.
- Sesión, backend, API y base de datos.
- Tests automatizados.
- Internacionalización.

## Modelo de datos

Sin estructuras nuevas respecto a la plantilla; se tipan sus arrays en `lib/home.ts`. Reutiliza `Game` y `NeonColor` de `lib/games.ts`.

```ts
// lib/home.ts
interface FeatureItem {
  icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";
  title: string;
  description: string;
  color: NeonColor;
}

interface RecentScore {
  player: string;
  gameTitle: string;   // texto fijo, no se enlaza a GAMES
  score: number;
  timeAgo: string;     // "hace 2 min"
  color: NeonColor;
}

interface TopPlayer {
  rank: number;
  player: string;
  score: number;
}

interface StatBlock {
  value: string;       // "12+", "MILES", "GLOBAL"
  unit: string;
  caption: string;
}
```

Convenciones:

- Los textos y valores son los de `home.jsx`, sin cambios.
- Números formateados con `toLocaleString("es-ES")`.
- Las mini-tarjetas usan `GAMES.slice(0, 6)`.

## Plan de implementación

Antes de escribir código Next.js, leer la guía relevante en `node_modules/next/dist/docs/`. Usar `/frontend-design` para cualquier ajuste de UI.

1. Mover la Biblioteca: crear `app/games/page.tsx` con el contenido actual de `app/page.tsx`, y actualizar enlaces a `/games` en `components/nav.tsx`, `app/games/[id]/page.tsx`, `components/hall-of-fame.tsx`, `components/game-player.tsx` y `components/auth-form.tsx` (botón de invitado y redirección tras enviar). Dejar `app/page.tsx` renderizando un placeholder mínimo. Verificar: `/games` muestra la Biblioteca y los botones "VOLVER" llevan allí.
2. Navbar: agregar "Inicio" a `/`; `isLibraryPath` pasa a `pathname.startsWith("/games")`; "Inicio" activo solo en `/`. Verificar: el link activo es correcto en `/`, `/games`, `/games/[id]` y `/hall-of-fame`.
3. Crear `lib/home.ts` con los tipos y los arrays de features, últimas puntuaciones, top jugadores y stats. Verificar: `npx tsc --noEmit` pasa.
4. Portar a `app/globals.css` los estilos del homepage (`.home-*`, `.silo`, `.feature-*`, `.mini-*`, `.stat-*`, `.activity-*`, `.tick-*`, `.top-*`, `.pricing-*`, `.price-card`, `.faq-*`, `.final-*`, `.reveal`) sin duplicar clases existentes. Verificar: `npm run build` pasa.
5. Crear `components/home/floating-silhouettes.tsx` y `components/home/feature-icon.tsx` (server, SVG), y `components/home/hero.tsx`. Montar el hero en `app/page.tsx`. Verificar: hero con título, subtítulo y CTAs; "EXPLORAR JUEGOS" va a `/games` y "CREAR CUENTA" a `/auth`.
6. Crear `components/home/reveal.tsx` (client, envuelve una sección y aplica `.reveal`/`.in` con `IntersectionObserver`), y las secciones "¿Por qué?" y "Juegos disponibles" (`components/home/features-section.tsx`, `components/home/games-preview.tsx`) reutilizando el estilo de `GameCard` solo si coincide; si no, `components/home/mini-card.tsx`. Verificar: aparecen al hacer scroll; click en una mini-tarjeta lleva a `/games/[id]`.
7. Crear `components/home/stats-section.tsx` y `components/home/activity-section.tsx`. Verificar: 3 stats, 7 filas de puntuaciones y 5 del top; "VER SALÓN →" lleva a `/hall-of-fame`.
8. Crear `components/home/pricing-section.tsx` y `components/home/final-cta.tsx`. Verificar: "EMPEZAR GRATIS →" lleva a `/auth`; "INSERTAR MONEDA →" lleva a `/games`.
9. Actualizar metadata de `/` y de `/games` (título propio) y ejecutar `npm run lint` y `npm run build`.

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `/` muestra el homepage y `/games` muestra la Biblioteca con sus 8 tarjetas, buscador y chips funcionando como en SPEC 01.
- [ ] Ningún enlace interno apunta a `/` con intención de "biblioteca": "VOLVER AL VAULT" (detalle y reproductor), "VOLVER A LA BIBLIOTECA" (salón) y los botones de invitado/envío de `/auth` navegan a `/games`.
- [ ] El navbar muestra "Inicio", "Biblioteca" y "Salón de la Fama", en ese orden, y no muestra "Acerca de".
- [ ] "Inicio" está activo solo en `/`; "Biblioteca" en `/games`, `/games/*` y `/games/*/play`.
- [ ] El logo del navbar lleva a `/`.
- [ ] El hero muestra las 3 líneas del título, el subtítulo y dos CTAs; "EXPLORAR JUEGOS" lleva a `/games` y "CREAR CUENTA" a `/auth`.
- [ ] Hay 8 siluetas decorativas con `aria-hidden="true"`.
- [ ] La sección "¿Por qué?" muestra 4 tarjetas con ícono, título y descripción.
- [ ] "Juegos disponibles ahora" muestra exactamente 6 mini-tarjetas; click en una lleva a `/games/[id]`; "VER TODOS LOS JUEGOS →" lleva a `/games`.
- [ ] Hay 3 stats, 7 filas de "Últimas puntuaciones" y 5 en "Top jugadores · hoy"; las 3 primeras del top tienen estilo dorado, plata y bronce.
- [ ] Los puntajes se muestran con separador de miles en formato `es-ES`.
- [ ] "VER SALÓN →" lleva a `/hall-of-fame`; "EMPEZAR GRATIS →" a `/auth`; "INSERTAR MONEDA →" a `/games`.
- [ ] Las secciones con `.reveal` aparecen al entrar en el viewport y no hay contenido invisible con JavaScript deshabilitado en el hero.
- [ ] Con ancho ≤ 840px el homepage no produce scroll horizontal y el navbar mantiene el menú hamburguesa con "Inicio" incluido.
- [ ] Ninguna pantalla produce errores ni warnings de hidratación en la consola.
- [ ] Visualmente el homepage coincide con el de `references/templates/home-about/arcade-vault-standalone.html` abierto en el navegador.

## Decisiones tomadas y descartadas

- **Sí:** Biblioteca en `/games` y homepage en `/`. Decisión del usuario; sigue la estructura Inicio + Biblioteca de la plantilla.
- **No:** `/library`. Descartada por el usuario a favor de `/games`, que queda junto a `/games/[id]`.
- **Sí:** "Acerca de" fuera de esta spec. Mantiene la spec en una sola pantalla; el link se agrega cuando exista su ruta.
- **Sí:** datos mock estáticos tipados en `lib/home.ts`, como en SPEC 01. Los tipos sirven de contrato para una API futura.
- **No:** derivar actividad y top desde `GAMES`/`seededScores`. Se pierde fidelidad con la plantilla y no aporta mientras sea decorativo.
- **Sí:** portar "Precios" y el copy tal cual. Es marketing de la plantilla; las funciones prometidas llegan en specs futuras.
- **Sí:** componentes server por defecto; `"use client"` solo en `Reveal` (usa `IntersectionObserver`) y en lo que ya lo requiera.
- **Sí:** `next/link` para CTAs y `<button>` solo para acciones. Los `onClick` de la plantilla no son accesibles.
- **No:** el hook global `useReveal` de la plantilla (consulta el DOM entero). Se encapsula en un componente `Reveal` para no depender de selectores globales.
- **Sí:** estilos portados a `app/globals.css`, sin reescribirlos, igual que en SPEC 01.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Mover `/` a `/games` rompe enlaces y redirecciones existentes | El paso 1 lista cada archivo afectado y un criterio de aceptación verifica que ningún enlace "biblioteca" quede en `/`. |
| `.reveal` deja secciones invisibles si el observer no se dispara | Solo las secciones bajo el hero usan `.reveal`; el hero es visible siempre. |
| `cacheComponents` cambia la semántica de render | Leer la guía en `node_modules/next/dist/docs/` antes del paso 1; el homepage no usa datos dinámicos. |
| Colisión de clases al portar `styles.css` | Portar solo las que no existen en `globals.css` y revisar el build. |
| El copy promete funciones inexistentes (guardar puntuaciones, ranking global) | Decisión consciente registrada arriba; se resuelve en las specs de auth y backend. |

## Lo que **no** entra en esta spec

- Pantalla "Acerca de".
- Datos reales o en vivo en actividad, top y stats.
- Sesión, registro o login funcional.
- Persistencia de usuarios o puntuaciones.
- Backend, API o base de datos.
- Tests automatizados.

Cada uno, si se hace, va en su propia spec.
