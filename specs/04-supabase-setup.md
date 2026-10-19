# SPEC 04 — Infraestructura de Supabase en Next.js

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-18
> **Objetivo:** Conectar la app Next.js al proyecto Supabase remoto `ftgbpbhuwztwjbrzixfl` con clientes de servidor y navegador, tipos generados y un health check, dejando la base lista para auth, Realtime y Edge Functions futuros.

## Alcance

**Dentro:**

- Instalar `@supabase/supabase-js` y `@supabase/ssr`.
- Cliente de servidor (`lib/supabase/server.ts`) y cliente de navegador (`lib/supabase/client.ts`) con el patrón de `@supabase/ssr` para App Router.
- Variables de entorno públicas `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local` y documentadas en `.env.template`.
- Migración con la función `public.health_check()` para verificar la conexión de extremo a extremo (cliente → API → base de datos).
- Route Handler `GET /api/health/supabase` que invoca la función y responde `{ status: "ok" }` o `{ status: "error" }`.
- Tipos de base de datos generados en `lib/supabase/database.types.ts` y usados por ambos clientes.
- Migraciones versionadas en `supabase/migrations/` dentro del repo.
- Los clientes quedan listos para Realtime (sin suscribirse a nada todavía).

**Fuera de alcance (para futuras specs):**

- Autenticación (registro, login, sesión por cookies, `proxy.ts` para refrescar sesión). `/auth` sigue siendo mock.
- Tablas de negocio: `games`, `scores`, perfiles, ranking.
- Suscripciones Realtime y canales.
- Edge Functions (`supabase/functions/`) y sus secretos.
- Supabase local con Docker (`supabase start`).
- `service_role` / secret key en la app: no se agrega ninguna.
- Row Level Security de tablas de negocio (aún no existen).
- Tests automatizados.

## Modelo de datos

La spec no introduce tablas. Solo una función de base de datos y los tipos que genera Supabase.

```sql
-- supabase/migrations/<timestamp>_health_check.sql
create function public.health_check()
returns text
language sql
security invoker
set search_path = ''
as $$ select 'ok'::text $$;

revoke execute on function public.health_check() from public;
grant execute on function public.health_check() to anon, authenticated;
```

Variables de entorno (públicas por diseño; la seguridad la dará RLS en specs futuras):

| Variable                               | Valor                                                     |
| -------------------------------------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL del proyecto (obtenida con MCP `get_project_url`)     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (obtenida con MCP `get_publishable_keys`) |

Convenciones:

- Los clientes son tipados con `Database` de `lib/supabase/database.types.ts`.
- `createClient` del servidor es `async` y lee cookies con `cookies()` de `next/headers`.
- `SUPABASE_DB_PASSWORD` ya existe en `.env.template`; no se usa desde la app.
- Código en inglés; textos visibles (ninguno nuevo en esta spec) en español.

## Plan de implementación

Antes de escribir código Next.js, leer en `node_modules/next/dist/docs/` la guía de Route Handlers y la de `cacheComponents` (el handler debe ser dinámico). Consultar la doc de Supabase con MCP `search_docs` para el setup de `@supabase/ssr` con Next.js.

1. Instalar `@supabase/supabase-js` y `@supabase/ssr` (`npm i`). Verificar: `npm run build` pasa.
2. Obtener URL y publishable key con MCP (`get_project_url`, `get_publishable_keys`); agregarlas a `.env.local` y a `.env.template` con valores `XXXXX`. Verificar: `git status` no muestra `.env.local`.
3. Aplicar la migración `health_check` con MCP `apply_migration` y guardar el mismo SQL en `supabase/migrations/`. Verificar: `list_migrations` la muestra y `execute_sql` con `select public.health_check()` devuelve `ok`.
4. Generar tipos con MCP `generate_typescript_types` y guardarlos en `lib/supabase/database.types.ts`. Verificar: `npx tsc --noEmit` pasa.
5. Crear `lib/supabase/client.ts` (`createBrowserClient`) y `lib/supabase/server.ts` (`createServerClient` con cookies), ambos tipados con `Database`. Verificar: `npx tsc --noEmit` pasa.
6. Crear `app/api/health/supabase/route.ts` (`GET`) que llama a `rpc("health_check")` con el cliente de servidor y responde `200 { status: "ok" }` o `503 { status: "error" }` sin exponer detalles internos. Verificar: `curl localhost:3000/api/health/supabase` devuelve `ok`.
7. Ejecutar `get_advisors` (security y performance) y `npm run lint` y `npm run build`.

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores y `npx tsc --noEmit` pasa.
- [ ] `package.json` incluye `@supabase/supabase-js` y `@supabase/ssr`.
- [ ] `.env.local` contiene las dos variables de Supabase y no está versionado; `.env.template` las lista con valores `XXXXX`.
- [ ] `GET /api/health/supabase` devuelve `200` con `{ "status": "ok" }` con las variables correctas.
- [ ] Con `NEXT_PUBLIC_SUPABASE_URL` inválida, el endpoint devuelve `503` con `{ "status": "error" }` sin mensajes internos ni stack.
- [ ] `list_migrations` muestra la migración `health_check` y el mismo SQL existe en `supabase/migrations/`.
- [ ] `public.health_check()` no es ejecutable por `public`, solo por `anon` y `authenticated`.
- [ ] `lib/supabase/database.types.ts` existe y ambos clientes usan el tipo `Database`.
- [ ] `lib/supabase/server.ts` y `lib/supabase/client.ts` no referencian ninguna secret ni `service_role` key.
- [ ] `get_advisors` de seguridad no reporta problemas nuevos introducidos por esta spec.
- [ ] Ninguna pantalla existente cambia ni produce errores en la consola.

## Decisiones tomadas y descartadas

- **Sí:** esta spec solo cubre infraestructura. Auth y puntuaciones son dominios distintos; juntos exceden el tamaño razonable de una spec.
- **Sí:** proyecto remoto existente (`ftgbpbhuwztwjbrzixfl`), ya enlazado en `.mcp.json`. Evita depender de Docker.
- **No:** Supabase local con CLI. Se puede agregar luego si el equipo lo necesita.
- **Sí:** `@supabase/ssr` desde ahora. Evita migrar los clientes al agregar auth con cookies.
- **No:** solo `supabase-js`. Obligaría a reescribir los clientes en la spec de auth.
- **Sí:** health check mediante función `health_check()`. No requiere tablas de negocio y valida URL, key, red, API y base de datos.
- **No:** tabla `games` con seed. Adelanta el modelo de datos de otra spec.
- **Sí:** publishable key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) y ninguna secret key. La app no necesita privilegios elevados; se agregará solo en servidor si una spec lo requiere.
- **Sí:** migraciones guardadas en `supabase/migrations/`. Dejan el esquema reproducible y revisable en git, no solo aplicado vía MCP.
- **Sí:** preparado para Realtime y Edge Functions solo a nivel de infraestructura. Los clientes de `supabase-js` ya incluyen Realtime y las funciones se invocarán con `supabase.functions.invoke`; no se escribe código de ninguno de los dos.
- **No:** `proxy.ts` de refresco de sesión. Sin auth no hay sesión que refrescar.
- **Sí:** endpoint de health check público y sin detalles internos. Solo informa ok/error.

## Riesgos identificados

| Riesgo                                                             | Mitigación                                                                                                |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `cacheComponents` cachea o prerenderiza el handler y oculta fallos | Leer la guía antes del paso 6; el handler usa cookies/`rpc` dinámicos y se verifica con una URL inválida. |
| Las claves `NEXT_PUBLIC_` se exponen al navegador                  | Es el diseño de Supabase; solo se usa la publishable key y la seguridad se delega a RLS en specs futuras. |
| Tablas futuras creadas sin RLS quedan abiertas con esta key        | Cada spec de datos debe activar RLS en su migración; `get_advisors` se ejecuta al cerrar cada spec.       |
| La migración aplicada por MCP y el archivo local divergen          | El paso 3 exige el mismo SQL en ambos lugares y verifica con `list_migrations`.                           |
| Cambios de API en `@supabase/ssr` respecto al conocimiento previo  | Consultar `search_docs` antes del paso 5 en lugar de asumir la firma de `createServerClient`.             |
| Endpoint público de health sin rate limit                          | Solo ejecuta una función trivial; si molesta, se protege o elimina en una spec posterior.                 |

## Lo que **no** entra en esta spec

- Autenticación, sesiones o `proxy.ts`.
- Tablas, RLS de negocio, puntuaciones o ranking.
- Suscripciones Realtime.
- Edge Functions.
- Supabase local con Docker.
- Secret / `service_role` key.
- Tests automatizados.

Cada uno, si se hace, va en su propia spec.
