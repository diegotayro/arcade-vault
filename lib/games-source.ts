import {
  GAMES,
  type Game,
  type GameCategory,
  type NeonColor,
} from "@/lib/games";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type CatalogView = Database["public"]["Views"]["games_catalog"]["Row"];
type CatalogRow = {
  [Column in keyof CatalogView]: NonNullable<CatalogView[Column]>;
};

const PLAYS_PER_THOUSAND = 1000;

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

async function getCatalogGames(): Promise<Game[]> {
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

export async function getGames(): Promise<Game[]> {
  const catalogGames = await getCatalogGames();
  const catalogIds = new Set(catalogGames.map((game) => game.id));
  const mockGames = GAMES.filter((game) => !catalogIds.has(game.id));
  return [...mockGames, ...catalogGames];
}

export async function getGame(id: string): Promise<Game | undefined> {
  const games = await getGames();
  return games.find((game) => game.id === id);
}
