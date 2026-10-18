"use client";

import Link from "next/link";
import { useRef, type MouseEvent } from "react";
import type { Game, NeonColor } from "@/lib/games";

const BUTTON_CLASS_BY_COLOR: Partial<Record<NeonColor, string>> = {
  magenta: "magenta",
  yellow: "yellow",
};

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);

  const handleMouseMove = (event: MouseEvent<HTMLAnchorElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
    const offsetY = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `translateY(-6px) rotateX(${-offsetY * 6}deg) rotateY(${offsetX * 8}deg)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = "";
  };

  const buttonClass = ["btn", BUTTON_CLASS_BY_COLOR[game.color]].filter(Boolean).join(" ");

  return (
    <Link
      ref={cardRef}
      href={`/games/${game.id}`}
      className="card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="cover">
        <div className={"cover-bg " + game.cover}></div>
        <div className="label">{game.category}</div>
      </div>
      <div className="meta">
        <div className="title">{game.title}</div>
        <div className="desc">{game.short}</div>
        <div className="row">
          <div className="score-badge">
            <span>MEJOR PUNTUACIÓN</span>
            <b>{game.best.toLocaleString("es-ES")}</b>
          </div>
          <span className={buttonClass}>JUGAR</span>
        </div>
      </div>
    </Link>
  );
}
