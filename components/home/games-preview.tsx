import Link from "next/link";
import { GamesEmptyState } from "@/components/games-empty-state";
import { MiniCard } from "@/components/home/mini-card";
import { Reveal } from "@/components/home/reveal";
import { SectionHead } from "@/components/home/section-head";
import { getGames } from "@/lib/games-source";

const PREVIEW_COUNT = 6;

export async function GamesPreview() {
  const games = await getGames();

  return (
    <Reveal className="home-section">
      <SectionHead
        kicker="// 02"
        title="JUEGOS DISPONIBLES AHORA"
        color="cyan"
      />
      {games.length === 0 ? (
        <GamesEmptyState />
      ) : (
        <div className="mini-rail">
          {games.slice(0, PREVIEW_COUNT).map((game) => (
            <MiniCard key={game.id} game={game} />
          ))}
        </div>
      )}
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Link href="/games" className="btn lg">
          VER TODOS LOS JUEGOS →
        </Link>
      </div>
    </Reveal>
  );
}
