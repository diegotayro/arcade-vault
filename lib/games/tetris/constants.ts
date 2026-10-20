import type { ThemePalette, TetrisTheme } from "./types";

export const COLS = 10;
export const ROWS = 20;
export const BLOCK = 30;

// Canvas único: tablero centrado y panel lateral a su derecha
export const WIDTH = 600;
export const HEIGHT = 600;
export const BOARD_WIDTH = COLS * BLOCK;
export const BOARD_HEIGHT = ROWS * BLOCK;
export const BOARD_X = (WIDTH - BOARD_WIDTH) / 2;
export const PANEL_X = BOARD_X + BOARD_WIDTH;
export const PANEL_WIDTH = WIDTH - PANEL_X;

export const PIECE_TYPES_COUNT = 8;

// Indexados por tipo de pieza (índice 0 vacío)
export const COLORS = [
  null,
  "#4dd0e1", // I - cyan
  "#ffd54f", // O - yellow
  "#ba68c8", // T - purple
  "#81c784", // S - green
  "#e57373", // Z - red
  "#90caf9", // J - pale blue
  "#ffb74d", // L - orange
  "#9e9e9e", // N - tuerca (gris metálico)
] as const;

export const PIECES: readonly (readonly (readonly number[])[] | null)[] = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
  [
    [8, 8, 8],
    [8, 0, 8],
    [8, 8, 8],
  ], // N (tuerca)
];

export const WALL_KICKS = [0, -1, 1, -2, 2] as const;

export const LINE_SCORES = [0, 100, 300, 500, 800] as const;
export const SOFT_DROP_POINTS = 1;
export const HARD_DROP_POINTS = 2;
export const LINES_PER_LEVEL = 10;

export const BASE_DROP_INTERVAL = 1000;
export const DROP_INTERVAL_STEP = 90;
export const MIN_DROP_INTERVAL = 100;

export const GHOST_ALPHA = 0.2;

export const THEMES: Record<TetrisTheme, ThemePalette> = {
  dark: {
    canvasBackground: "#1a1a25",
    gridLine: "#22222e",
    label: "#555570",
    text: "#e0e0e0",
    overlayBackground: "rgba(10, 10, 20, 0.75)",
  },
  light: {
    canvasBackground: "#e4e4f0",
    gridLine: "#c8c8dc",
    label: "#6060a0",
    text: "#1a1a2e",
    overlayBackground: "rgba(210, 210, 230, 0.85)",
  },
};

export const CONTROLS_HELP = [
  "← →  Mover",
  "↑ X  Rotar",
  "↓  Bajar",
  "Espacio  Caída",
  "P  Pausa",
] as const;
