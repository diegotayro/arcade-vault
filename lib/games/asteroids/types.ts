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
}

export type AsteroidsState = "playing" | "dead" | "gameover";

export type AsteroidSize = 1 | 2 | 3;
