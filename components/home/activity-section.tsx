import Link from "next/link";
import { Reveal } from "@/components/home/reveal";
import { SectionHead } from "@/components/home/section-head";
import { RECENT_SCORES, TOP_PLAYERS } from "@/lib/home";

const TICK_DELAY_MS = 60;
const BAR_STEP_PERCENT = 16;
const PODIUM_CLASSES = ["top1", "top2", "top3"];

const formatScore = (score: number) => score.toLocaleString("es-ES");

function RecentScoresCard() {
  return (
    <div className="activity-card">
      <div className="ac-head">
        <div className="ac-title pixel">▸ ÚLTIMAS PUNTUACIONES</div>
      </div>
      <div className="ticker">
        {RECENT_SCORES.map((entry, index) => (
          <div
            key={entry.player}
            className="tick-row"
            style={{ animationDelay: `${index * TICK_DELAY_MS}ms` }}
          >
            <span className={`tk-p neon-${entry.color}`}>{entry.player}</span>
            <span className="tk-mid">▸ {entry.gameTitle}</span>
            <span className="tk-s">+{formatScore(entry.score)}</span>
            <span className="tk-t">{entry.timeAgo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopPlayersCard() {
  return (
    <div className="activity-card">
      <div className="ac-head">
        <div className="ac-title pixel neon-magenta">▸ TOP JUGADORES · HOY</div>
        <Link href="/hall-of-fame" className="lb-link">VER SALÓN →</Link>
      </div>
      <div className="top-list">
        {TOP_PLAYERS.map((entry, index) => (
          <div key={entry.player} className={`top-row ${PODIUM_CLASSES[index] ?? ""}`.trim()}>
            <span className="tp-rk">#{String(entry.rank).padStart(2, "0")}</span>
            <span className="tp-bar">
              <span className="tp-fill" style={{ width: `${100 - index * BAR_STEP_PERCENT}%` }}></span>
            </span>
            <span className="tp-p">{entry.player}</span>
            <span className="tp-s">{formatScore(entry.score)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivitySection() {
  return (
    <Reveal className="home-section">
      <SectionHead kicker="// 03" title="ACTIVIDAD EN VIVO" color="yellow" />
      <div className="activity-grid">
        <RecentScoresCard />
        <TopPlayersCard />
      </div>
    </Reveal>
  );
}
