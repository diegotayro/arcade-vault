# Auditoría de seguridad

Lo mantiene el agente `security-auditor`. Referencias: specs 14 y 15 y `security-checklist.md`.

## Estado actual

| Control | Estado | Detalle | Última revisión |
| --- | --- | --- | --- |
| D1 Advisors de seguridad | ⚠️ | Solo queda `auth_leaked_password_protection` (aceptado, plan Free). | 2026-10-24 |
| D2 RLS en tablas de `public` | ✅ | `games` y `leaderboard` con `relrowsecurity = true`. | 2026-10-24 |
| D3 Políticas | ✅ | SELECT público en `games` y `leaderboard`; único INSERT «authenticated insert own score» (`to authenticated`, `user_id = (select auth.uid())`); sin UPDATE/DELETE. | 2026-10-24 |
| D4 Lista de `game_id` | ✅ | Política, `REAL_GAMES` y filas de `games` coinciden: asteroids, tetris, arkanoid, snake, frogger. | 2026-10-24 |
| D5 Funciones `SECURITY DEFINER` / event triggers | ✅ | `health_check` y `top_scores` son `SECURITY INVOKER` con `search_path` vacío; no existen `rls_auto_enable` ni `ensure_rls`. | 2026-10-24 |
| D6 `games_catalog` con `security_invoker` | ✅ | `reloptions = {security_invoker=true}`. | 2026-10-24 |
| D7 `check` de `leaderboard` vs `lib/score-rules.ts` | ✅ | `player_name` 3–12 y `score` 0–10 000 000 en ambos. | 2026-10-24 |
| D8 FK `leaderboard.user_id → auth.users` | ✅ | `leaderboard_user_id_fkey` con `on delete set null`. | 2026-10-24 |
| D9 Grants de `anon`/`authenticated` | ✅ | Grants por defecto de Supabase (ALL); la RLS bloquea INSERT/UPDATE/DELETE fuera de la política. Hallazgo Baja: TRUNCATE/TRIGGER/REFERENCES innecesarios. | 2026-10-24 |
| D10 Deriva de migraciones | ✅ | 17 migraciones en remoto = 17 archivos en `supabase/migrations/`. | 2026-10-24 |
| A1 Headers de seguridad | ⚠️ | `next.config.ts` correcto para `/(.*)`. Respuestas reales no verificadas (dev server apagado). | 2026-10-24 |
| A2 `proxy.ts` | ⚠️ | `PROTECTED_PATHS`, 401 en APIs, `/auth?next=` y `getUser()` correctos en estática. 401 real no verificado (dev server apagado). | 2026-10-24 |
| A3 Server Actions validan input | ✅ | `saveScore`, auth y contacto validan en servidor; `saveScore` toma `user_id` de `getUser()`. | 2026-10-24 |
| A4 Sin `getSession()` para autorizar | ✅ | No hay usos de `getSession`. | 2026-10-24 |
| A5 Reglas de contraseña | ✅ | `isValidPassword` 8–72 + letra + dígito en `signUp` y `updatePassword`, no en `signIn`. | 2026-10-24 |
| A6 Sin enumeración de cuentas | ✅ | Mensajes genéricos en login, registro y `/auth/forgot`. Baja: `email_not_confirmed` se distingue (solo con contraseña correcta). | 2026-10-24 |
| A7 Open redirect (`safeNextPath`) | ❌ | `safeNextPath` acepta `/\t/evil.com` (y `\n`, `\r`); el parser URL los elimina y queda `//evil.com`. Explotable en `proxy.ts:74` y probablemente en `signIn`. | 2026-10-24 |
| A8 `user_metadata` no autoriza | ✅ | Solo para username/avatar en UI y en el callback. | 2026-10-24 |
| A9 Secretos | ✅ | Solo `NEXT_PUBLIC_SUPABASE_URL`, `..._PUBLISHABLE_KEY` y `..._SITE_URL` son públicas; `RESEND_API_KEY` solo en `app/about/actions.ts`; `.env*` ignorados salvo `.env.template` (placeholders); sin patrones de claves versionados. | 2026-10-24 |
| A10 XSS | ✅ | Sin `dangerouslySetInnerHTML`, `innerHTML`, `eval` ni `new Function`. | 2026-10-24 |
| A11 Contacto | ✅ | Honeypot `website`, `validateContactMessage` y `removeLineBreaks` en el asunto; `from`/`to` desde env. | 2026-10-24 |
| A12 Callback | ✅ | `exchangeCodeForSession`, `next` con `safeNextPath` y prefijo `origin` (el bypass de A7 no sale del dominio aquí), error a `/auth?error=callback`. | 2026-10-24 |
| A13 Dependencias | ✅ | `npm audit --omit=dev`: 0 vulnerabilidades. | 2026-10-24 |
| A14 `tsc` y lint | ✅ | `npx tsc --noEmit` y `npm run lint` sin errores. | 2026-10-24 |

## Historial

### 2026-10-24 — commit `e59437f` (rama `main`)

Primera auditoría registrada, después de la spec 15.

**Resumen por severidad:** Crítica 0 · Alta 1 · Media 0 · Baja 3 · Aceptada 5.

**Hallazgos nuevos:**

- **Alta — A7 open redirect por caracteres de control en `next`.** `lib/auth-rules.ts` (`safeNextPath`) solo mira los dos primeros caracteres. `next = "/\t/evil.com"` (URL `?next=/%09/evil.com`, también `%0A` y `%0D`) pasa el filtro, y `new URL()` elimina tab/CR/LF, con lo que queda `//evil.com` → `http://evil.com/` (verificado con el parser WHATWG de Node).
  - `proxy.ts:74`: un usuario con sesión que abre `/auth?next=/%09/evil.com` recibe una redirección a `evil.com`. Explotable.
  - `app/auth/actions.ts:78` (`signIn`): el router del cliente resuelve igual la URL del `redirect()`. Probable, no verificado en navegador.
  - `app/auth/callback/route.ts:33` no es explotable: antepone `origin`.
  - Remediación: en `safeNextPath`, resolver con `new URL(next, "http://internal")`, exigir que el origen siga siendo el base y devolver `pathname + search + hash`; o rechazar cualquier carácter de control o espacio (`/[\u0000-\u001F\u007F\s\\]/`). Requiere spec nueva.
- **Baja — D9 grants sobrantes.** `anon` y `authenticated` tienen `TRUNCATE`, `TRIGGER` y `REFERENCES` sobre `games`, `leaderboard` y `games_catalog` (defaults de Supabase). `TRUNCATE` no pasa por RLS, aunque PostgREST no lo expone. Remediación: migración con `revoke truncate, trigger, references ... from anon, authenticated`.
- **Baja — A6 mensaje `email_not_confirmed`.** «Confirma tu correo antes de entrar» confirma que la cuenta existe, pero solo a quien ya tiene la contraseña correcta. Riesgo mínimo; se puede mantener por usabilidad.
- **Baja — documentación.** `CLAUDE.md` dice que `saveScore` llama a `revalidatePath("/", "layout")`, pero usa `updateTag(LEADERBOARD_CACHE_TAG)` y `updateTag(GAMES_CACHE_TAG)`. No es un problema de seguridad.

**Resueltos** (respecto a la línea base de `security-checklist.md`): `anon_security_definer_function_executable` y `authenticated_security_definer_function_executable` (`public.rls_auto_enable()`), eliminados en la spec 15.

**Aceptados:** `auth_leaked_password_protection` (plan Free), sin CSP/HSTS/Permissions-Policy, sin CAPTCHA, sin mensaje para 429, username no único.

**No verificado:** la parte de respuestas reales de A1 y A2 (`npm run dev` no estaba corriendo).

**Verificaciones manuales pendientes:**

- Supabase → Authentication → Rate Limits: sign-ups y sign-ins en 10 cada 5 minutos por IP.
- Supabase → Providers → Email: mínimo 8 caracteres, «Letters and digits» y «Confirm email» activado.
- Supabase → URL Configuration: Site URL y Redirect URLs solo con dominios propios (`/auth/callback`).
- Providers Google y GitHub: callback `https://<project>.supabase.co/auth/v1/callback`.
