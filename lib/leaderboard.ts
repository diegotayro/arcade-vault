import { createClient } from "@/lib/supabase/server";

export interface ScoreEntry {
  rank: number;
  name: string;
  score: number;
  date: string; // dd/mm/yyyy
}

export type ScoresByGame = Record<string, ScoreEntry[]>;

interface ScoreRow {
  player_name: string;
  score: number;
  created_at: string;
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function toScoreEntry(row: ScoreRow, rank: number): ScoreEntry {
  return {
    rank,
    name: row.player_name,
    score: row.score,
    date: formatDate(row.created_at),
  };
}

export async function getTopScores(
  gameId: string,
  limit: number,
): Promise<ScoreEntry[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("leaderboard")
      .select("player_name, score, created_at")
      .eq("game_id", gameId)
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) return [];
    return data.map((row, index) => toScoreEntry(row, index + 1));
  } catch {
    return [];
  }
}

export async function getAllTopScores(limit: number): Promise<ScoresByGame> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("top_scores", {
      p_limit: limit,
    });

    if (error) return {};

    const scoresByGame: ScoresByGame = {};
    for (const row of data) {
      (scoresByGame[row.game_id] ??= []).push(toScoreEntry(row, row.rank));
    }
    return scoresByGame;
  } catch {
    return {};
  }
}
