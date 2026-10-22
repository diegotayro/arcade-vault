import type { SkinId } from "@/lib/games/skins";

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
  setSkin: (skin: TetrisSkin) => void;
}

export type TetrisSkin = SkinId;
export type BlockStyle = "bevel" | "glow" | "soft" | "pixel";

export type PieceType = 1 | 2 | 3 | 4 | 5 | 6 | 7; // I O T S Z J L
export type Cell = 0 | PieceType;
export type Board = Cell[][];

export interface ActivePiece {
  type: PieceType;
  shape: number[][];
  x: number;
  y: number;
}

export interface SkinDefinition {
  pieceColors: readonly (string | null)[]; // índice 0 vacío, 1..7
  canvasBackground: string;
  gridLine: string;
  labelText: string;
  text: string;
  overlayBackground: string;
  blockStyle: BlockStyle;
}
