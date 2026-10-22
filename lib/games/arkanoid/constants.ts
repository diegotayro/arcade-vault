import { DEFAULT_SKIN_ID } from "@/lib/games/skins";

import type { ArkanoidSkin, SkinDefinition } from "./types";

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PADDLE_WIDTH = 81;
export const PADDLE_HEIGHT = 14;
export const PADDLE_Y = 560;
export const PADDLE_SPEED = 400;
// Margen bajo la paleta en el que todavía cuenta el rebote
export const PADDLE_BOUNCE_TOLERANCE = 8;

export const BALL_SIZE = 16;
export const BASE_BALL_VX = 200;
export const BASE_BALL_VY = -300;

export const BLOCK_COLS = 10;
export const BLOCK_WIDTH = 64;
export const BLOCK_HEIGHT = 24;
export const BLOCKS_ORIGIN_X = (CANVAS_WIDTH - BLOCK_COLS * BLOCK_WIDTH) / 2;
export const BLOCKS_ORIGIN_Y = 80;

export const POINTS_PER_BLOCK = 10;
export const INITIAL_LIVES = 3;
export const MAX_LEVEL = 5;

// Límite de dt (segundos) para que un frame largo no atraviese bloques
export const MAX_DT = 0.05;

export const EXPLOSION_DURATION = 150; // ms
export const EXPLOSION_FRAME_COUNT = 4;

export const SPRITESHEET_URL = "/games/arkanoid/spritesheet-breakout.png";
export const BOUNCE_SOUND_URL = "/games/arkanoid/sounds/ball-bounce.mp3";
export const BREAK_SOUND_URL = "/games/arkanoid/sounds/break-sound.mp3";

export const DEFAULT_SKIN: ArkanoidSkin = DEFAULT_SKIN_ID;

export const SKINS: Record<ArkanoidSkin, SkinDefinition> = {
  retro: {
    drawStyle: "sprite",
    background: "#000",
    text: "#fff",
    overlay: "rgba(0, 0, 0, 0.6)",
  },
  neon: {
    drawStyle: "glow",
    background: "#06040f",
    text: "#f2f0ff",
    overlay: "rgba(6, 4, 15, 0.75)",
    palette: {
      blocks: {
        gray: { main: "#9aa4c8", shade: "#6f7bff" },
        red: { main: "#ff2e63", shade: "#ff2e63" },
        yellow: { main: "#ffe94a", shade: "#ffb000" },
        cyan: { main: "#00f0ff", shade: "#00f0ff" },
        magenta: { main: "#d63bff", shade: "#d63bff" },
        hotpink: { main: "#ff4fb8", shade: "#ff4fb8" },
        green: { main: "#39ff88", shade: "#39ff88" },
      },
      paddle: { main: "#00f0ff", shade: "#00f0ff" },
      ball: { main: "#ffffff", shade: "#ff4fb8" },
    },
  },
  pastel: {
    drawStyle: "soft",
    background: "#eef3f8",
    text: "#2f3550",
    overlay: "rgba(238, 243, 248, 0.82)",
    palette: {
      blocks: {
        gray: { main: "#d5dae3", shade: "#6b7489" },
        red: { main: "#f7c1c1", shade: "#b4505a" },
        yellow: { main: "#fbe7a6", shade: "#a07a1c" },
        cyan: { main: "#bfe7ef", shade: "#2f7d8c" },
        magenta: { main: "#e3c8f2", shade: "#7d4f9c" },
        hotpink: { main: "#f8c6dd", shade: "#b0477a" },
        green: { main: "#c6ead0", shade: "#3f8659" },
      },
      paddle: { main: "#c9d4f5", shade: "#4a5a9a" },
      ball: { main: "#ffffff", shade: "#4a5a9a" },
    },
  },
  // Dos tonos por entidad: claro (main) y oscuro (shade)
  pixel: {
    drawStyle: "pixel",
    background: "#1a1028",
    text: "#f0f0f0",
    overlay: "rgba(26, 16, 40, 0.85)",
    palette: {
      blocks: {
        gray: { main: "#b8b8c8", shade: "#5c5c74" },
        red: { main: "#f05050", shade: "#8c1c2c" },
        yellow: { main: "#f8d040", shade: "#a06818" },
        cyan: { main: "#50d8f0", shade: "#1c6c98" },
        magenta: { main: "#c060f0", shade: "#602c98" },
        hotpink: { main: "#f878b8", shade: "#982c68" },
        green: { main: "#60e070", shade: "#1c7c34" },
      },
      paddle: { main: "#e0e0f0", shade: "#5c5c88" },
      ball: { main: "#ffffff", shade: "#8888aa" },
    },
  },
};
