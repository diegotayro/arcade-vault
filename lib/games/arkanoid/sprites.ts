import { EXPLOSION_FRAME_COUNT, SPRITESHEET_URL } from "./constants";
import type { BlockColor } from "./types";

export interface SpriteRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

type SpriteName = "paddle" | "ball";

const SPRITES: Record<SpriteName, SpriteRect> & {
  blocks: Record<BlockColor, SpriteRect>;
} = {
  paddle: { sx: 32, sy: 112, sw: 162, sh: 14 },
  ball: { sx: 32, sy: 32, sw: 16, sh: 16 },
  blocks: {
    gray: { sx: 32, sy: 288, sw: 32, sh: 16 },
    red: { sx: 32, sy: 176, sw: 32, sh: 16 },
    yellow: { sx: 32, sy: 240, sw: 32, sh: 16 },
    cyan: { sx: 32, sy: 192, sw: 32, sh: 16 },
    magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
    hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
    green: { sx: 32, sy: 208, sw: 32, sh: 16 },
  },
};

const EXPLOSION_FIRST_FRAME_X = 256;
const EXPLOSION_FRAME_WIDTH = 32;
const EXPLOSION_FRAME_HEIGHT = 16;

function explosionRow(sy: number): SpriteRect[] {
  return Array.from({ length: EXPLOSION_FRAME_COUNT }, (_, index) => ({
    sx: EXPLOSION_FIRST_FRAME_X + index * EXPLOSION_FRAME_WIDTH,
    sy,
    sw: EXPLOSION_FRAME_WIDTH,
    sh: EXPLOSION_FRAME_HEIGHT,
  }));
}

export const EXPLOSION_FRAMES: Record<BlockColor, SpriteRect[]> = {
  red: explosionRow(176),
  cyan: explosionRow(192),
  green: explosionRow(208),
  magenta: explosionRow(224),
  yellow: explosionRow(240),
  hotpink: explosionRow(256),
  gray: explosionRow(176), // el original reutiliza los frames rojos
};

/** Carga el spritesheet; devuelve una función que cancela la carga pendiente. */
export function loadSpritesheet(
  onLoad: (image: HTMLImageElement) => void,
  onError: () => void,
): () => void {
  const image = new Image();
  image.onload = () => onLoad(image);
  image.onerror = onError;
  image.src = SPRITESHEET_URL;

  return () => {
    image.onload = null;
    image.onerror = null;
  };
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  frame: SpriteRect,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.drawImage(image, frame.sx, frame.sy, frame.sw, frame.sh, x, y, w, h);
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  name: SpriteName | BlockColor,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const sprite =
    name === "paddle" || name === "ball" ? SPRITES[name] : SPRITES.blocks[name];
  drawFrame(ctx, image, sprite, x, y, w, h);
}
