import { EXPLOSION_DURATION, EXPLOSION_FRAME_COUNT } from "./constants";
import { drawFrame, drawSprite, EXPLOSION_FRAMES } from "./sprites";
import type {
  BlockColor,
  Explosion,
  SkinDefinition,
  Tones,
  VectorPalette,
  VectorStyle,
} from "./types";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Cómo se dibuja cada entidad según la skin
export interface Painter {
  block: (ctx: CanvasRenderingContext2D, color: BlockColor, rect: Rect) => void;
  explosion: (ctx: CanvasRenderingContext2D, explosion: Explosion) => void;
  paddle: (ctx: CanvasRenderingContext2D, rect: Rect) => void;
  ball: (ctx: CanvasRenderingContext2D, rect: Rect) => void;
  // Solo neón: siluetas del halo, que el render difumina por downscale
  halo?: Painter;
}

const BLOCK_GAP = 2;
const GLOW_FILL_ALPHA = 0.22;
const GLOW_LINE_WIDTH = 2;
const SOFT_LINE_WIDTH = 2;
const SOFT_BLOCK_RADIUS = 8;
const PIXEL_GRID = 4;
const EXPLOSION_SHRINK = 3;

function explosionFrameIndex(explosion: Explosion): number {
  const progress = explosion.elapsed / EXPLOSION_DURATION;
  return Math.min(
    Math.floor(progress * EXPLOSION_FRAME_COUNT),
    EXPLOSION_FRAME_COUNT - 1,
  );
}

// ── Retro: spritesheet original ───────────────────────────────────────────────
function createSpritePainter(image: HTMLImageElement): Painter {
  return {
    block: (ctx, color, { x, y, w, h }) =>
      drawSprite(ctx, image, color, x, y, w, h),
    explosion(ctx, explosion) {
      const frame =
        EXPLOSION_FRAMES[explosion.color][explosionFrameIndex(explosion)];
      const { x, y, w, h } = explosion;
      drawFrame(ctx, image, frame, x, y, w, h);
    },
    paddle: (ctx, { x, y, w, h }) =>
      drawSprite(ctx, image, "paddle", x, y, w, h),
    ball: (ctx, { x, y, w, h }) => drawSprite(ctx, image, "ball", x, y, w, h),
  };
}

// ── Formas vectoriales por estilo ─────────────────────────────────────────────
type ShapeFn = (
  ctx: CanvasRenderingContext2D,
  tones: Tones,
  rect: Rect,
) => void;

interface StyleShapes {
  box: (radius: number) => ShapeFn;
  round: ShapeFn;
}

function insetRect({ x, y, w, h }: Rect, inset: number): Rect {
  return { x: x + inset, y: y + inset, w: w - inset * 2, h: h - inset * 2 };
}

function tracePath(
  ctx: CanvasRenderingContext2D,
  { x, y, w, h }: Rect,
  radius: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
}

function traceCircle(ctx: CanvasRenderingContext2D, { x, y, w }: Rect) {
  ctx.beginPath();
  ctx.arc(x + w / 2, y + w / 2, w / 2, 0, Math.PI * 2);
}

function glowPaint(
  ctx: CanvasRenderingContext2D,
  tones: Tones,
  trace: () => void,
) {
  ctx.save();
  trace();
  ctx.globalAlpha = GLOW_FILL_ALPHA;
  ctx.fillStyle = tones.main;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = tones.main;
  ctx.lineWidth = GLOW_LINE_WIDTH;
  ctx.stroke();
  ctx.restore();
}

function haloPaint(
  ctx: CanvasRenderingContext2D,
  tones: Tones,
  trace: () => void,
) {
  trace();
  ctx.fillStyle = tones.shade;
  ctx.fill();
}

function softPaint(
  ctx: CanvasRenderingContext2D,
  tones: Tones,
  trace: () => void,
) {
  trace();
  ctx.fillStyle = tones.main;
  ctx.fill();
  ctx.strokeStyle = tones.shade;
  ctx.lineWidth = SOFT_LINE_WIDTH;
  ctx.stroke();
}

const snap = (value: number) => Math.round(value / PIXEL_GRID) * PIXEL_GRID;

function snapRect({ x, y, w, h }: Rect): Rect {
  return { x: snap(x), y: snap(y), w: snap(w), h: snap(h) };
}

// Bloque de dos tonos: base oscura y cara clara desplazada (sombra abajo-derecha)
function pixelBox(ctx: CanvasRenderingContext2D, tones: Tones, rect: Rect) {
  const { x, y, w, h } = snapRect(rect);
  ctx.fillStyle = tones.shade;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = tones.main;
  ctx.fillRect(x, y, w - PIXEL_GRID, h - PIXEL_GRID);
}

// Bola en cruz: esquinas recortadas y núcleo claro
function pixelRound(ctx: CanvasRenderingContext2D, tones: Tones, rect: Rect) {
  const { x, y, w, h } = snapRect(rect);
  ctx.fillStyle = tones.shade;
  ctx.fillRect(x + PIXEL_GRID, y, w - PIXEL_GRID * 2, h);
  ctx.fillRect(x, y + PIXEL_GRID, w, h - PIXEL_GRID * 2);
  ctx.fillStyle = tones.main;
  ctx.fillRect(x + PIXEL_GRID, y + PIXEL_GRID, PIXEL_GRID, PIXEL_GRID);
}

type PaintFn = typeof glowPaint;

function pathShapes(paint: PaintFn): StyleShapes {
  return {
    box: (radius) => (ctx, tones, rect) =>
      paint(ctx, tones, () => tracePath(ctx, rect, radius)),
    round: (ctx, tones, rect) =>
      paint(ctx, tones, () => traceCircle(ctx, rect)),
  };
}

const STYLE_SHAPES: Record<VectorStyle, StyleShapes> = {
  glow: pathShapes(glowPaint),
  soft: pathShapes(softPaint),
  pixel: {
    box: () => pixelBox,
    round: pixelRound,
  },
};

const HALO_SHAPES = pathShapes(haloPaint);

function blockRadius(style: VectorStyle): number {
  return style === "soft" ? SOFT_BLOCK_RADIUS : 0;
}

function buildVectorPainter(
  shapes: StyleShapes,
  style: VectorStyle,
  palette: VectorPalette,
): Painter {
  const drawBlock = shapes.box(blockRadius(style));
  const isPixel = style === "pixel";

  return {
    block: (ctx, color, rect) =>
      drawBlock(ctx, palette.blocks[color], insetRect(rect, BLOCK_GAP)),
    // La explosión encoge el bloque; fuera de pixel art además se desvanece
    explosion(ctx, explosion) {
      const inset =
        BLOCK_GAP + explosionFrameIndex(explosion) * EXPLOSION_SHRINK;
      ctx.save();
      if (!isPixel) {
        ctx.globalAlpha = 1 - explosion.elapsed / EXPLOSION_DURATION;
      }
      drawBlock(
        ctx,
        palette.blocks[explosion.color],
        insetRect(explosion, inset),
      );
      ctx.restore();
    },
    paddle: (ctx, rect) =>
      shapes.box(isPixel ? 0 : rect.h / 2)(ctx, palette.paddle, rect),
    ball: (ctx, rect) => shapes.round(ctx, palette.ball, rect),
  };
}

function createVectorPainter(
  style: VectorStyle,
  palette: VectorPalette,
): Painter {
  const painter = buildVectorPainter(STYLE_SHAPES[style], style, palette);
  if (style !== "glow") return painter;
  return { ...painter, halo: buildVectorPainter(HALO_SHAPES, style, palette) };
}

export function createPainter(
  skin: SkinDefinition,
  image: HTMLImageElement,
): Painter {
  if (skin.drawStyle === "sprite") return createSpritePainter(image);
  return createVectorPainter(skin.drawStyle, skin.palette);
}
