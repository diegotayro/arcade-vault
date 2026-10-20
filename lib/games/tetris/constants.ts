import type { SkinDefinition, TetrisSkin } from "./types";

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

export const PIECE_TYPES_COUNT = 7;

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
  // N (tuerca) retirada del juego
  // [
  //   [8, 8, 8],
  //   [8, 0, 8],
  //   [8, 8, 8],
  // ],
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

export const SKIN_STORAGE_KEY = "tetris-skin";
export const DEFAULT_SKIN: TetrisSkin = "retro";

// pieceColors indexado por tipo de pieza (índice 0 vacío)
export const SKINS: Record<TetrisSkin, SkinDefinition> = {
  retro: {
    label: "RETRO",
    pieceColors: [
      null,
      "#4dd0e1", // I
      "#ffd54f", // O
      "#ba68c8", // T
      "#81c784", // S
      "#e57373", // Z
      "#90caf9", // J
      "#ffb74d", // L
      // "#9e9e9e", // N - tuerca (retirada)
    ],
    canvasBackground: "#1a1a25",
    gridLine: "#22222e",
    labelText: "#555570",
    text: "#e0e0e0",
    overlayBackground: "rgba(10, 10, 20, 0.75)",
    blockStyle: "bevel",
  },
  neon: {
    label: "NEON",
    pieceColors: [
      null,
      "#00f5ff",
      "#f5ff00",
      "#bf00ff",
      "#39ff14",
      "#ff006e",
      "#3d7bff",
      "#ff8c00",
    ],
    canvasBackground: "#05050c",
    gridLine: "#14142a",
    labelText: "#00f5ff",
    text: "#ffffff",
    overlayBackground: "rgba(5, 5, 12, 0.8)",
    blockStyle: "glow",
  },
  pastel: {
    label: "PASTEL",
    pieceColors: [
      null,
      "#a8e6e2",
      "#fff1a8",
      "#d4b8f0",
      "#b8e8c0",
      "#f7b8c4",
      "#b8d0f7",
      "#fbd0a8",
    ],
    canvasBackground: "#f6f1ea",
    gridLine: "#e4dccf",
    labelText: "#9a8f80",
    text: "#4a4238",
    overlayBackground: "rgba(246, 241, 234, 0.85)",
    blockStyle: "soft",
  },
  pixel: {
    label: "PIXEL ART",
    pieceColors: [
      null,
      "#2ce8f5",
      "#f8d800",
      "#a040f0",
      "#40c040",
      "#e83030",
      "#3050f0",
      "#f08010",
    ],
    canvasBackground: "#0f0f1e",
    gridLine: "#1a1a30",
    labelText: "#8888aa",
    text: "#f0f0f0",
    overlayBackground: "rgba(15, 15, 30, 0.85)",
    blockStyle: "pixel",
  },
};

export const SKIN_OPTIONS = Object.keys(SKINS) as TetrisSkin[];

export const isTetrisSkin = (value: unknown): value is TetrisSkin =>
  typeof value === "string" && value in SKINS;

export const CONTROLS_HELP = [
  "← →  Mover",
  "↑ X  Rotar",
  "↓  Bajar",
  "Espacio  Caída",
  "P  Pausa",
] as const;
