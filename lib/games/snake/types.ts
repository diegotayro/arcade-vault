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
}

export type SnakeState = "playing" | "gameover" | "win";

export type Direction = "up" | "down" | "left" | "right";

export interface Cell {
  col: number;
  row: number;
}
