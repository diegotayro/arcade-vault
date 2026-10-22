import type { SkinId } from "@/lib/games/skins";

export interface SnakeCallbacks {
  onScoreChange: (score: number) => void;
  onLevelChange: (level: number) => void;
  onPauseChange: (isPaused: boolean) => void;
  onGameOver: (finalScore: number) => void;
}

export interface SnakeEngine {
  start: () => void; // carga el spritesheet e inicia el loop y los listeners
  pause: () => void;
  resume: () => void;
  endGame: () => void; // fuerza game over (botón FIN)
  restart: () => void;
  destroy: () => void; // cancela rAF y quita listeners
  setSkin: (skin: SnakeSkin) => void;
}

export type SnakeState = "playing" | "gameover" | "win";

export type Direction = "up" | "down" | "left" | "right";

export interface Cell {
  col: number;
  row: number;
}

export type SnakeSkin = SkinId;
export type DrawStyle = "classic" | "glow" | "soft" | "pixel";

export type Rgb = readonly [number, number, number];

export interface FruitColors {
  fill: string;
  line: string;
  leaf: string;
}

export interface SkinDefinition {
  drawStyle: DrawStyle;
  background: string;
  grid: string;
  head: Rgb; // el cuerpo degrada de head a tail (en pixel son los 2 tonos)
  tail: Rgb;
  eye: string;
  glow: string | null;
  fruit: FruitColors | null; // null = sprites originales
  overlayBackground: string;
  overlayText: string;
}
