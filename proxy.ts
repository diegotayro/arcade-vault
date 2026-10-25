import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth-rules";

const SIGNED_OUT_ONLY_PATHS = ["/auth", "/auth/forgot"];
const RESET_PATH = "/auth/reset";
// Rutas exactas o prefijos que exigen sesión: punto central para pantallas futuras
const PROTECTED_PATHS = ["/api/health/supabase"];
const DEFAULT_SIGNED_IN_PATH = "/games";

type Access =
  | { type: "allow" }
  | { type: "redirect"; path: string }
  | { type: "unauthorized" };

const matchesPath = (pathname: string, paths: string[]) =>
  paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

function resolveAccess(url: URL, hasSession: boolean): Access {
  const { pathname, search, searchParams } = url;

  if (hasSession) {
    return SIGNED_OUT_ONLY_PATHS.includes(pathname)
      ? {
          type: "redirect",
          path: safeNextPath(searchParams.get("next"), DEFAULT_SIGNED_IN_PATH),
        }
      : { type: "allow" };
  }

  if (pathname === RESET_PATH)
    return { type: "redirect", path: "/auth/forgot" };
  if (!matchesPath(pathname, PROTECTED_PATHS)) return { type: "allow" };
  if (pathname.startsWith("/api/")) return { type: "unauthorized" };

  return {
    type: "redirect",
    path: `/auth?next=${encodeURIComponent(pathname + search)}`,
  };
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Valida el token con el servidor de Auth y refresca las cookies si hace falta
  const { data } = await supabase.auth.getUser();

  const access = resolveAccess(request.nextUrl, Boolean(data.user));
  if (access.type === "allow") return response;

  const denied =
    access.type === "redirect"
      ? NextResponse.redirect(new URL(access.path, request.url))
      : NextResponse.json({ status: "unauthorized" }, { status: 401 });
  response.cookies.getAll().forEach((cookie) => denied.cookies.set(cookie));
  return denied;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|games/.*\\.(?:png|jpg|jpeg|svg|webp|mp3|wav|ogg)$).*)",
  ],
};
