# SPEC 01 — MVP visual de todas las pantallas de Arcade Vault

> **Estado:** Implementado
> **Depende de:** Ninguna (usa el tema global ya aplicado en `app/globals.css` y `app/layout.tsx`)
> **Fecha:** 2026-10-17
> **Objetivo:** Implementar en Next.js las 5 pantallas de `references/templates/` (biblioteca, detalle, reproductor, auth, salón de la fama) como rutas reales, solo en su parte visual y con datos mock.

## Alcance

**Dentro:**

- Navbar sticky con menú móvil (panel lateral), contador de créditos decorativo y footer, compartidos por todas las pantallas.
- Pantalla **Biblioteca** (`/`): hero, buscador por nombre, chips de categoría, grilla de tarjetas con efecto tilt, estado vacío "NO HAY RESULTADOS".
- Pantalla **Detalle** (`/games/[id]`): portada, tags, descripción, strip de estadísticas, botones de acción y tabla de mejores puntuaciones.
- Pantalla **Reproductor** (`/games/[id]/play`): HUD, marco CRT con arena decorativa, pausa, fin de juego y modal de puntuación final. Se porta tal cual como placeholder donde después irán los juegos reales.
- Pantalla **Auth** (`/auth`): tabs iniciar sesión / crear cuenta, campos, botón de invitado y botones sociales.
- Pantalla **Salón de la Fama** (`/hall-of-fame`): tabs por juego, podio top 3 y tabla de ranking.
- Datos mock tipados en TypeScript (juegos, categorías, generador de puntuaciones con semilla).
- Todas las rutas en inglés. Los textos visibles de la UI se mantienen en español, como en la plantilla.

**Fuera de alcance (para futuras specs):**

- Implementación de cualquier juego real.
- Sesión de usuario: no hay estado de login, ni `localStorage`, ni cuenta persistente. El formulario de auth solo navega.
- Persistencia de puntuaciones (el botón "GUARDAR PUNTUACIÓN" solo muestra el mensaje de confirmado).
- Backend, API, base de datos, OAuth real (Google/GitHub).
- Tests automatizados (el repo no tiene runner configurado).
- Internacionalización.

## Modelo de datos

Portado de `references/templates/data.jsx` a TypeScript. Sin datos nuevos respecto a la plantilla.

```ts
// lib/games.ts
type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
type NeonColor = "cyan" | "magenta" | "yellow" | "green";

interface Game {
  id: string;            // slug usado en la URL, ej. "bloque-buster"
  title: string;
  short: string;
  long: string;
  category: GameCategory;
  cover: string;         // clase CSS de portada, ej. "cover-bricks"
  color: NeonColor;
  best: number;
  plays: string;
}

const CATEGORIES = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"] as const;

// lib/scores.ts
interface ScoreEntry {
  rank: number;
  name: string;
  score: number;
  date: string;          // "dd/mm/2026"
}
function seededScores(seed: number, count?: number): ScoreEntry[];
```

Convenciones:

- Los 8 juegos y sus textos son los de `data.jsx`, sin cambios.
- Números formateados con `toLocaleString("es-ES")`.
- La semilla de puntuaciones se deriva del `id` del juego igual que en la plantilla, para resultados deterministas.

## Plan de implementación

Antes de escribir código Next.js, leer la guía relevante en `node_modules/next/dist/docs/` (`cacheComponents` cambia la semántica de params y render dinámico). Usar `/frontend-design` para cualquier ajuste de UI.

1. Crear `lib/games.ts` y `lib/scores.ts` con los tipos, los 8 juegos, `CATEGORIES` y `seededScores`. Verificar: `npx tsc --noEmit` pasa.
2. Crear `components/nav.tsx` (client, `usePathname` para el link activo, estado del panel móvil) y `components/footer.tsx`. Integrarlos en `app/layout.tsx` dentro de `#root` con `<main className="av-main">`. Verificar: navbar y footer visibles en `/`.
3. Crear `components/game-card.tsx` (client, efecto tilt) y `components/library.tsx` (client, buscador y chips). Reemplazar `app/page.tsx` por la Biblioteca. Verificar: filtrar por texto y categoría, y ver el estado vacío.
4. Crear `app/games/[id]/page.tsx` (Detalle) con `generateStaticParams` y `notFound()` si el id no existe. Verificar: click en una tarjeta navega y muestra el detalle.
5. Crear `components/game-player.tsx` (client) y `app/games/[id]/play/page.tsx`. Verificar: el puntaje sube, pausa, FIN abre el modal, "JUGAR DE NUEVO" reinicia, "SALIR" vuelve al detalle.
6. Crear `components/auth-form.tsx` (client) y `app/auth/page.tsx`. Verificar: cambio de tab muestra/oculta el correo y cualquier envío navega a `/`.
7. Crear `components/hall-of-fame.tsx` (client) y `app/hall-of-fame/page.tsx`. Verificar: cambiar de juego cambia podio y tabla.
8. Actualizar metadata (título por pantalla) y ejecutar `npm run lint` y `npm run build`.

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] Existen exactamente las rutas `/`, `/games/[id]`, `/games/[id]/play`, `/auth` y `/hall-of-fame`; ninguna ruta usa palabras en español.
- [ ] `/games/inexistente` devuelve 404.
- [ ] La Biblioteca muestra 8 tarjetas; buscar "caí" deja solo CAÍDA; elegir "SHOOTER" deja 2; una búsqueda sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] Click en una tarjeta o en su botón JUGAR navega a `/games/[id]`.
- [ ] El detalle muestra tags, descripción, stats y 10 filas de puntuaciones, con las 3 primeras en dorado, plata y bronce.
- [ ] "JUGAR AHORA" lleva a `/games/[id]/play`; "VOLVER AL VAULT" lleva a `/`.
- [ ] En el reproductor el puntaje aumenta solo; PAUSA lo detiene y muestra "EN PAUSA"; REANUDAR lo retoma.
- [ ] FIN abre el modal con la puntuación final; "GUARDAR PUNTUACIÓN" muestra "PUNTUACIÓN GUARDADA" sin escribir en `localStorage`.
- [ ] "JUGAR DE NUEVO" reinicia puntaje, vidas y nivel; "SALIR" lleva al detalle.
- [ ] En `/auth` el tab "CREAR CUENTA" muestra el campo de correo; "ENTRAR AL VAULT", "CREAR Y JUGAR" y "JUGAR COMO INVITADO" navegan a `/`.
- [ ] El navbar siempre muestra "Iniciar Sesión" y lleva a `/auth`.
- [ ] En `/hall-of-fame` hay un tab por juego; cada cambio de tab actualiza podio y tabla; no aparece la fila "TU MEJOR MARCA".
- [ ] El link activo del navbar es "Biblioteca" en `/`, `/games/*` y `/games/*/play`, y "Salón de la Fama" en `/hall-of-fame`.
- [ ] Con ancho ≤ 840px se oculta el menú de links, aparece el botón hamburguesa y abre/cierra el panel lateral.
- [ ] Ninguna pantalla produce errores ni warnings de hidratación en la consola del navegador.
- [ ] Visualmente cada pantalla coincide con `references/templates/Arcade Vault.html` abierto en el navegador.

## Decisiones tomadas y descartadas

- **Sí:** rutas reales del App Router. Son compartibles y es lo idiomático en Next; la plantilla usa hash solo por ser un prototipo.
- **Sí:** rutas en inglés (`games`, `play`, `hall-of-fame`, `auth`). Decisión del usuario, aplica a todas las specs futuras.
- **No:** copiar el router por hash con `useState`. Rompe SSR y deep links.
- **Sí:** textos de UI en español, igual que la plantilla. Solo las rutas y el código van en inglés.
- **Sí:** auth solo visual, sin sesión. Evita inventar un modelo de usuario antes de definir el backend.
- **No:** `localStorage` para usuario o puntuaciones. Se difiere hasta que exista la spec de auth/backend.
- **Sí:** quitar la fila "TU MEJOR MARCA" del salón. Depende de sesión, que está fuera de alcance.
- **Sí:** datos mock tipados en `lib/`. Los tipos servirán de contrato cuando exista una API.
- **No:** JSON estático. Perdería el generador determinista de puntuaciones.
- **Sí:** reproductor copiado tal cual como placeholder. Después se reemplaza la arena por cada juego real.
- **Sí:** componentes server por defecto; `"use client"` solo donde hay estado o eventos (nav, tarjeta, biblioteca, reproductor, auth, salón).
- **Sí:** el efecto tilt y las animaciones usan el CSS ya presente en `app/globals.css`; no se reescribe estilo.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `cacheComponents` exige tratar `params` y datos dinámicos de forma distinta a lo habitual | Leer la guía en `node_modules/next/dist/docs/` antes del paso 4 y usar `generateStaticParams` con los 8 ids. |
| `Math.random()` en el reproductor y fechas pueden causar errores de hidratación | El puntaje solo se genera dentro de `useEffect`; `seededScores` es determinista. |
| El `id` del detalle viene de la URL y no está validado | Buscar en `GAMES` y llamar `notFound()` si no existe. |
| Los `<a onClick>` de la plantilla no son accesibles | Usar `next/link` para navegación y `<button>` para acciones. |

## Lo que **no** entra en esta spec

- Ningún juego real.
- Sesión, registro o login funcional.
- Persistencia de usuarios o puntuaciones.
- Backend, API o base de datos.
- Tests automatizados.

Cada uno, si se hace, va en su propia spec.
