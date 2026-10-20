export interface TetrisCallbacks {
  onScoreChange: (score: number) => void;
  onLevelChange: (level: number) => void;
  onPauseChange: (isPaused: boolean) => void;
  onGameOver: (finalScore: number) => void;
}

export interface TetrisEngine {
  start: () => void; // inicia el loop y los listeners de teclado
  pause: () => void;
  resume: () => void;
  endGame: () => void; // fuerza game over (botón FIN)
  restart: () => void;
  destroy: () => void; // cancela rAF y quita listeners
  setTheme: (theme: TetrisTheme) => void;
}

export type TetrisTheme = "dark" | "light";

export type PieceType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // I O T S Z J L N
export type Cell = 0 | PieceType;
export type Board = Cell[][];

export interface ActivePiece {
  type: PieceType;
  shape: number[][];
  x: number;
  y: number;
}

export interface ThemePalette {
  canvasBackground: string;
  gridLine: string;
  label: string;
  text: string;
  overlayBackground: string;
}
