"use client";

import { useState } from "react";
import { CATEGORIES, type Game } from "@/lib/games";
import { GameCard } from "./game-card";

type CategoryFilter = (typeof CATEGORIES)[number];

export function Library({ games }: { games: Game[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("TODOS");

  const normalizedQuery = query.toLowerCase();
  const filteredGames = games.filter(
    (game) =>
      (category === "TODOS" || game.category === category) &&
      game.title.toLowerCase().includes(normalizedQuery),
  );

  return (
    <div className="fade-in">
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <div className="sub">
          INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span>
        </div>
      </section>

      <div className="av-filters">
        <div className="av-search">
          <span className="ico">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar un juego por nombre…"
          />
        </div>
        <div className="av-chips">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              className={"chip" + (category === item ? " active" : "")}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="av-grid">
        {filteredGames.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
        {filteredGames.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 80, color: "var(--ink-faint)" }}>
            <div className="pixel" style={{ fontSize: 14, color: "var(--magenta)", marginBottom: 12 }}>
              NO HAY RESULTADOS
            </div>
            <div>Intenta otra búsqueda o categoría.</div>
          </div>
        )}
      </div>
    </div>
  );
}
