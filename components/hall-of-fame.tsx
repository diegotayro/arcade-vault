"use client";

import Link from "next/link";
import { useState } from "react";
import { EMPTY_LEADERBOARD_MESSAGE } from "@/components/leaderboard-empty-row";
import type { Game } from "@/lib/games";
import type { ScoreEntry, ScoresByGame } from "@/lib/leaderboard";

const PODIUM_CLASSES = ["top1", "top2", "top3"];

const formatRank = (rank: number) => String(rank).padStart(2, "0");

interface PodiumSlotProps {
  variant: "gold" | "silver" | "bronze";
  rank: number;
  entry?: ScoreEntry;
}

function PodiumSlot({ variant, rank, entry }: PodiumSlotProps) {
  const isGold = variant === "gold";

  return (
    <div className={`podium-slot ${variant}${entry ? "" : " empty"}`}>
      {isGold && entry && (
        <div className="pixel" style={{ fontSize: 9, color: "var(--gold)", letterSpacing: "0.18em" }}>
          CAMPEÓN
        </div>
      )}
      <div className="rank-num" style={isGold ? { fontSize: 36, marginTop: 4 } : undefined}>
        {formatRank(rank)}
      </div>
      <div className="name">{entry?.name ?? "---"}</div>
      <div className="score" style={isGold ? { fontSize: 20 } : undefined}>
        {entry ? entry.score.toLocaleString("es-ES") : "---"}
      </div>
      {entry && <div className="date">{entry.date}</div>}
    </div>
  );
}

interface HallOfFameProps {
  games: Game[];
  scoresByGame: ScoresByGame;
}

export function HallOfFame({ games, scoresByGame }: HallOfFameProps) {
  const [selectedId, setSelectedId] = useState(games[0].id);
  const rows = scoresByGame[selectedId] ?? [];
  const [first, second, third] = rows;

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA</p>
      </div>

      <div className="hall-tabs">
        {games.map((game) => (
          <button
            key={game.id}
            type="button"
            className={"chip" + (selectedId === game.id ? " active" : "")}
            onClick={() => setSelectedId(game.id)}
          >
            {game.title}
          </button>
        ))}
      </div>

      <div className="podium">
        <PodiumSlot variant="silver" rank={2} entry={second} />
        <PodiumSlot variant="gold" rank={1} entry={first} />
        <PodiumSlot variant="bronze" rank={3} entry={third} />
      </div>

      <div className="hall-table">
        <div className="th">
          <div>RANGO</div>
          <div>JUGADOR</div>
          <div>PUNTUACIÓN</div>
          <div>FECHA</div>
        </div>
        {rows.length === 0 && (
          <div className="tr hall-empty">{EMPTY_LEADERBOARD_MESSAGE}</div>
        )}
        {rows.map((entry, index) => (
          <div
            key={entry.rank}
            className={["tr", PODIUM_CLASSES[index]].filter(Boolean).join(" ")}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="rk">#{formatRank(entry.rank)}</div>
            <div className="pl">{entry.name}</div>
            <div className="sc">{entry.score.toLocaleString("es-ES")}</div>
            <div className="dt">{entry.date}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/games" className="btn lg">VOLVER A LA BIBLIOTECA</Link>
      </div>
    </div>
  );
}
