import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GamePlayer } from "@/components/game-player";
import { GAMES, findGame } from "@/lib/games";

export function generateStaticParams() {
  return GAMES.map((game) => ({ id: game.id }));
}

export async function generateMetadata({ params }: PageProps<"/games/[id]/play">): Promise<Metadata> {
  const { id } = await params;
  const game = findGame(id);
  return { title: game ? `Jugando ${game.title}` : undefined };
}

export default async function PlayPage({ params }: PageProps<"/games/[id]/play">) {
  const { id } = await params;
  const game = findGame(id);
  if (!game) notFound();

  return <GamePlayer gameId={game.id} gameTitle={game.title} />;
}
