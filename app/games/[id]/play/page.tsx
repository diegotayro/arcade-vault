import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
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

async function Player({ params }: Pick<PageProps<"/games/[id]/play">, "params">) {
  const { id } = await params;
  const game = findGame(id);
  if (!game) notFound();

  return <GamePlayer gameId={game.id} gameTitle={game.title} />;
}

function PlayerSkeleton() {
  return (
    <div className="av-player" aria-busy="true">
      <div className="player-hud" />
      <div className="crt">
        <div className="crt-screen" />
      </div>
    </div>
  );
}

export default function PlayPage({ params }: PageProps<"/games/[id]/play">) {
  return (
    <Suspense fallback={<PlayerSkeleton />}>
      <Player params={params} />
    </Suspense>
  );
}
