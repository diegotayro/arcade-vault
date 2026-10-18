import Link from "next/link";
import { MiniCard } from "@/components/home/mini-card";
import { Reveal } from "@/components/home/reveal";
import { SectionHead } from "@/components/home/section-head";
import { GAMES } from "@/lib/games";

const PREVIEW_COUNT = 6;

export function GamesPreview() {
  return (
    <Reveal className="home-section">
      <SectionHead kicker="// 02" title="JUEGOS DISPONIBLES AHORA" color="cyan" />
      <div className="mini-rail">
        {GAMES.slice(0, PREVIEW_COUNT).map((game) => (
          <MiniCard key={game.id} game={game} />
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Link href="/games" className="btn lg">VER TODOS LOS JUEGOS →</Link>
      </div>
    </Reveal>
  );
}
