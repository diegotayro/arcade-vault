import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_REDIRECT = "/";

// Solo rutas internas: evita open redirect con `//evil.com` o `https://evil.com`
const safeNextPath = (next: string | null) =>
  next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : DEFAULT_REDIRECT;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/auth?error=callback`);
}
