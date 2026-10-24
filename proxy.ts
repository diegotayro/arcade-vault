import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SIGNED_OUT_ONLY_PATHS = ["/auth", "/auth/forgot"];
const RESET_PATH = "/auth/reset";

function authRedirectPath(pathname: string, hasSession: boolean) {
  if (hasSession && SIGNED_OUT_ONLY_PATHS.includes(pathname)) return "/games";
  if (!hasSession && pathname === RESET_PATH) return "/auth/forgot";
  return null;
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

  const redirectPath = authRedirectPath(
    request.nextUrl.pathname,
    Boolean(data.user),
  );
  if (!redirectPath) return response;

  const redirect = NextResponse.redirect(new URL(redirectPath, request.url));
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|games/.*\\.(?:png|jpg|jpeg|svg|webp|mp3|wav|ogg)$).*)",
  ],
};
