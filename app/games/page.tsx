import type { Metadata } from "next";
import { Suspense } from "react";
import { Library } from "@/components/library";
import { getGames } from "@/lib/games-source";

export const metadata: Metadata = { title: "Biblioteca" };

async function GamesLibrary() {
  const games = await getGames();
  return <Library games={games} />;
}

export default function GamesPage() {
  return (
    <Suspense fallback={<div aria-busy="true" />}>
      <GamesLibrary />
    </Suspense>
  );
}
