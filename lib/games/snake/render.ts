import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CELL_SIZE,
  COLS,
  ROWS,
  SKINS,
} from "./constants";
import type { Fruit } from "./entities";
import { drawFruit } from "./sprites";
import type {
  Cell,
  Direction,
  DrawStyle,
  Rgb,
  SkinDefinition,
  SnakeSkin,
  SnakeState,
} from "./types";
import { drawVectorFruit } from "./vector-fruit";

const OVERLAY_FONT = "bold 56px monospace";

const SEGMENT_INSET = 4;
const SEGMENT_RADIUS = 10;
const BODY_SIZE = CELL_SIZE - SEGMENT_INSET * 2;
const CLASSIC_GLOW_BLUR = 12;
const NEON_GLOW_BLUR = 16;
const NEON_CORE_WIDTH = BODY_SIZE - 8;
const PIXEL_BORDER = 6;
const EYE_RADIUS = 4;
const EYE_SPREAD = 9;
const EYE_FORWARD = 8;

const OVERLAY_MESSAGES: Partial<Record<SnakeState, string>> = {
  gameover: "GAME OVER",
  win: "¡Tablero completo!",
};

const FACING_VECTORS: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export interface Scene {
  image: HTMLImageElement;
  snake: Cell[];
  fruit: Fruit | null;
  direction: Direction;
  state: SnakeState;
  skin: SnakeSkin;
}

const toCss = ([r, g, b]: Rgb) => `rgb(${r}, ${g}, ${b})`;

function drawBackground(ctx: CanvasRenderingContext2D, skin: SkinDefinition) {
  ctx.fillStyle = skin.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = skin.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let col = 1; col < COLS; col++) {
    ctx.moveTo(col * CELL_SIZE + 0.5, 0);
    ctx.lineTo(col * CELL_SIZE + 0.5, CANVAS_HEIGHT);
  }
  for (let row = 1; row < ROWS; row++) {
    ctx.moveTo(0, row * CELL_SIZE + 0.5);
    ctx.lineTo(CANVAS_WIDTH, row * CELL_SIZE + 0.5);
  }
  ctx.stroke();
}

const cellCenter = (cell: Cell) => ({
  x: cell.col * CELL_SIZE + CELL_SIZE / 2,
  y: cell.row * CELL_SIZE + CELL_SIZE / 2,
});

// Degradado desde la cabeza hasta la cola
function segmentColor(index: number, length: number, skin: SkinDefinition) {
  const ratio = length > 1 ? index / (length - 1) : 0;
  const mix = (channel: number) => {
    const from = skin.head[channel];
    return Math.round(from + (skin.tail[channel] - from) * ratio);
  };
  return toCss([mix(0), mix(1), mix(2)]);
}

function drawSegment(ctx: CanvasRenderingContext2D, cell: Cell, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(
    cell.col * CELL_SIZE + SEGMENT_INSET,
    cell.row * CELL_SIZE + SEGMENT_INSET,
    BODY_SIZE,
    BODY_SIZE,
    SEGMENT_RADIUS,
  );
  ctx.fill();
}

// Rellena el hueco entre dos segmentos consecutivos para que el cuerpo sea continuo
function drawLink(
  ctx: CanvasRenderingContext2D,
  from: Cell,
  to: Cell,
  color: string,
) {
  const a = cellCenter(from);
  const b = cellCenter(to);
  const half = BODY_SIZE / 2;
  ctx.fillStyle = color;
  ctx.fillRect(
    Math.min(a.x, b.x) - half,
    Math.min(a.y, b.y) - half,
    Math.abs(a.x - b.x) + half * 2,
    Math.abs(a.y - b.y) + half * 2,
  );
}

function drawClassicBody(
  ctx: CanvasRenderingContext2D,
  snake: Cell[],
  skin: SkinDefinition,
) {
  ctx.save();
  if (skin.glow) {
    ctx.shadowColor = skin.glow;
    ctx.shadowBlur = CLASSIC_GLOW_BLUR;
  }
  for (let index = snake.length - 1; index >= 0; index--) {
    const color = segmentColor(index, snake.length, skin);
    drawSegment(ctx, snake[index], color);
    if (index < snake.length - 1) {
      drawLink(ctx, snake[index], snake[index + 1], color);
    }
  }
  ctx.restore();
}

// Une los centros con trazos de extremos redondos: el cuerpo queda como una cápsula
function strokeLinks(
  ctx: CanvasRenderingContext2D,
  snake: Cell[],
  width: number,
  colorAt: (index: number) => string,
  blur: number,
) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = width;
  ctx.shadowBlur = blur;
  for (let index = snake.length - 1; index > 0; index--) {
    const from = cellCenter(snake[index]);
    const to = cellCenter(snake[index - 1]);
    ctx.strokeStyle = colorAt(index);
    ctx.shadowColor = colorAt(index);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }
}

const gradientOf = (snake: Cell[], skin: SkinDefinition) => (index: number) =>
  segmentColor(index, snake.length, skin);

function drawSoftBody(
  ctx: CanvasRenderingContext2D,
  snake: Cell[],
  skin: SkinDefinition,
) {
  ctx.save();
  strokeLinks(ctx, snake, BODY_SIZE, gradientOf(snake, skin), 0);
  ctx.restore();
}

// Tubo de neón: trazo brillante y núcleo del color del fondo
function drawNeonBody(
  ctx: CanvasRenderingContext2D,
  snake: Cell[],
  skin: SkinDefinition,
) {
  ctx.save();
  strokeLinks(ctx, snake, BODY_SIZE, gradientOf(snake, skin), NEON_GLOW_BLUR);
  strokeLinks(ctx, snake, NEON_CORE_WIDTH, () => skin.background, 0);
  ctx.restore();
}

function fillCellSquare(
  ctx: CanvasRenderingContext2D,
  cell: Cell,
  inset: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(
    cell.col * CELL_SIZE + inset,
    cell.row * CELL_SIZE + inset,
    CELL_SIZE - inset * 2,
    CELL_SIZE - inset * 2,
  );
}

// Dos tonos: borde oscuro continuo y bloque claro por celda
function drawPixelBody(
  ctx: CanvasRenderingContext2D,
  snake: Cell[],
  skin: SkinDefinition,
) {
  const dark = toCss(skin.tail);
  const light = toCss(skin.head);
  snake.forEach((cell, index) => {
    fillCellSquare(ctx, cell, SEGMENT_INSET, dark);
    if (index > 0) drawLink(ctx, cell, snake[index - 1], dark);
  });
  snake.forEach((cell) =>
    fillCellSquare(ctx, cell, SEGMENT_INSET + PIXEL_BORDER, light),
  );
}

const BODY_PAINTERS: Record<
  DrawStyle,
  (ctx: CanvasRenderingContext2D, snake: Cell[], skin: SkinDefinition) => void
> = {
  classic: drawClassicBody,
  glow: drawNeonBody,
  soft: drawSoftBody,
  pixel: drawPixelBody,
};

function drawEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  style: DrawStyle,
) {
  if (style === "pixel") {
    const size = EYE_RADIUS * 2;
    ctx.fillRect(
      Math.round(x - EYE_RADIUS),
      Math.round(y - EYE_RADIUS),
      size,
      size,
    );
    return;
  }
  ctx.beginPath();
  ctx.arc(x, y, EYE_RADIUS, 0, Math.PI * 2);
  ctx.fill();
}

function drawEyes(
  ctx: CanvasRenderingContext2D,
  head: Cell,
  direction: Direction,
  skin: SkinDefinition,
) {
  const center = cellCenter(head);
  const facing = FACING_VECTORS[direction];
  const side = { x: -facing.y, y: facing.x };
  ctx.fillStyle = skin.eye;
  for (const sign of [-1, 1]) {
    drawEye(
      ctx,
      center.x + facing.x * EYE_FORWARD + side.x * EYE_SPREAD * sign * 0.5,
      center.y + facing.y * EYE_FORWARD + side.y * EYE_SPREAD * sign * 0.5,
      skin.drawStyle,
    );
  }
}

function drawSceneFruit(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  skin: SkinDefinition,
) {
  if (!scene.fruit) return;
  if (skin.fruit) {
    drawVectorFruit(ctx, scene.fruit, skin.fruit, skin.drawStyle);
  } else {
    drawFruit(ctx, scene.image, scene.fruit.name, scene.fruit);
  }
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  message: string,
  skin: SkinDefinition,
) {
  ctx.fillStyle = skin.overlayBackground;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = skin.overlayText;
  ctx.font = OVERLAY_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

export function renderScene(ctx: CanvasRenderingContext2D, scene: Scene) {
  const skin = SKINS[scene.skin];
  ctx.imageSmoothingEnabled = skin.drawStyle !== "pixel";
  drawBackground(ctx, skin);
  drawSceneFruit(ctx, scene, skin);
  BODY_PAINTERS[skin.drawStyle](ctx, scene.snake, skin);
  drawEyes(ctx, scene.snake[0], scene.direction, skin);

  const overlayMessage = OVERLAY_MESSAGES[scene.state];
  if (overlayMessage) drawOverlay(ctx, overlayMessage, skin);
}
