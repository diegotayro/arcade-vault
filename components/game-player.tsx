"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import { saveScore } from "@/app/games/[id]/play/actions";
import { ArkanoidCanvas } from "@/components/arkanoid-canvas";
import { AsteroidsCanvas } from "@/components/asteroids-canvas";
import { SnakeCanvas } from "@/components/snake-canvas";
import { TetrisCanvas } from "@/components/tetris-canvas";
import { MIN_PLAYER_NAME_LENGTH } from "@/lib/score-rules";
import {
  DEFAULT_SKIN_ID,
  SKIN_IDS,
  SKIN_LABELS,
  isSkinId,
  skinStorageKey,
  type SkinId,
} from "@/lib/games/skins";

const INITIAL_LIVES = 3;
const MAX_NAME_LENGTH = 10;
const INVALID_NAME_MESSAGE = `El nombre debe tener entre ${MIN_PLAYER_NAME_LENGTH} y ${MAX_NAME_LENGTH} caracteres.`;
const SAVE_FAILED_MESSAGE =
  "No se pudo guardar la puntuación. Inténtalo de nuevo.";
const SCORE_TICK_MS = 220;
const POINTS_PER_LEVEL = 2500;

const REAL_GAMES = {
  asteroids: { hasLives: true, hasSkinSelector: true },
  tetris: { hasLives: false, hasSkinSelector: true },
  arkanoid: { hasLives: true, hasSkinSelector: false },
  snake: { hasLives: false, hasSkinSelector: false },
} as const;

type RealGameId = keyof typeof REAL_GAMES;

const isRealGameId = (gameId: string): gameId is RealGameId =>
  gameId in REAL_GAMES;

interface GameHandle {
  endGame: () => void;
  restart: () => void;
}

interface GamePlayerProps {
  gameId: string;
  gameTitle: string;
}

const randomPoints = () => Math.floor(10 + Math.random() * 90);

export function GamePlayer({ gameId, gameTitle }: GamePlayerProps) {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [engineLevel, setEngineLevel] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const [name, setName] = useState("INVITADO");
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [skin, setSkin] = useState<SkinId>(DEFAULT_SKIN_ID);
  const [isSaving, startSaving] = useTransition();

  const gameRef = useRef<GameHandle>(null);
  const realGame = isRealGameId(gameId) ? REAL_GAMES[gameId] : null;
  const isRealGame = realGame !== null;
  const showsFixedLife = realGame !== null && !realGame.hasLives;

  const level = isRealGame
    ? engineLevel
    : 1 + Math.floor(score / POINTS_PER_LEVEL);

  // La preferencia se lee tras montar para no romper la hidratación
  useEffect(() => {
    try {
      const storedSkin = localStorage.getItem(skinStorageKey(gameId));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura de localStorage tras la hidratación
      setSkin(isSkinId(storedSkin) ? storedSkin : DEFAULT_SKIN_ID);
    } catch {
      // Sin localStorage el juego sigue con la skin por defecto
    }
  }, [gameId]);

  useEffect(() => {
    if (isRealGame || isOver || isPaused) return;
    const timer = setInterval(
      () => setScore((current) => current + randomPoints()),
      SCORE_TICK_MS,
    );
    return () => clearInterval(timer);
  }, [isRealGame, isOver, isPaused]);

  const handleLivesChange = (value: number) => {
    setLives(value);
    // Un reinicio con Espacio devuelve las vidas: cierra el modal de fin
    if (value > 0) {
      setIsOver(false);
      setIsSaved(false);
      setSaveError(null);
    }
  };

  const changeSkin = (nextSkin: string) => {
    if (!isSkinId(nextSkin)) return;
    setSkin(nextSkin);
    try {
      localStorage.setItem(skinStorageKey(gameId), nextSkin);
    } catch {
      // La preferencia es solo un conveniente por navegador
    }
  };

  const endGame = () => {
    if (isRealGame) gameRef.current?.endGame();
    else setIsOver(true);
  };

  const handleSave = () => {
    if (!isRealGame) {
      setIsSaved(true);
      return;
    }

    const trimmedName = name.trim();
    if (trimmedName.length < MIN_PLAYER_NAME_LENGTH) {
      setSaveError(INVALID_NAME_MESSAGE);
      return;
    }

    setSaveError(null);
    startSaving(async () => {
      const result = await saveScore(gameId, trimmedName, score);
      if (result.ok) setIsSaved(true);
      else setSaveError(SAVE_FAILED_MESSAGE);
    });
  };

  const restart = () => {
    gameRef.current?.restart();
    setScore(0);
    setIsPaused(false);
    setIsOver(false);
    setIsSaved(false);
    setSaveError(null);
  };

  const renderGame = () => {
    switch (gameId) {
      case "asteroids":
        return (
          <AsteroidsCanvas
            ref={gameRef}
            isPaused={isPaused}
            skin={skin}
            onScoreChange={setScore}
            onLivesChange={handleLivesChange}
            onLevelChange={setEngineLevel}
            onGameOver={() => setIsOver(true)}
          />
        );
      case "tetris":
        return (
          <TetrisCanvas
            ref={gameRef}
            isPaused={isPaused}
            skin={skin}
            onScoreChange={setScore}
            onLevelChange={setEngineLevel}
            onPauseChange={setIsPaused}
            onGameOver={() => setIsOver(true)}
          />
        );
      case "arkanoid":
        return (
          <ArkanoidCanvas
            ref={gameRef}
            isPaused={isPaused}
            onScoreChange={setScore}
            onLivesChange={handleLivesChange}
            onLevelChange={setEngineLevel}
            onPauseChange={setIsPaused}
            onGameOver={() => setIsOver(true)}
          />
        );
      case "snake":
        return (
          <SnakeCanvas
            ref={gameRef}
            isPaused={isPaused}
            onScoreChange={setScore}
            onLevelChange={setEngineLevel}
            onPauseChange={setIsPaused}
            onGameOver={() => setIsOver(true)}
          />
        );
      default:
        return (
          <div className="game-arena">
            <div className="grid-floor"></div>
            <div className="enemy e1"></div>
            <div className="enemy e2"></div>
            <div className="enemy e3"></div>
            <div className="player-ship"></div>
          </div>
        );
    }
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {name}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString("es-ES")}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">
              {showsFixedLife ? "♥" : "♥ ".repeat(lives).trim() || "—"}
            </div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, "0")}</div>
          </div>
          {realGame?.hasSkinSelector && (
            <div className="hud-stat skin">
              <label className="l" htmlFor="game-skin">
                Skin
              </label>
              <select
                id="game-skin"
                className="skin-select"
                value={skin}
                onChange={(event) => changeSkin(event.target.value)}
              >
                {SKIN_IDS.map((option) => (
                  <option key={option} value={option}>
                    {SKIN_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="hud-actions">
          <button
            type="button"
            className="btn yellow"
            onClick={() => setIsPaused((paused) => !paused)}
          >
            {isPaused ? "REANUDAR" : "PAUSA"}
          </button>
          <button type="button" className="btn magenta" onClick={endGame}>
            FIN
          </button>
          <Link href={`/games/${gameId}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          {renderGame()}
          {isPaused && (
            <div
              className="crt-content"
              style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}
            >
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    marginTop: 10,
                    letterSpacing: "0.16em",
                  }}
                >
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
                  onChange={(event) =>
                    setName(
                      event.target.value
                        .toUpperCase()
                        .slice(0, MAX_NAME_LENGTH),
                    )
                  }
                  placeholder="TUS INICIALES"
                />
                <button
                  type="button"
                  className="btn yellow"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "GUARDANDO…" : "GUARDAR PUNTUACIÓN"}
                </button>
              </div>
            )}
            {saveError && (
              <div
                role="alert"
                className="mono"
                style={{ color: "var(--magenta)", fontSize: 12, marginTop: 12 }}
              >
                {saveError}
              </div>
            )}
            <div className="actions">
              <button type="button" className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <Link href="/games" className="btn magenta">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
