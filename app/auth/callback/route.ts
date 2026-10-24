import { NextResponse, type NextRequest } from "next/server";
import { deriveUsername } from "@/lib/auth-rules";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_REDIRECT = "/";

// Solo rutas internas: evita open redirect con `//evil.com` o `https://evil.com`
const safeNextPath = (next: string | null) =>
  next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : DEFAULT_REDIRECT;

// OAuth no trae username: se deriva del proveedor la primera vez que entra
async function ensureUsername(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user || user.user_metadata.username) return;

  const username = deriveUsername({
    provider: user.app_metadata.provider,
    email: user.email,
    metadata: user.user_metadata,
  });
  await supabase.auth.updateUser({ data: { username } });
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await ensureUsername(supabase);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=callback`);
}
