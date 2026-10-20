# SPEC 03 — Pantalla "Sobre Nosotros" y envío de contacto con Resend

> **Estado:** Implemented
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-10-18
> **Objetivo:** Implementar en `/about` la pantalla de `references/templates/home-about/about.jsx` (sección "Acerca de" y formulario de contacto) y enviar el mensaje por correo con Resend mediante una Server Action.

## Alcance

**Dentro:**

- Ruta `/about` con las secciones de la plantilla: hero "ACERCA DE ARCADE VAULT" con misión y 3 highlights con ícono, divisor de píxeles y sección "CONTÁCTANOS" (intro con 3 tips + formulario).
- Animación de aparición al hacer scroll reutilizando `Reveal` de SPEC 02.
- Formulario con nombre, correo y mensaje; estado de error con animación `shake`, estado de envío y terminal de éxito ("VAULT-OS // TERMINAL") con "ENVIAR OTRO MENSAJE", como en la plantilla.
- Envío real del correo con Resend desde una Server Action (`"use server"`), con validación en servidor.
- Protección anti-abuso: campo honeypot oculto, validación de formato de correo y límites de longitud.
- Estado de error de envío (fallo de Resend o configuración ausente) visible en el formulario; no existe en la plantilla.
- Navbar: link "Sobre Nosotros" (`/about`) después de "Salón de la Fama", en escritorio y panel móvil, con estado activo.
- Portar a `app/globals.css` los estilos de `about`/`contact` de `references/templates/home-about/styles.css` que aún no existen.
- Variables de entorno en `.env.local` y documentadas en `.env.template`.
- Textos visibles en español, rutas y código en inglés.

**Fuera de alcance (para futuras specs):**

- Rate limit por IP o CAPTCHA.
- Persistir los mensajes (base de datos, historial).
- Correo de confirmación al remitente y `reply-to` dinámico.
- Dominio propio verificado en Resend (se usa el remitente de pruebas).
- Plantilla HTML elaborada del correo (se envía texto simple).
- Sesión, backend adicional, tests automatizados, internacionalización.

## Modelo de datos

Sin persistencia. Se tipan el payload y el resultado de la acción en `lib/contact.ts`.

```ts
// lib/contact.ts
interface ContactMessage {
  name: string;     // 1..80 caracteres tras trim
  email: string;    // formato válido, máx. 254
  message: string;  // 1..2000 caracteres tras trim
}

type ContactResult =
  | { status: "success"; senderName: string }
  | { status: "error"; reason: "invalid" | "send-failed" };

const CONTACT_LIMITS = { name: 80, email: 254, message: 2000 } as const;
```

Variables de entorno (solo servidor, nunca `NEXT_PUBLIC_`):

| Variable | Valor |
| --- | --- |
| `RESEND_API_KEY` | API key de Resend |
| `CONTACT_TO_EMAIL` | `diego.tayro@gmail.com` |
| `CONTACT_FROM_EMAIL` | `onboarding@resend.dev` |

Convenciones:

- Textos y copy son los de `about.jsx`, sin cambios.
- El correo usa asunto `[Arcade Vault] Nuevo mensaje de {name}` y cuerpo en texto plano con nombre, correo y mensaje.
- Un honeypot relleno devuelve `success` sin enviar nada, para no dar pistas al bot.
- Los valores del usuario nunca se interpolan en HTML (solo texto plano).

## Plan de implementación

Antes de escribir código Next.js, leer en `node_modules/next/dist/docs/` la guía de Server Actions/formularios y la de `cacheComponents`. Usar `/frontend-design` para cualquier ajuste de UI.

1. Instalar `resend` (`npm i resend`), crear `.env.template` con las 3 variables y `.env.local` con valores reales (ignorado por git). Verificar: `git status` no muestra `.env.local`; `npm run build` pasa.
2. Crear `lib/contact.ts` con los tipos, `CONTACT_LIMITS` y la función pura `validateContactMessage`. Verificar: `npx tsc --noEmit` pasa.
3. Crear `app/about/actions.ts` (`"use server"`) con `sendContactMessage(formData)`: honeypot, validación, envío con Resend y mapeo a `ContactResult`; sin exponer errores internos al cliente. Verificar: `npx tsc --noEmit` pasa.
4. Portar a `app/globals.css` los estilos `.about*`, `.highlight*`, `.hl-*`, `.about-divider`, `.div-*`, `.about-contact`, `.contact-*`, `.terminal-success`, `.term-*`, `.shake` y `.field textarea` que no existan, sin duplicar clases. Verificar: `npm run build` pasa.
5. Crear `components/about/highlight-icon.tsx` (server, SVG) y `components/about/about-hero.tsx` (hero con highlights) y `components/about/pixel-divider.tsx`. Montar en `app/about/page.tsx`. Verificar: `/about` muestra título, misión, 3 highlights y el divisor.
6. Crear `components/about/contact-form.tsx` (client, `useActionState` + `shake`) con campos, honeypot oculto, errores y `components/about/terminal-success.tsx`; y `components/about/contact-section.tsx` con la intro y los tips dentro de `Reveal`. Verificar: enviar con campos vacíos hace `shake` sin llamar a Resend; un envío válido llega a `diego.tayro@gmail.com` y muestra la terminal con el nombre en mayúsculas.
7. Navbar: agregar "Sobre Nosotros" a `/about` en `components/nav.tsx` (escritorio y panel móvil) con clase `active` en `/about`. Verificar: link activo correcto en `/about` y menú hamburguesa con el nuevo link.
8. Agregar metadata de `/about` (título "Sobre Nosotros") y ejecutar `npm run lint` y `npm run build`.

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `/about` existe y la ruta está en inglés; el navbar muestra "Sobre Nosotros" después de "Salón de la Fama", en escritorio y panel móvil.
- [ ] "Sobre Nosotros" está activo solo en `/about`.
- [ ] El hero muestra el título "ACERCA DE ARCADE VAULT", la misión y 3 highlights (corazón magenta, navegador cyan, planta verde) con ícono SVG.
- [ ] El divisor tiene `aria-hidden="true"` y 24 píxeles animados.
- [ ] La sección de contacto muestra el título "CONTÁCTANOS", el texto y los 3 tips ("RESPUESTA EN 24-48H", "SUGERENCIAS BIENVENIDAS", "SIN SPAM, JAMÁS").
- [ ] Enviar con algún campo vacío (tras trim) activa `shake` y no invoca a Resend.
- [ ] Un correo con formato inválido o campos por encima de los límites es rechazado también en el servidor.
- [ ] Un envío válido entrega un correo a `diego.tayro@gmail.com` desde `onboarding@resend.dev` con asunto `[Arcade Vault] Nuevo mensaje de {name}` y nombre, correo y mensaje en el cuerpo.
- [ ] Tras el envío se muestra la terminal con "MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {NOMBRE}."; "ENVIAR OTRO MENSAJE" limpia el formulario y vuelve a mostrarlo.
- [ ] Si Resend falla o falta `RESEND_API_KEY`, el formulario conserva lo escrito y muestra un mensaje de error en español; no se filtran detalles internos.
- [ ] Con el honeypot relleno no se envía ningún correo y la respuesta es indistinguible de un éxito.
- [ ] `RESEND_API_KEY` no aparece en el bundle del cliente ni en el HTML; `.env.local` no está versionado.
- [ ] Mientras se envía, el botón queda deshabilitado y evita envíos duplicados.
- [ ] Con ancho ≤ 840px `/about` no produce scroll horizontal y el grid de highlights y contacto se apila.
- [ ] Ninguna pantalla produce errores ni warnings de hidratación en la consola.
- [ ] Visualmente `/about` coincide con la pantalla "Acerca de" de `references/templates/home-about/arcade-vault-standalone.html`.

## Decisiones tomadas y descartadas

- **Sí:** Server Action en lugar de Route Handler. Es lo idiomático en Next 16, evita un endpoint público y mantiene la API key en el servidor.
- **No:** `POST /api/contact`. Solo se justificaría si otro cliente lo consumiera.
- **Sí:** ruta `/about` y texto de navbar "Sobre Nosotros". Decisión del usuario: ruta en inglés, UI en español.
- **Sí:** destinatario `diego.tayro@gmail.com` y remitente `onboarding@resend.dev`, ambos por variables de entorno. El remitente de pruebas de Resend solo entrega al correo de la cuenta, suficiente para este MVP.
- **No:** dominio propio verificado. Se difiere hasta tener dominio.
- **Sí:** honeypot + validación + límites de longitud. Cubre bots básicos sin dependencias ni almacenamiento.
- **No:** rate limit por IP. En serverless la memoria no es fiable y Redis queda fuera de alcance.
- **Sí:** correo en texto plano. Evita inyección HTML con entrada del usuario.
- **No:** `reply-to` con el correo del remitente en esta spec. Se agrega junto a la plantilla HTML y la confirmación al usuario.
- **Sí:** la terminal de éxito solo se muestra cuando la acción confirma el envío (la plantilla la mostraba sin enviar nada).
- **Sí:** reutilizar `Reveal` de SPEC 02 en lugar del `useEffect` con `querySelectorAll` de la plantilla.
- **Sí:** estado de error de envío nuevo respecto a la plantilla; sin él un fallo de Resend sería silencioso.
- **Sí:** componentes server por defecto; `"use client"` solo en `ContactForm` (estado, `useActionState`) y `Reveal`.
- **Sí:** estilos portados a `app/globals.css` sin reescribirlos, igual que en SPEC 01 y 02.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `onboarding@resend.dev` solo entrega al correo de la cuenta de Resend | `CONTACT_TO_EMAIL` debe ser el correo con el que se creó la cuenta; se verifica en el paso 6. |
| `RESEND_API_KEY` ausente o inválida rompe el envío | La acción devuelve `send-failed` con mensaje genérico; el build no depende de la variable. |
| Spam o abuso del formulario sin rate limit | Honeypot, límites de longitud y cuota del plan de Resend; rate limit queda para otra spec. |
| Inyección de cabeceras/HTML por entrada del usuario | Correo en texto plano; asunto con el nombre saneado (sin saltos de línea). |
| `cacheComponents` cambia la semántica de render | Leer la guía antes del paso 3; la página es estática y la acción solo corre bajo demanda. |
| `.reveal` deja el contenido invisible si el observer no se dispara | El hero de `/about` no usa `.reveal`; solo el divisor y la sección de contacto. |
| Colisión de clases al portar `styles.css` (p. ej. `.field`, `.shake`) | Portar solo las que no existen y revisar el build. |

## Lo que **no** entra en esta spec

- Rate limit, CAPTCHA o moderación de mensajes.
- Persistencia de mensajes.
- Correo de confirmación al remitente, `reply-to` y plantilla HTML.
- Dominio propio en Resend.
- Sesión, registro o login funcional.
- Tests automatizados.

Cada uno, si se hace, va en su propia spec.
