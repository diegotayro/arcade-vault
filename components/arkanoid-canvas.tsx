"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/games/arkanoid/constants";
import { createArkanoidEngine } from "@/lib/games/arkanoid/engine";
import type {
  ArkanoidCallbacks,
  ArkanoidEngine,
  ArkanoidSkin,
} from "@/lib/games/arkanoid/types";

export interface ArkanoidCanvasHandle {
  endGame: () => void;
  restart: () => void;
}

interface ArkanoidCanvasProps extends ArkanoidCallbacks {
  isPaused: boolean;
  skin: ArkanoidSkin;
  ref?: Ref<ArkanoidCanvasHandle>;
}

export function ArkanoidCanvas({
  isPaused,
  skin,
  ref,
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onPauseChange,
  onGameOver,
}: ArkanoidCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ArkanoidEngine | null>(null);
  const callbacksRef = useRef<ArkanoidCallbacks>({
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

    const engine = createArkanoidEngine(canvas, {
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

  // Se declara tras crear el motor: también aplica la skin inicial
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
      className="arkanoid-canvas"
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      aria-label="Juego Arkanoid"
    />
  );
}
