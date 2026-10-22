import type { SkinId } from "@/lib/games/skins";

export interface AsteroidsCallbacks {
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

export interface AsteroidsEngine {
  start: () => void; // inicia el loop y los listeners de teclado
  pause: () => void;
  resume: () => void;
  endGame: () => void; // fuerza game over (botón FIN)
  restart: () => void;
  destroy: () => void; // cancela rAF y quita listeners
  setSkin: (skin: AsteroidsSkin) => void;
}

export type AsteroidsState = "playing" | "dead" | "gameover";

export type AsteroidSize = 1 | 2 | 3;

export type AsteroidsSkin = SkinId;
export type DrawStyle = "vector" | "glow" | "soft" | "pixel";

export interface EntityColors {
  line: string;
  fill: string | null; // null = solo contorno
}

export interface SkinDefinition {
  drawStyle: DrawStyle;
  background: string;
  ship: EntityColors;
  thrust: string;
  asteroid: EntityColors;
  bullet: string;
  powerUp: EntityColors;
  particle: string;
  text: string;
  textDim: string;
  overlayBackground: string | null;
}
