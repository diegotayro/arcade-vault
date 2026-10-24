import { DEFAULT_SKIN_ID, SKIN_LABELS } from "@/lib/games/skins";

import type { EntityType, FroggerSkin, SkinDefinition } from "./types";

export const COLS = 16;
export const ROWS = 14;
export const CELL = 40; // px
export const CANVAS_WIDTH = COLS * CELL; // 640 — se escala con CSS al contenedor
export const CANVAS_HEIGHT = ROWS * CELL; // 560

// Zonas (índice de fila, 0 = arriba)
export const ROW_GOALS = 0;
export const ROW_RIVER_TOP = 1;
export const ROW_RIVER_BOT = 6;
export const ROW_SAFE_MID = 7;
export const ROW_ROAD_TOP = 8;
export const ROW_ROAD_BOT = 12;
export const ROW_START = 13;
export const START_COL = Math.floor(COLS / 2) - 1;

// 5 bocas de 2 columnas, separadas por 1 columna de seto
export const GOAL_COUNT = 5;
export const GOAL_WIDTH = 2;
export const GOAL_SPACING = 3;
export const GOAL_FIRST_COL = 1;

export const INITIAL_LIVES = 3;
export const JUMP_MS = 120;
export const FRAME_MS = 16; // las velocidades se expresan en px/frame
export const MAX_DT_MS = 50;

export const LEVEL_SPEED_FACTOR = 1.15;
export const ROUND_TIME_S = 15;
export const ROUND_TIME_STEP_S = 1;
export const MIN_ROUND_TIME_S = 8;

export const TURTLE_VISIBLE_MS = 3000;
export const TURTLE_SUBMERGED_MS = 1500;
export const TURTLE_CYCLE_MS = TURTLE_VISIBLE_MS + TURTLE_SUBMERGED_MS;
export const TURTLE_GROUP_OFFSET_MS = 1100; // desfasa los grupos de un mismo carril

export const POINTS_PER_ROW = 10;
export const POINTS_PER_GOAL = 50;
export const POINTS_PER_ROUND = 200;
export const POINTS_PER_SECOND_LEFT = 10;

export interface LaneConfig {
  row: number;
  type: EntityType;
  width: number; // celdas
  gap: number; // celdas libres entre entidades
  speed: number; // px/frame en el nivel 1
  dir: 1 | -1;
}

export const ROAD_LANES: LaneConfig[] = [
  { row: 12, type: "car", width: 1, gap: 3, speed: 1.5, dir: -1 },
  { row: 11, type: "car", width: 1, gap: 4, speed: 2, dir: 1 },
  { row: 10, type: "car", width: 1, gap: 3, speed: 2.5, dir: -1 },
  { row: 9, type: "car", width: 1, gap: 5, speed: 4, dir: 1 },
  { row: 8, type: "truck", width: 3, gap: 4, speed: 1.8, dir: -1 },
];

export const RIVER_LANES: LaneConfig[] = [
  { row: 6, type: "turtle", width: 3, gap: 2, speed: 1.5, dir: -1 },
  { row: 5, type: "log", width: 3, gap: 3, speed: 1.2, dir: 1 },
  { row: 4, type: "turtle", width: 2, gap: 2, speed: 2, dir: -1 },
  { row: 3, type: "log", width: 4, gap: 3, speed: 2.5, dir: 1 },
  { row: 2, type: "turtle", width: 3, gap: 3, speed: 1.6, dir: -1 },
  { row: 1, type: "log", width: 2, gap: 2, speed: 1.4, dir: 1 },
];

export const DEFAULT_SKIN: FroggerSkin = DEFAULT_SKIN_ID;

export const SKINS: Record<FroggerSkin, SkinDefinition> = {
  retro: {
    label: SKIN_LABELS.retro,
    drawStyle: "flat",
    goalZone: "#0f5a2a",
    goalSlot: "#0b3d1d",
    goalBorder: "#ffd23f",
    river: "#061a4a",
    safe: "#164d1f",
    road: "#000000",
    laneMark: "rgba(255, 255, 255, 0.25)",
    cars: ["#ff3b3b", "#ffd23f", "#2f7bff"],
    truck: "#9a9a9a",
    truckCab: "#d8d8d8",
    wheel: "#111111",
    log: "#7a4a1e",
    logLine: "#4f2e10",
    turtle: "#2fa84f",
    turtleScale: "#1c6e33",
    turtleSubmerged: "rgba(47, 168, 79, 0.35)",
    frog: "#39ff14",
    frogDark: "#1f9e0a",
    eyeWhite: "#ffffff",
    eyePupil: "#000000",
    hudText: "#ffffff",
    hudShadow: "rgba(0, 0, 0, 0.85)",
    timeHigh: "#39ff14",
    timeMid: "#ffd23f",
    timeLow: "#ff3b3b",
    overlayBackground: "rgba(0, 0, 0, 0.6)",
    overlayText: "#ffffff",
  },
  neon: {
    label: SKIN_LABELS.neon,
    drawStyle: "glow",
    goalZone: "#0a0420",
    goalSlot: "#000000",
    goalBorder: "#ff2bd6",
    river: "#020b2a",
    safe: "#0d0626",
    road: "#04030b",
    laneMark: "rgba(0, 240, 255, 0.45)",
    cars: ["#ff2bd6", "#ffe600", "#00f0ff"],
    truck: "#7a5cff",
    truckCab: "#c4b5ff",
    wheel: "#1a1030",
    log: "#ff8a00",
    logLine: "#7a3d00",
    turtle: "#00ffa3",
    turtleScale: "#007a4e",
    turtleSubmerged: "rgba(0, 255, 163, 0.35)",
    frog: "#39ff14",
    frogDark: "#1a9e00",
    eyeWhite: "#ffffff",
    eyePupil: "#04030b",
    hudText: "#e8faff",
    hudShadow: "#00f0ff",
    timeHigh: "#39ff14",
    timeMid: "#ffe600",
    timeLow: "#ff2b5e",
    overlayBackground: "rgba(4, 3, 11, 0.75)",
    overlayText: "#ff2bd6",
  },
  pastel: {
    label: SKIN_LABELS.pastel,
    drawStyle: "soft",
    goalZone: "#bfe6cc",
    goalSlot: "#94d1aa",
    goalBorder: "#e58fb0",
    river: "#a9d6ee",
    safe: "#d6efd3",
    road: "#ebe5f2",
    laneMark: "rgba(110, 95, 140, 0.35)",
    cars: ["#f2998f", "#f2c45a", "#7fb0e3"],
    truck: "#b4a5d8",
    truckCab: "#ddd3f2",
    wheel: "#5b5470",
    log: "#c99a6e",
    logLine: "#956a45",
    turtle: "#78c49b",
    turtleScale: "#4a936d",
    turtleSubmerged: "rgba(74, 147, 109, 0.4)",
    frog: "#3f9a50",
    frogDark: "#24683a",
    eyeWhite: "#ffffff",
    eyePupil: "#3b3350",
    hudText: "#3b3350",
    hudShadow: "rgba(255, 255, 255, 0.8)",
    timeHigh: "#4caf6a",
    timeMid: "#e0a030",
    timeLow: "#e06070",
    overlayBackground: "rgba(250, 246, 255, 0.75)",
    overlayText: "#3b3350",
  },
  pixel: {
    label: SKIN_LABELS.pixel,
    drawStyle: "pixel",
    goalZone: "#005800",
    goalSlot: "#003800",
    goalBorder: "#f8b800",
    river: "#0028a8",
    safe: "#6b2fa0",
    road: "#000000",
    laneMark: "#7c7c7c",
    cars: ["#f83800", "#f8b800", "#3cbcfc"],
    truck: "#bcbcbc",
    truckCab: "#fcfcfc",
    wheel: "#3c3c3c",
    log: "#ac7c00",
    logLine: "#503000",
    turtle: "#00a800",
    turtleScale: "#005800",
    turtleSubmerged: "#005800",
    frog: "#58f898",
    frogDark: "#00a844",
    eyeWhite: "#fcfcfc",
    eyePupil: "#000000",
    hudText: "#fcfcfc",
    hudShadow: "#000000",
    timeHigh: "#58d854",
    timeMid: "#f8b800",
    timeLow: "#f83800",
    overlayBackground: "rgba(0, 0, 0, 0.7)",
    overlayText: "#fcfcfc",
  },
};
