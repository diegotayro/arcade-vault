"use server";

import { updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { GAMES_CACHE_TAG } from "@/lib/games-source";
import { LEADERBOARD_CACHE_TAG } from "@/lib/leaderboard";
import { isValidPlayerName, isValidScore } from "@/lib/score-rules";

export type SaveScoreResult =
  { ok: true } | { ok: false; reason?: "unauthenticated" };

const FAILURE: SaveScoreResult = { ok: false };
const UNAUTHENTICATED: SaveScoreResult = {
  ok: false,
  reason: "unauthenticated",
};

// Server Action: se puede invocar con un POST directo, por eso se valida todo el input
export async function saveScore(
  gameId: string,
  playerName: string,
  score: number,
): Promise<SaveScoreResult> {
  if (typeof gameId !== "string" || typeof playerName !== "string")
    return FAILURE;

  const trimmedName = playerName.trim();
  if (!isValidPlayerName(trimmedName) || !isValidScore(score)) return FAILURE;

  try {
    const supabase = await createClient();
    // El user_id sale siempre de la sesión del servidor, nunca del cliente
    const { data } = await supabase.auth.getUser();
    if (!data.user) return UNAUTHENTICATED;

    const { error } = await supabase.from("leaderboard").insert({
      game_id: gameId,
      player_name: trimmedName,
      score,
      user_id: data.user.id,
    });

    if (error) return FAILURE;
  } catch {
    return FAILURE;
  }

  // El ranking y el mejor puntaje del catálogo cambian con cada puntaje
  updateTag(LEADERBOARD_CACHE_TAG);
  updateTag(GAMES_CACHE_TAG);
  return { ok: true };
}
