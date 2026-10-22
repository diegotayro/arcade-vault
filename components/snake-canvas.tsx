"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/games/snake/constants";
import { createSnakeEngine } from "@/lib/games/snake/engine";
import type {
  SnakeCallbacks,
  SnakeEngine,
  SnakeSkin,
} from "@/lib/games/snake/types";

export interface SnakeCanvasHandle {
  endGame: () => void;
  restart: () => void;
}

interface SnakeCanvasProps extends SnakeCallbacks {
  isPaused: boolean;
  skin: SnakeSkin;
  ref?: Ref<SnakeCanvasHandle>;
}

export function SnakeCanvas({
  isPaused,
  skin,
  ref,
  onScoreChange,
  onLevelChange,
  onPauseChange,
  onGameOver,
}: SnakeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SnakeEngine | null>(null);
  const callbacksRef = useRef<SnakeCallbacks>({
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

    const engine = createSnakeEngine(canvas, {
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
    engineRef.current?.setSkin(skin);
  }, [skin]);

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
      className="snake-canvas"
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      aria-label="Juego Snake"
    />
  );
}
