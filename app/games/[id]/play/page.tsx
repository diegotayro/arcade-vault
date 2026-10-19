import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GamePlayer } from "@/components/game-player";
import { getGame, getGameStaticParams } from "@/lib/games-source";

export async function generateStaticParams() {
  return getGameStaticParams();
}

export async function generateMetadata({ params }: PageProps<"/games/[id]/play">): Promise<Metadata> {
  const { id } = await params;
  const game = await getGame(id);
  return { title: game ? `Jugando ${game.title}` : undefined };
}

async function Player({ params }: Pick<PageProps<"/games/[id]/play">, "params">) {
  const { id } = await params;
  const game = await getGame(id);
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
