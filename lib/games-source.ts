import type { Game, GameCategory, NeonColor } from "@/lib/games";
import { createClient as createAnonymousClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type CatalogView = Database["public"]["Views"]["games_catalog"]["Row"];
type CatalogRow = {
  [Column in keyof CatalogView]: NonNullable<CatalogView[Column]>;
};

const PLAYS_PER_THOUSAND = 1000;
const PLACEHOLDER_GAME_ID = "__placeholder__";

function formatPlays(playsCount: number): string {
  if (playsCount < PLAYS_PER_THOUSAND) return String(playsCount);
  return `${(playsCount / PLAYS_PER_THOUSAND).toFixed(1)}K`;
}

function toGame(row: CatalogRow): Game {
  return {
    id: row.id,
    title: row.title,
    short: row.short,
    long: row.long,
    category: row.category as GameCategory,
    cover: row.cover,
    color: row.color as NeonColor,
    best: row.best,
    plays: formatPlays(row.plays_count),
  };
}

export async function getGames(): Promise<Game[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("games_catalog")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) return [];
    return (data as CatalogRow[]).map(toGame);
  } catch {
    return [];
  }
}

export async function getGame(id: string): Promise<Game | undefined> {
  const games = await getGames();
  return games.find((game) => game.id === id);
}

// Sin cookies: generateStaticParams corre en build, fuera de una request.
// Cache Components exige al menos un param, así que si no hay juegos se
// devuelve un placeholder que las páginas resuelven con notFound().
export async function getGameStaticParams(): Promise<{ id: string }[]> {
  try {
    const supabase = createAnonymousClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
    const { data, error } = await supabase.from("games_catalog").select("id");

    const params = error ? [] : (data ?? []).map(({ id }) => ({ id: id! }));
    return params.length > 0 ? params : [{ id: PLACEHOLDER_GAME_ID }];
  } catch {
    return [{ id: PLACEHOLDER_GAME_ID }];
  }
}
