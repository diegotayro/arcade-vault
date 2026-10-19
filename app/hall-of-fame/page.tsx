import type { Metadata } from "next";
import { Suspense } from "react";
import { HallOfFame } from "@/components/hall-of-fame";
import { getGames } from "@/lib/games-source";
import { getAllTopScores } from "@/lib/leaderboard";

const ROWS_COUNT = 12;

export const metadata: Metadata = { title: "Salón de la Fama" };

async function HallOfFameContent() {
  const [games, scoresByGame] = await Promise.all([
    getGames(),
    getAllTopScores(ROWS_COUNT),
  ]);

  return <HallOfFame games={games} scoresByGame={scoresByGame} />;
}

export default function HallOfFamePage() {
  return (
    <Suspense fallback={<div className="av-hall" aria-busy="true" />}>
      <HallOfFameContent />
    </Suspense>
  );
}
