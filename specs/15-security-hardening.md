# SPEC 15 — Endurecimiento de seguridad básico

> **Estado:** Aprovado
> **Depende de:** SPEC 04, SPEC 06, SPEC 14
> **Fecha:** 2026-10-24
> **Objetivo:** Aplicar el checklist de `references/security/security-checklist.md`: RLS explícito, reglas de contraseña alineadas entre la app y Supabase, límite de signups por IP, headers de seguridad, protección de rutas en `proxy.ts` y corrección de los warnings de los advisors.

## Por qué existe esta spec

- `get_advisors` (seguridad) reporta 3 warnings:
  - `anon_security_definer_function_executable`: `public.rls_auto_enable()`.
  - `authenticated_security_definer_function_executable`: `public.rls_auto_enable()`.
  - `auth_leaked_password_protection`.
- `public.rls_auto_enable()` no está en `supabase/migrations/`: la creó Supabase. Es `SECURITY DEFINER`, la ejecuta el event trigger `ensure_rls` y queda expuesta como `/rest/v1/rpc/rls_auto_enable`.
- Supabase Auth ya exige mínimo 8 caracteres con letras y dígitos (configurado por el usuario). La app exige 8–72, pero no letras y dígitos.
- Next.js no envía headers de seguridad.

## Alcance

**Dentro:**

- RLS:
  - Migración que elimina el event trigger `ensure_rls` y la función `public.rls_auto_enable()`.
  - En la misma migración, `enable row level security` explícito e idempotente en `games` y `leaderboard`.
- Reglas de contraseña en `lib/auth-rules.ts`:
  - `isValidPassword` exige 8–72 caracteres, al menos una letra ASCII (`[A-Za-z]`) y al menos un dígito (`[0-9]`).
  - Se aplica en `signUp` y `updatePassword`. `signIn` no la usa, para que las cuentas antiguas sigan entrando.
  - Nueva constante `PASSWORD_RULE_MESSAGE` = «La contraseña debe tener entre 8 y 72 caracteres, con letras y números». Reemplaza el mensaje duplicado en `app/auth/actions.ts`.
  - Pista debajo del input de contraseña: «Mínimo 8 caracteres, con letras y números». Va en la pestaña CREAR CUENTA de `components/auth-form.tsx` y en `components/reset-password-form.tsx`, no en INICIAR SESIÓN.
- Validación de contraseña en el cliente (CREAR CUENTA y `/auth/reset`), reutilizando `isValidPassword` de `lib/auth-rules.ts`:
  - Al salir del input (`blur`), si no cumple, se muestra `PASSWORD_RULE_MESSAGE` bajo el campo, en lugar de la pista.
  - Al enviar, si no cumple, se bloquea el submit (`preventDefault`) y se muestra el mismo error. No se llama a la Server Action ni a Supabase.
  - Una vez mostrado, el error se revisa en cada cambio del input y desaparece en cuanto la contraseña cumple.
  - El input queda marcado con `aria-invalid` y `aria-describedby` apuntando al mensaje.
  - La validación del servidor en `signUp` y `updatePassword` se mantiene como respaldo.
- Rate limit de Supabase Auth: «sign-ups and sign-ins» a 10 cada 5 minutos por IP (paso manual).
- Headers de seguridad en `next.config.ts`, para todas las rutas (`source: "/(.*)"`):
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- Protección de rutas con `proxy.ts` (antes `middleware.ts`; guía: https://nextjs.org/docs/app/getting-started/proxy y `node_modules/next/dist/docs/`). Se amplía el `proxy.ts` existente de la SPEC 14, no se crea otro:
  - Nueva lista `PROTECTED_PATHS` junto a `SIGNED_OUT_ONLY_PATHS`. Admite rutas exactas y prefijos (p. ej. `/api/health/supabase`). Es el punto central para exigir sesión en pantallas futuras.
  - Hoy contiene solo `/api/health/supabase`.
  - Sin sesión, una ruta de `/api/*` protegida responde `401` con `{ "status": "unauthorized" }`, sin redirigir.
  - Sin sesión, una página protegida redirige a `/auth?next=<ruta original>` (ninguna hoy; queda listo para las futuras).
  - Con sesión, `/auth` y `/auth/forgot` (login y creación de cuenta) siguen sin mostrarse. Si hay un `next` válido, redirigen a él; si no, a `/games`.
  - Sin sesión, `/auth/reset` sigue redirigiendo a `/auth/forgot`.
- Retorno tras el login con `?next` validado:
  - `safeNextPath(next, fallback)` sale de `app/auth/callback/route.ts` y pasa a `lib/auth-rules.ts`, compartida por el callback, el proxy y `signIn`.
  - Solo acepta rutas internas: empieza con `/` y no con `//` ni `/\`.
  - `AuthForm` envía `next` como campo oculto. `signIn` redirige a `safeNextPath(next, "/games")`.
  - `signInWithProvider` pasa el `next` validado al callback (`/auth/callback?next=<ruta>`). El callback ya lo respeta.
- Leaked password protection: se documenta como limitación aceptada (plan Free).
- Actualizar `CLAUDE.md`: reglas de contraseña, headers, `PROTECTED_PATHS` y la ausencia de `rls_auto_enable`.

**Fuera de alcance (para futuras specs):**

- Content-Security-Policy, HSTS y Permissions-Policy.
- CAPTCHA (Turnstile, hCaptcha) en el registro.
- Chequeo propio contra HaveIBeenPwned.
- Mensaje específico para el error 429 (demasiados intentos).
- Exigir la nueva regla a las contraseñas existentes.
- Pasar el proyecto al plan Pro.
- Proteger páginas concretas (p. ej. `/games/[id]/play`): todas siguen públicas. Cada una entra en su propia spec agregándola a `PROTECTED_PATHS`.
- `?next` en el registro por email y en la confirmación de correo: siguen terminando en `/`.

## Modelo de datos

No se crean tablas ni columnas. Una migración nueva en `supabase/migrations/` (`remove_rls_auto_enable_and_enforce_rls`):

```sql
drop event trigger if exists ensure_rls;
drop function if exists public.rls_auto_enable();

alter table public.games enable row level security;
alter table public.leaderboard enable row level security;
```

Reglas en `lib/auth-rules.ts`:

```ts
export const PASSWORD_RULE_MESSAGE =
  "La contraseña debe tener entre 8 y 72 caracteres, con letras y números";
export const PASSWORD_HINT = "Mínimo 8 caracteres, con letras y números";
// isValidPassword: longitud 8–72 + /[A-Za-z]/ + /[0-9]/

// Solo rutas internas; si no, devuelve fallback
export const safeNextPath = (next: string | null, fallback: string) => string;
```

Reglas de acceso en `proxy.ts`:

```ts
const SIGNED_OUT_ONLY_PATHS = ["/auth", "/auth/forgot"]; // ya existe
const PROTECTED_PATHS = ["/api/health/supabase"];
// API protegida sin sesión → 401 { status: "unauthorized" }
// Página protegida sin sesión → /auth?next=<ruta>
```

| Archivo                                                               | Cambio                                                                                                 |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `supabase/migrations/<ts>_remove_rls_auto_enable_and_enforce_rls.sql` | Nueva migración                                                                                        |
| `lib/auth-rules.ts`                                                   | `isValidPassword` con letras y dígitos, mensaje, pista y `safeNextPath`                                |
| `app/auth/actions.ts`                                                 | `PASSWORD_RULE_MESSAGE` en `signUp`/`updatePassword`; `next` validado en `signIn`/`signInWithProvider` |
| `components/auth-form.tsx`                                            | Pista y validación cliente (solo CREAR CUENTA); campo oculto `next`                                    |
| `components/reset-password-form.tsx`                                  | Pista y validación cliente de la nueva contraseña                                                      |
| `proxy.ts`                                                            | `PROTECTED_PATHS`, 401 en APIs, `?next` en redirecciones                                               |
| `app/auth/callback/route.ts`                                          | Usa `safeNextPath` de `lib/auth-rules.ts`                                                              |
| `next.config.ts`                                                      | `headers()` con los 3 headers de seguridad                                                             |
| `CLAUDE.md`                                                           | Documentación                                                                                          |

## Configuración manual (fuera del repo)

1. Supabase → Authentication → Providers → Email: «Minimum password length» = 8 y «Password requirements» = «Letters and digits». **Ya está hecho** (lo configuró el usuario); solo se verifica.
2. Supabase → Authentication → Rate Limits: «Rate limit for sign-ups and sign-ins» = 10 cada 5 minutos por IP. Lo hace el usuario antes del paso 5.

## Plan de implementación

1. **Base de datos.**
   - Confirmar con `pg_event_trigger` y `pg_proc` que `ensure_rls` y `rls_auto_enable` siguen existiendo.
   - Aplicar la migración con `apply_migration` y guardar el mismo SQL en `supabase/migrations/`.
   - Ejecutar `get_advisors` de seguridad: solo debe quedar `auth_leaked_password_protection`.
2. **Reglas de contraseña.**
   - Actualizar `isValidPassword` y agregar `PASSWORD_RULE_MESSAGE` y `PASSWORD_HINT` en `lib/auth-rules.ts`.
   - Usar `PASSWORD_RULE_MESSAGE` en `signUp` y `updatePassword`.
   - Prueba manual: registrarse con `abcdefgh` muestra el error en español y no llama a Supabase.
3. **Pista en la UI.**
   - Mostrar `PASSWORD_HINT` bajo el input en CREAR CUENTA y en `/auth/reset`, con el estilo existente de `auth-card`.
   - Prueba manual: la pista no aparece en INICIAR SESIÓN.
4. **Validación en el cliente.**
   - En CREAR CUENTA y en `/auth/reset`, validar con `isValidPassword` al salir del input y al enviar.
   - Si no cumple, mostrar `PASSWORD_RULE_MESSAGE` en lugar de la pista y bloquear el submit.
   - Prueba manual: con `abcdefgh`, la pestaña Network no muestra ninguna petición de la Server Action.
5. **Rate limit** (requiere la configuración manual).
   - Verificar el valor en el dashboard. Prueba manual: el intento 11 de registro desde la misma IP en 5 minutos falla y no crea el usuario.
6. **Headers.**
   - Leer antes la guía de `headers` en `node_modules/next/dist/docs/01-app/` (Next 16).
   - Agregar `headers()` en `next.config.ts`.
   - Prueba manual: `curl -I http://localhost:3000/` y `curl -I http://localhost:3000/games` muestran los 3 headers.
7. **`safeNextPath` compartido.**
   - Mover `safeNextPath` del callback a `lib/auth-rules.ts`, con `fallback` como parámetro y rechazo de `/\`.
   - El callback la usa con `fallback = "/"`. Su comportamiento no cambia.
8. **Rutas protegidas en el proxy.**
   - Leer antes `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.
   - Agregar `PROTECTED_PATHS` con `/api/health/supabase`: sin sesión, `401` en APIs y `/auth?next=<ruta>` en páginas.
   - Con sesión, `/auth` y `/auth/forgot` redirigen al `next` validado o a `/games`.
   - Prueba manual: `curl -i http://localhost:3000/api/health/supabase` sin cookies devuelve `401`; con sesión en el navegador devuelve `{"status":"ok"}`.
9. **Retorno tras el login.**
   - `AuthForm` lee `next` de la URL y lo envía como campo oculto.
   - `signIn` redirige a `safeNextPath(next, "/games")`. `signInWithProvider` agrega el `next` validado al `redirectTo` del callback.
   - Prueba manual: `/auth?next=/hall-of-fame` → login → termina en `/hall-of-fame`.
10. **Documentación.** Actualizar `CLAUDE.md`: reglas de contraseña, headers, `PROTECTED_PATHS` y la ausencia de `rls_auto_enable`.

## Criterios de aceptación

- [ ] `select * from pg_event_trigger where evtname = 'ensure_rls'` y la búsqueda de `public.rls_auto_enable` en `pg_proc` no devuelven filas.
- [ ] `pg_class.relrowsecurity` es `true` para `public.games` y `public.leaderboard`.
- [ ] El SQL de la migración está en `supabase/migrations/` y coincide con el aplicado.
- [ ] `get_advisors` de seguridad devuelve solo `auth_leaked_password_protection`.
- [ ] Un INSERT con la clave anónima en `leaderboard` sigue fallando por RLS. El catálogo y el ranking siguen cargando sin sesión.
- [ ] Registrarse con `abcdefgh` (sin dígitos), `12345678` (sin letras) o `abc123` (6 caracteres) muestra «La contraseña debe tener entre 8 y 72 caracteres, con letras y números» y no crea el usuario.
- [ ] Con esas contraseñas, al enviar CREAR CUENTA o `/auth/reset` no se hace ninguna petición a la Server Action (verificable en Network o con Playwright).
- [ ] Al salir del input con una contraseña inválida aparece el error bajo el campo, con `aria-invalid="true"` en el input.
- [ ] Al corregir la contraseña a `abcd1234`, el error desaparece sin volver a enviar y vuelve la pista.
- [ ] Un POST directo a la Server Action con `abcdefgh` (saltando el cliente) también devuelve el error y no crea el usuario.
- [ ] Registrarse con `abcd1234` funciona y muestra «Revisa tu correo para confirmar tu cuenta».
- [ ] `/auth/reset` rechaza `abcdefgh` con el mismo mensaje.
- [ ] Iniciar sesión no valida letras y dígitos: una contraseña incorrecta sigue mostrando «Correo o contraseña incorrectos».
- [ ] La pista «Mínimo 8 caracteres, con letras y números» aparece en CREAR CUENTA y en `/auth/reset`, y no en INICIAR SESIÓN.
- [ ] El dashboard de Supabase muestra el mínimo de 8, «Letters and digits» y el rate limit de sign-ups y sign-ins en 10 cada 5 minutos.
- [ ] El intento 11 de registro desde la misma IP dentro de 5 minutos falla y no crea el usuario.
- [ ] Las respuestas de `/`, `/games`, `/games/<id>`, `/auth` y `/api/health/supabase` incluyen `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` y `Referrer-Policy: strict-origin-when-cross-origin`.
- [ ] El login con Google y GitHub sigue funcionando con los headers activos.
- [ ] Sin sesión, `GET /api/health/supabase` responde `401` con `{ "status": "unauthorized" }` y no consulta Supabase.
- [ ] Con sesión, `GET /api/health/supabase` responde `200` con `{ "status": "ok" }`.
- [ ] Con sesión, entrar a `/auth` (login o crear cuenta) o a `/auth/forgot` redirige a `/games`, y con `?next=/hall-of-fame` redirige a `/hall-of-fame`.
- [ ] Sin sesión, `/auth/reset` sigue redirigiendo a `/auth/forgot`.
- [ ] Un login con email desde `/auth?next=/hall-of-fame` termina en `/hall-of-fame`. Sin `next`, termina en `/games`.
- [ ] Un login con Google o GitHub desde `/auth?next=/hall-of-fame` termina en `/hall-of-fame`.
- [ ] `/auth?next=https://evil.com`, `?next=//evil.com` y `?next=/\evil.com` terminan en `/games` tras el login, nunca en un dominio externo.
- [ ] `/auth/callback?next=//evil.com` sigue redirigiendo a `/`.
- [ ] Todas las páginas (`/`, `/games`, `/games/<id>`, `/games/<id>/play`, `/hall-of-fame`, `/about`) siguen accesibles sin sesión.
- [ ] `npx tsc --noEmit` y `npm run lint` pasan sin errores.

## Decisiones tomadas y descartadas

- **Sí:** eliminar `rls_auto_enable()` y `ensure_rls`. Lo decidió el usuario: el RLS de nuestras tablas queda explícito en migraciones versionadas.
- **No:** `REVOKE EXECUTE` ni mover la función a otro schema. Mantendrían una pieza creada fuera de las migraciones.
- **Sí:** una migración idempotente con `enable row level security` en ambas tablas, aunque ya estaba en las migraciones de creación. Deja constancia explícita del checklist.
- **Sí:** al crear tablas nuevas, el RLS se activa a mano en su migración. Ya es el patrón del proyecto.
- **Sí:** la misma regla en la app y en Supabase (8 caracteres, letras y dígitos). La app da el mensaje en español y Supabase la hace cumplir si alguien se salta la app.
- **Sí:** la regla solo en registro y reset. **No:** en `signIn`, porque bloquearía cuentas creadas con la regla anterior.
- **Sí:** letras ASCII (`[A-Za-z]`), igual que «Letters and digits» de Supabase. Así una contraseña que la app acepta no la rechaza Auth.
- **Sí:** un único mensaje y una única pista como constantes en `lib/auth-rules.ts` (DRY).
- **Sí:** validar la contraseña también en el cliente, al salir del campo y al enviar. Lo pidió el usuario: no se manda a autenticar una contraseña que sabemos que va a fallar.
- **No:** validación en vivo en cada tecla desde el inicio. Marcaría error desde el primer carácter.
- **Sí:** cliente y servidor usan la misma función `isValidPassword`. **No:** confiar solo en el cliente, porque la Server Action se puede invocar por POST directo.
- **Sí:** rate limit de 10 cada 5 minutos por IP. En Supabase es compartido entre registro e inicio de sesión.
- **No:** CAPTCHA. Amplía el alcance; va en otra spec si hace falta.
- **Sí:** solo los 3 headers del checklist. Lo decidió el usuario.
- **No:** CSP, HSTS ni Permissions-Policy. La CSP con `cacheComponents` y scripts inline necesita nonces y merece su propia spec.
- **Sí:** leaked password protection como limitación aceptada. Requiere el plan Pro y el proyecto está en Free.
- **No:** chequeo propio contra HaveIBeenPwned. Agrega una dependencia externa y el warning de Supabase seguiría apareciendo.
- **Sí:** ampliar el `proxy.ts` existente con `PROTECTED_PATHS`. Es el punto central para exigir sesión en pantallas futuras. Lo decidió el usuario.
- **Sí:** proteger `/api/health/supabase`. Lo decidió el usuario. Un monitor externo ya no puede usarlo sin sesión.
- **Sí:** las APIs protegidas responden `401`. **No:** redirigir una API a `/auth`, porque un cliente HTTP esperaría JSON, no HTML.
- **Sí:** `?next` validado en el login con email y OAuth. Revierte la decisión de la SPEC 14 («No `?next` en el login con email»): ahora es necesario para volver a la ruta protegida, y `safeNextPath` evita el open redirect.
- **Sí:** una sola `safeNextPath` en `lib/auth-rules.ts` para callback, proxy y `signIn` (DRY). Se agrega el rechazo de `/\`, que los navegadores interpretan como `//`.
- **No:** proteger páginas en esta spec. El usuario quiere todas públicas por ahora.
- **No:** bloquear Server Actions en el proxy. `saveScore` ya valida `getUser()` en el servidor.

## Riesgos identificados

| Riesgo                                                                                                                       | Mitigación                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Una tabla nueva creada sin RLS al no existir `ensure_rls`                                                                    | Toda tabla se crea por migración con `enable row level security`. `get_advisors` lo detecta (`rls_disabled_in_public`). |
| El rate limit de 10 bloquea las pruebas manuales o con Playwright                                                            | Esperar 5 minutos o probar desde otra IP. No se automatizan registros masivos.                                          |
| Varios usuarios detrás de la misma IP (NAT) llegan al límite                                                                 | Aceptado para el tamaño actual. Se revisa si aparecen quejas.                                                           |
| `X-Frame-Options: DENY` rompe un embed futuro                                                                                | Hoy no se embebe la app en ningún sitio. Cambiarlo requiere una spec.                                                   |
| Leer `next` de la URL en `/auth` hace dinámica la página con `cacheComponents` (error de `searchParams` fuera de `Suspense`) | Leerlo en `AuthForm` con `useSearchParams` dentro de un `Suspense`. Revisar la documentación de Next 16 antes.          |
| El proxy llama a `getUser()` en `/api/health/supabase` y en cada ruta                                                        | Ya ocurre desde la SPEC 14. No se agregan llamadas nuevas.                                                              |
| El warning de leaked password protection sigue en los advisors                                                               | Documentado como limitación aceptada. Se activa si el proyecto pasa a Pro.                                              |

## Lo que **no** entra en esta spec

- CSP, HSTS y Permissions-Policy.
- CAPTCHA en el registro.
- Chequeo propio contra HaveIBeenPwned.
- Mensaje específico para el error 429.
- Forzar el cambio de las contraseñas existentes.
- Migrar al plan Pro.
- Proteger páginas concretas: se agregan a `PROTECTED_PATHS` en su propia spec.
- `?next` en el registro por email y en la confirmación de correo.

Cada uno de esos, si llega, va en su propia spec.
