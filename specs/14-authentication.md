# SPEC 14 — Autenticación: registro, login, OAuth y recuperación de contraseña

> **Estado:** Approved
> **Depende de:** SPEC 01, SPEC 04, SPEC 06
> **Fecha:** 2026-10-23
> **Objetivo:** Permitir registrarse e iniciar sesión con email/contraseña, Google o GitHub, recuperar la contraseña y guardar puntajes solo con sesión, vinculados al `user_id`.

## Por qué existe esta spec

- `/auth` es solo UI desde la SPEC 01: el submit redirige a `/games` sin autenticar.
- `leaderboard` acepta inserts anónimos gracias a la política temporal «temporary anonymous insert for ported games», creada en la SPEC 06 a la espera de esta spec.
- El nombre del jugador puede cambiar con el tiempo. Por eso cada puntaje guarda también el `user_id`, que identifica al usuario de forma estable.

## Alcance

**Dentro:**

- Registro con email, contraseña y username en la pestaña CREAR CUENTA de `/auth`.
- Login con email y contraseña en la pestaña INICIAR SESIÓN. Esa pestaña ya no muestra el campo Usuario.
- Confirmación de correo obligatoria (la opción «Confirm email» de Supabase, activada por defecto):
  - Tras un registro exitoso, el usuario sigue en `/auth`.
  - Ve el mensaje «Revisa tu correo para confirmar tu cuenta» y no se lo redirige.
- Login con Google y GitHub desde los botones existentes de `/auth`.
- Ruta `app/auth/callback/route.ts` (patrón de `@supabase/ssr`), compartida por la confirmación, OAuth y la recuperación:
  - Llama a `exchangeCodeForSession(code)`.
  - Redirige a `next`, que por defecto es `/` (home).
  - `next` solo acepta rutas internas: debe empezar con `/` y no con `//`.
  - Si falla, redirige a `/auth?error=callback`.
- Recuperación de contraseña:
  - `/auth/forgot` pide el email y envía el enlace con `resetPasswordForEmail`. La respuesta es siempre la misma: «Si el correo está registrado, te enviamos un enlace».
  - El enlace pasa por `/auth/callback?next=/auth/reset`.
  - `/auth/reset` pide la nueva contraseña y su confirmación, y llama a `updateUser({ password })`. Al terminar redirige a `/games`.
  - En `/auth` se agrega el enlace «¿Olvidaste tu contraseña?».
- Username en `auth.users.raw_user_meta_data` (`user.user_metadata.username`), sin tabla nueva:
  - En el registro por email se guarda con `signUp({ options: { data: { username } } })`.
  - En OAuth se deriva del proveedor dentro del callback si no existe: GitHub → `user_name`; Google → `full_name` sin espacios; si no hay ninguno, la parte local del email.
  - El valor derivado se recorta a 12 caracteres. Si queda con menos de 3, se usa la parte local del email, rellenada con `0` hasta llegar a 3.
  - Se guarda con `updateUser({ data: { username } })`.
- Lógica en Server Actions (`app/auth/actions.ts`): `signUp`, `signIn`, `signInWithProvider`, `signOut`, `requestPasswordReset` y `updatePassword`.
- Validación compartida en `lib/auth-rules.ts`:
  - Email con formato válido.
  - Contraseña de 8 a 72 caracteres.
  - Username con las mismas reglas que `player_name`, reutilizando `isValidPlayerName` de `lib/score-rules.ts`.
- `proxy.ts` en la raíz (convención de Next 16, que reemplaza a `middleware.ts`):
  - Refresca la sesión por cookies.
  - Con sesión, `/auth` y `/auth/forgot` redirigen a `/games`.
  - Sin sesión, `/auth/reset` redirige a `/auth/forgot`.
- Tras un login exitoso con email se redirige a `/games`. La confirmación y OAuth terminan en `/` (vía callback).
- Nav (`components/nav.tsx`), en escritorio y en el panel móvil:
  - Con sesión, muestra el username y el botón SALIR en lugar de «Iniciar Sesión».
  - SALIR llama a `signOut` y refresca la vista.
- Hook cliente `useSessionUser` en `lib/supabase/use-session-user.ts`:
  - Lee la sesión con `getUser()` y escucha `onAuthStateChange`.
  - Lo usan el nav y `GamePlayer`.
- Guardado de puntaje solo con sesión:
  - `saveScore` toma el `user_id` de `supabase.auth.getUser()` en el servidor, nunca del cliente.
  - Si no hay sesión, devuelve `{ ok: false, reason: "unauthenticated" }`.
  - El nombre sigue siendo el que el usuario escribe en el modal de fin. Se precarga con su username.
  - Sin sesión, el modal muestra «Inicia sesión para guardar tu puntaje» con un enlace a `/auth`, en lugar del input.
- Migraciones Supabase:
  - FK `leaderboard.user_id → auth.users(id) on delete set null`.
  - Se reemplaza la política anónima por la nueva política de INSERT para `authenticated`.
- Se agrega `NEXT_PUBLIC_SITE_URL` a `.env.template` y a `.env.local`. Se usa para `emailRedirectTo`, `redirectTo` de OAuth y la recuperación.
- Mensajes de error en español, sin filtrar si una cuenta existe:
  - «Correo o contraseña incorrectos».
  - «Confirma tu correo antes de entrar».
  - «No se pudo completar el inicio de sesión».
- Las pantallas nuevas (`/auth/forgot`, `/auth/reset`) y los estados nuevos de `/auth` se diseñan con `/frontend-design`, en la estética de `auth-card`.
- Configuración externa como paso manual documentado (ver «Configuración manual»).
- Actualizar `CLAUDE.md`: auth real, nombre de la nueva política de INSERT y nuevas rutas.

**Fuera de alcance (para futuras specs):**

- Página de perfil y edición de username desde la UI.
- Unicidad de username: puede repetirse.
- Otros proveedores OAuth, magic link y login con username.
- SMTP propio (Resend) para los correos de auth: se usa el SMTP por defecto de Supabase.
- Proteger rutas: todo sigue accesible sin sesión, salvo el guardado de puntaje.
- Asociar a una cuenta los puntajes anónimos ya existentes.
- Mostrar en el Salón de la Fama qué puntajes pertenecen al usuario actual.
- Borrar la cuenta.

## Modelo de datos

No se crean tablas. El username vive en `auth.users.raw_user_meta_data`:

```ts
// user.user_metadata (Supabase Auth)
type UserMetadata = {
  username?: string; // 3–12 caracteres, no único
  // OAuth agrega: full_name, avatar_url, user_name (GitHub), email…
};

// lib/supabase/use-session-user.ts
type SessionUser = { id: string; username: string } | null;

// app/games/[id]/play/actions.ts
type SaveScoreResult = { ok: true } | { ok: false; reason?: "unauthenticated" };

// app/auth/actions.ts (estado de useActionState)
type AuthFormState = { status: "idle" | "error" | "check-email" | "sent"; message?: string };
```

Migraciones (`supabase/migrations/`):

```sql
-- add_leaderboard_user_fk
alter table public.leaderboard
  add constraint leaderboard_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete set null;

-- replace_anonymous_insert_with_authenticated
drop policy "temporary anonymous insert for ported games" on public.leaderboard;
create policy "authenticated insert own score" on public.leaderboard
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and game_id in ('asteroids', 'tetris', 'arkanoid', 'snake', 'frogger')
  );
```

Los puntajes existentes conservan `user_id` nulo y siguen visibles en el ranking.

| Archivo                                          | Cambio                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------- |
| `proxy.ts`                                       | Nuevo: refresco de sesión y redirecciones de `/auth*`                     |
| `lib/auth-rules.ts`                              | Nuevo: validación de email, contraseña y username                         |
| `lib/supabase/use-session-user.ts`               | Nuevo: hook cliente de sesión                                             |
| `app/auth/actions.ts`                            | Nuevo: Server Actions de auth                                             |
| `app/auth/callback/route.ts`                     | Nuevo: `exchangeCodeForSession`, `next` validado, username OAuth          |
| `app/auth/forgot/page.tsx`, `app/auth/reset/...` | Nuevas páginas con sus formularios cliente                                |
| `components/auth-form.tsx`                       | Conectado a las actions, estados de error/«revisa tu correo», OAuth       |
| `components/nav.tsx`                             | Username + SALIR con sesión                                               |
| `components/game-player.tsx`                     | Precarga del nombre y aviso «Inicia sesión para guardar»                  |
| `app/games/[id]/play/actions.ts`                 | `saveScore` con `user_id` de la sesión                                    |
| `lib/supabase/server.ts`                         | Se actualiza el comentario del `catch` de `setAll` (el refresco ya existe) |
| `lib/supabase/database.types.ts`                 | Regenerado                                                                |
| `.env.template`, `CLAUDE.md`                     | `NEXT_PUBLIC_SITE_URL` y documentación                                    |

## Configuración manual (fuera del repo)

La configuración externa no se puede hacer por MCP. La hace el usuario antes del paso 4. Ninguna credencial va al repo.

1. Supabase → Authentication → URL Configuration:
   - Site URL = `NEXT_PUBLIC_SITE_URL`.
   - Redirect URLs: `http://localhost:3000/auth/callback` y la URL de producción `/auth/callback`.
2. Supabase → Providers → Email: «Confirm email» activado.
3. Google Cloud Console:
   - Crear un OAuth Client (Web) con redirect URI `https://<project>.supabase.co/auth/v1/callback`.
   - Copiar su Client ID y Secret en Supabase → Providers → Google.
4. GitHub → Settings → Developer settings → OAuth Apps:
   - Crear una app con callback `https://<project>.supabase.co/auth/v1/callback`.
   - Copiar su Client ID y Secret en Supabase → Providers → GitHub.

## Plan de implementación

1. **Base de sesión.**
   - Crear `proxy.ts` con el refresco de sesión de `@supabase/ssr` (leer antes `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`).
   - Crear `lib/auth-rules.ts` y agregar `NEXT_PUBLIC_SITE_URL` a `.env.template`.
   - Prueba manual: la app navega igual que antes y no hay errores en la consola.
2. **Registro y login con email.**
   - Crear `app/auth/actions.ts` con `signUp` y `signIn`.
   - Conectar `AuthForm` con `useActionState`: el username aparece solo en CREAR CUENTA, más el mensaje «Revisa tu correo…» y los errores.
   - Prueba manual: el registro muestra el mensaje y sigue en `/auth`; un login sin confirmar muestra «Confirma tu correo antes de entrar».
3. **Callback.**
   - Crear `app/auth/callback/route.ts` con `next` validado y el fallback de error.
   - Prueba manual: el enlace de confirmación deja la sesión iniciada y llega a `/`.
4. **OAuth** (requiere la configuración manual).
   - Agregar `signInWithProvider("google" | "github")` y conectar los botones.
   - En el callback, derivar el username si falta.
   - Prueba manual: entrar con GitHub y con Google, y revisar que `user_metadata.username` quede guardado.
5. **Sesión en la UI.**
   - Crear `useSessionUser`.
   - En el nav, mostrar username + SALIR (escritorio y panel móvil) con la action `signOut`.
   - Agregar las redirecciones de `/auth` en `proxy.ts`.
6. **Recuperación de contraseña.**
   - Crear `/auth/forgot` y `/auth/reset` con `requestPasswordReset` y `updatePassword`.
   - Agregar el enlace «¿Olvidaste tu contraseña?» en `/auth`.
   - Diseñar las pantallas con `/frontend-design`.
7. **Base de datos.**
   - Escribir las dos migraciones: aplicarlas con `apply_migration` y guardar el mismo SQL en `supabase/migrations/`.
   - Consultar antes en `pg_policies` el nombre vigente de la política.
   - Regenerar `database.types.ts` y ejecutar `get_advisors` de seguridad.
   - Los pasos 7 y 8 van en el mismo commit, porque la migración sola rompe el guardado anónimo.
8. **Guardado con sesión.**
   - En `saveScore`, tomar el `user_id` de `getUser()`.
   - En `GamePlayer`, precargar el nombre con el username y mostrar el aviso a los invitados.
9. **Documentación.** Actualizar `CLAUDE.md`: estado de auth, política «authenticated insert own score» y rutas nuevas.

## Criterios de aceptación

- [ ] Un registro con email, username y contraseña válidos deja al usuario en `/auth` con «Revisa tu correo para confirmar tu cuenta».
- [ ] Una contraseña de menos de 8 caracteres o un username fuera de 3–12 caracteres muestra un error en español y no llama a Supabase.
- [ ] Iniciar sesión antes de confirmar el correo muestra «Confirma tu correo antes de entrar».
- [ ] El enlace de confirmación pasa por `/auth/callback`, inicia la sesión y redirige a `/`.
- [ ] Un login con email y contraseña correctos redirige a `/games`. Uno con datos incorrectos muestra «Correo o contraseña incorrectos».
- [ ] Entrar con Google o con GitHub inicia la sesión, termina en `/` y guarda `user_metadata.username` de 3–12 caracteres.
- [ ] `/auth/callback?next=https://evil.com` o `?next=//evil.com` redirige a `/`, no a un dominio externo.
- [ ] Un `code` inválido en el callback redirige a `/auth?error=callback` y muestra un mensaje de error.
- [ ] Con sesión, el nav (escritorio y móvil) muestra el username y SALIR. SALIR cierra la sesión y vuelve a mostrar «Iniciar Sesión».
- [ ] Con sesión, entrar a `/auth` redirige a `/games`.
- [ ] `/auth/forgot` muestra el mismo mensaje para un correo registrado y para uno que no existe.
- [ ] El enlace de recuperación lleva a `/auth/reset`. Una nueva contraseña válida permite iniciar sesión con ella.
- [ ] Sin sesión, `/auth/reset` redirige a `/auth/forgot`.
- [ ] Sin sesión, el modal de fin de partida muestra «Inicia sesión para guardar tu puntaje» con un enlace a `/auth`, sin input de nombre.
- [ ] Con sesión, el input de nombre aparece precargado con el username. El puntaje guardado tiene el `user_id` del usuario y el nombre escrito.
- [ ] Un INSERT directo con la clave anónima en `leaderboard` falla por RLS. Uno autenticado con un `user_id` ajeno también falla.
- [ ] `get_advisors` de seguridad no reporta advertencias nuevas.
- [ ] Todas las páginas siguen accesibles sin sesión.
- [ ] `npx tsc --noEmit` y `npm run lint` pasan sin errores.

## Decisiones tomadas y descartadas

- **Sí:** el username va en `user_metadata` de `auth.users`. Así no hay tabla ni trigger nuevos. Basta para mostrarlo y precargarlo, porque `leaderboard.player_name` ya guarda el nombre.
- **No:** tabla `profiles` con trigger. Lo descartó el usuario.
- **Sí:** el username puede repetirse. La identidad estable la da `user_id`.
- **No:** usar `user_metadata` para autorizar algo. El usuario lo puede editar con `updateUser`.
- **Sí:** el nombre del ranking es el que se escribe al guardar, precargado con el username. Si el usuario cambia de nombre, `user_id` lo sigue identificando.
- **Sí:** una sola spec con email, OAuth, confirmación y recuperación. **No:** dividirla en dos. Lo decidió el usuario.
- **Sí:** confirmación de correo obligatoria, y tras el registro el usuario sigue en `/auth` con un mensaje.
- **Sí:** `/auth/callback` como única ruta, con `exchangeCodeForSession` y `next` validado. **No:** route `/auth/confirm` con `verifyOtp` aparte.
- **Sí:** Server Actions + `proxy.ts`. **No:** auth solo desde el cliente, porque la validación quedaría solo en el navegador.
- **Sí:** la sesión se lee en el cliente (`useSessionUser`) para el nav y el reproductor. **No:** leerla en el servidor como prop, porque haría dinámicas las páginas con `cacheComponents`.
- **Sí:** el `user_id` se toma en el servidor y la RLS exige `user_id = auth.uid()`. **No:** confiar en un `user_id` enviado por el cliente.
- **Sí:** guardar exige sesión. Se elimina la política anónima temporal.
- **Sí:** FK a `auth.users` con `on delete set null`, para que borrar una cuenta no borre el ranking.
- **Sí:** mensajes genéricos en el login y en `/auth/forgot`, para no revelar qué correos existen.
- **No:** `?next=` en el login con email. Siempre va a `/games`, así se evita un open redirect.

## Riesgos identificados

| Riesgo                                                                                  | Mitigación                                                                                                  |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| El flujo PKCE falla si el enlace del correo se abre en otro navegador (falta el `code_verifier`) | El callback redirige a `/auth?error=callback` con un mensaje para abrirlo en el mismo navegador. Cambiar la plantilla a `token_hash` va en otra spec. |
| El SMTP por defecto de Supabase limita los correos por hora                             | Suficiente para desarrollo. El SMTP propio queda fuera de alcance.                                          |
| `proxy.ts` o el refresco de cookies rompen el render estático con `cacheComponents`      | Leer la documentación de `proxy.md` antes. El proxy solo toca cookies y redirige rutas `/auth*`.            |
| Quitar la política anónima rompe el guardado si se despliega sin el nuevo `saveScore`    | Los pasos 7 y 8 van en el mismo commit.                                                                     |
| El username derivado de OAuth no cumple 3–12 caracteres                                 | Recorte a 12 y fallback a la parte local del email, rellenada con `0` hasta llegar a 3.                     |
| Faltan credenciales OAuth al implementar                                                | El paso 4 depende de la configuración manual. Los pasos 1–3 y 5–8 funcionan sin ella.                       |

## Lo que **no** entra en esta spec

- Perfil y edición de username.
- Username único.
- Otros proveedores, magic link y login por username.
- SMTP propio para los correos de auth.
- Rutas protegidas (fuera del guardado de puntaje).
- Reclamar puntajes anónimos antiguos.
- Resaltar los puntajes propios en el Salón de la Fama.
- Borrar la cuenta.

Cada uno de esos, si llega, va en su propia spec.

