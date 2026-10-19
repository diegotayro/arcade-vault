import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("health_check");

    if (error || data !== "ok") {
      return Response.json({ status: "error" }, { status: 503 });
    }

    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "error" }, { status: 503 });
  }
}
