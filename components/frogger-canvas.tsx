"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/games/frogger/constants";
import { createFroggerEngine } from "@/lib/games/frogger/engine";
import type {
  FroggerCallbacks,
  FroggerEngine,
  FroggerSkin,
} from "@/lib/games/frogger/types";

export interface FroggerCanvasHandle {
  endGame: () => void;
  restart: () => void;
}

interface FroggerCanvasProps extends FroggerCallbacks {
  isPaused: boolean;
  skin: FroggerSkin;
  ref?: Ref<FroggerCanvasHandle>;
}

export function FroggerCanvas({
  isPaused,
  skin,
  ref,
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onPauseChange,
  onGameOver,
}: FroggerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FroggerEngine | null>(null);
  const callbacksRef = useRef<FroggerCallbacks>({
    onScoreChange,
    onLivesChange,
    onLevelChange,
    onPauseChange,
    onGameOver,
  });

  // El motor se crea una sola vez; los callbacks siempre apuntan a la última versión
  useEffect(() => {
    callbacksRef.current = {
      onScoreChange,
      onLivesChange,
      onLevelChange,
      onPauseChange,
      onGameOver,
    };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createFroggerEngine(canvas, {
      onScoreChange: (score) => callbacksRef.current.onScoreChange(score),
      onLivesChange: (lives) => callbacksRef.current.onLivesChange(lives),
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
      className="frogger-canvas"
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      aria-label="Juego Frogger"
    />
  );
}
