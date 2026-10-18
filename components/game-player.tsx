"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const INITIAL_LIVES = 3;
const MAX_NAME_LENGTH = 10;
const SCORE_TICK_MS = 220;
const POINTS_PER_LEVEL = 2500;

interface GamePlayerProps {
  gameId: string;
  gameTitle: string;
}

const randomPoints = () => Math.floor(10 + Math.random() * 90);

export function GamePlayer({ gameId, gameTitle }: GamePlayerProps) {
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const [name, setName] = useState("INVITADO");
  const [isSaved, setIsSaved] = useState(false);

  const level = 1 + Math.floor(score / POINTS_PER_LEVEL);
  const lives = INITIAL_LIVES;

  useEffect(() => {
    if (isOver || isPaused) return;
    const timer = setInterval(() => setScore((current) => current + randomPoints()), SCORE_TICK_MS);
    return () => clearInterval(timer);
  }, [isOver, isPaused]);

  const restart = () => {
    setScore(0);
    setIsPaused(false);
    setIsOver(false);
    setIsSaved(false);
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>{name}</div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString("es-ES")}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">{"♥ ".repeat(lives).trim() || "—"}</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, "0")}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button type="button" className="btn yellow" onClick={() => setIsPaused((paused) => !paused)}>
            {isPaused ? "REANUDAR" : "PAUSA"}
          </button>
          <button type="button" className="btn magenta" onClick={() => setIsOver(true)}>FIN</button>
          <Link href={`/games/${gameId}`} className="btn ghost">SALIR</Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          <div className="game-arena">
            <div className="grid-floor"></div>
            <div className="enemy e1"></div>
            <div className="enemy e2"></div>
            <div className="enemy e3"></div>
            <div className="player-ship"></div>
          </div>
          {isPaused && (
            <div className="crt-content" style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}>
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>EN PAUSA</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 10, letterSpacing: "0.16em" }}>
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{gameTitle} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {isOver && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {isSaved ? (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            ) : (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value.toUpperCase().slice(0, MAX_NAME_LENGTH))}
                  placeholder="TUS INICIALES"
                />
                <button type="button" className="btn yellow" onClick={() => setIsSaved(true)}>
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            )}
            <div className="actions">
              <button type="button" className="btn" onClick={restart}>JUGAR DE NUEVO</button>
              <Link href="/games" className="btn magenta">VOLVER AL VAULT</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
