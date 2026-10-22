import { DEFAULT_SKIN_ID } from "@/lib/games/skins";

import type { SkinDefinition, SnakeSkin } from "./types";

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const CELL_SIZE = 40;
export const COLS = 20;
export const ROWS = 15;
export const TOTAL_CELLS = COLS * ROWS;

export const INITIAL_LENGTH = 3;
export const POINTS_PER_FRUIT = 10;
export const FRUITS_PER_LEVEL = 5;

export const INITIAL_TICK_MS = 140;
export const TICK_STEP_MS = 10;
export const MIN_TICK_MS = 60;

export const MAX_INPUT_QUEUE = 2;
export const MAX_DT = 0.05;

export const FRUITS_SPRITESHEET_URL = "/games/snake/fruits.png";

export const DEFAULT_SKIN: SnakeSkin = DEFAULT_SKIN_ID;

export const SKINS: Record<SnakeSkin, SkinDefinition> = {
  retro: {
    drawStyle: "classic",
    background: "#05120d",
    grid: "rgba(0, 255, 136, 0.07)",
    head: [93, 255, 176],
    tail: [0, 102, 58],
    eye: "#05050f",
    glow: "rgba(0, 255, 136, 0.6)",
    fruit: null,
    overlayBackground: "rgba(0, 0, 0, 0.6)",
    overlayText: "#ffffff",
  },
  neon: {
    drawStyle: "glow",
    background: "#05050c",
    grid: "rgba(0, 245, 255, 0.06)",
    head: [0, 245, 255],
    tail: [123, 44, 255],
    eye: "#ffffff",
    glow: "rgba(0, 245, 255, 0.8)",
    fruit: {
      fill: "rgba(255, 43, 214, 0.15)",
      line: "#ff2bd6",
      leaf: "#39ff14",
    },
    overlayBackground: "rgba(5, 5, 12, 0.75)",
    overlayText: "#ffffff",
  },
  pastel: {
    drawStyle: "soft",
    background: "#eef3f8",
    grid: "rgba(47, 53, 80, 0.06)",
    head: [92, 158, 173],
    tail: [183, 160, 214],
    eye: "#2f3550",
    glow: null,
    fruit: { fill: "#f6a5b8", line: "#c9667f", leaf: "#7fbf8f" },
    overlayBackground: "rgba(238, 243, 248, 0.85)",
    overlayText: "#2f3550",
  },
  // Dos tonos por entidad: claro (head) y oscuro (tail)
  pixel: {
    drawStyle: "pixel",
    background: "#1a1c2c",
    grid: "rgba(244, 244, 244, 0.05)",
    head: [56, 183, 100],
    tail: [37, 113, 121],
    eye: "#1a1c2c",
    glow: null,
    fruit: { fill: "#e04a5f", line: "#7a2840", leaf: "#a7f070" },
    overlayBackground: "rgba(26, 28, 44, 0.85)",
    overlayText: "#f4f4f4",
  },
};
