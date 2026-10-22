"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

import { HEIGHT, WIDTH } from "@/lib/games/asteroids/constants";
import { createAsteroidsEngine } from "@/lib/games/asteroids/engine";
import type {
  AsteroidsCallbacks,
  AsteroidsEngine,
  AsteroidsSkin,
} from "@/lib/games/asteroids/types";

export interface AsteroidsCanvasHandle {
  endGame: () => void;
  restart: () => void;
}

interface AsteroidsCanvasProps extends AsteroidsCallbacks {
  isPaused: boolean;
  skin: AsteroidsSkin;
  ref?: Ref<AsteroidsCanvasHandle>;
}

export function AsteroidsCanvas({
  isPaused,
  skin,
  ref,
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
}: AsteroidsCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AsteroidsEngine | null>(null);
  const callbacksRef = useRef<AsteroidsCallbacks>({
    onScoreChange,
    onLivesChange,
    onLevelChange,
    onGameOver,
  });

  // El motor se crea una sola vez; los callbacks siempre apuntan a la última versión
  useEffect(() => {
    callbacksRef.current = {
      onScoreChange,
      onLivesChange,
      onLevelChange,
      onGameOver,
    };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createAsteroidsEngine(canvas, {
      onScoreChange: (score) => callbacksRef.current.onScoreChange(score),
      onLivesChange: (lives) => callbacksRef.current.onLivesChange(lives),
      onLevelChange: (level) => callbacksRef.current.onLevelChange(level),
      onGameOver: (finalScore) => callbacksRef.current.onGameOver(finalScore),
    });
    engineRef.current = engine;
    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setSkin(skin);
  }, [skin]);

  useEffect(() => {
    if (isPaused) engineRef.current?.pause();
    else engineRef.current?.resume();
  }, [isPaused]);

  useImperativeHandle(ref, () => ({
    endGame: () => engineRef.current?.endGame(),
    restart: () => engineRef.current?.restart(),
  }));

  return (
    <canvas
      ref={canvasRef}
      className="asteroids-canvas"
      width={WIDTH}
      height={HEIGHT}
      aria-label="Juego Asteroides"
    />
  );
}
