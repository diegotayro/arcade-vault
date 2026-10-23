import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

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

export const LEADERBOARD_CACHE_TAG = "leaderboard";

// Las funciones cacheadas lanzan ante un error para no cachear un fallo transitorio
async function fetchTopScores(
  gameId: string,
  limit: number,
): Promise<ScoreEntry[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(LEADERBOARD_CACHE_TAG);

  const { data, error } = await createPublicClient()
    .from("leaderboard")
    .select("player_name, score, created_at")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data.map((row, index) => toScoreEntry(row, index + 1));
}

async function fetchAllTopScores(limit: number): Promise<ScoresByGame> {
  "use cache";
  cacheLife("minutes");
  cacheTag(LEADERBOARD_CACHE_TAG);

  const { data, error } = await createPublicClient().rpc("top_scores", {
    p_limit: limit,
  });

  if (error) throw error;

  const scoresByGame: ScoresByGame = {};
  for (const row of data) {
    (scoresByGame[row.game_id] ??= []).push(toScoreEntry(row, row.rank));
  }
  return scoresByGame;
}

export async function getTopScores(
  gameId: string,
  limit: number,
): Promise<ScoreEntry[]> {
  try {
    return await fetchTopScores(gameId, limit);
  } catch {
    return [];
  }
}

export async function getAllTopScores(limit: number): Promise<ScoresByGame> {
  try {
    return await fetchAllTopScores(limit);
  } catch {
    return {};
  }
}
