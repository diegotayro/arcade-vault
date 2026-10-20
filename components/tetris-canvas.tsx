"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

import { HEIGHT, WIDTH } from "@/lib/games/tetris/constants";
import { createTetrisEngine } from "@/lib/games/tetris/engine";
import type {
  TetrisCallbacks,
  TetrisEngine,
  TetrisTheme,
} from "@/lib/games/tetris/types";

export interface TetrisCanvasHandle {
  endGame: () => void;
  restart: () => void;
}

interface TetrisCanvasProps extends TetrisCallbacks {
  isPaused: boolean;
  theme: TetrisTheme;
  ref?: Ref<TetrisCanvasHandle>;
}

export function TetrisCanvas({
  isPaused,
  theme,
  ref,
  onScoreChange,
  onLevelChange,
  onPauseChange,
  onGameOver,
}: TetrisCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<TetrisEngine | null>(null);
  const callbacksRef = useRef<TetrisCallbacks>({
    onScoreChange,
    onLevelChange,
    onPauseChange,
    onGameOver,
  });

  // El motor se crea una sola vez; los callbacks siempre apuntan a la última versión
  useEffect(() => {
    callbacksRef.current = {
      onScoreChange,
      onLevelChange,
      onPauseChange,
      onGameOver,
    };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createTetrisEngine(canvas, {
      onScoreChange: (score) => callbacksRef.current.onScoreChange(score),
      onLevelChange: (level) => callbacksRef.current.onLevelChange(level),
      onPauseChange: (paused) => callbacksRef.current.onPauseChange(paused),
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
    engineRef.current?.setTheme(theme);
  }, [theme]);

  // El motor ignora pause/resume redundantes, así que no hay bucle con onPauseChange
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
      className="tetris-canvas"
      width={WIDTH}
      height={HEIGHT}
      aria-label="Juego Tetris"
    />
  );
}
