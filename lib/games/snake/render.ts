import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CELL_SIZE,
  COLS,
  ROWS,
} from "./constants";
import type { Fruit } from "./entities";
import { drawFruit } from "./sprites";
import type { Cell, Direction, SnakeState } from "./types";

const BACKGROUND_COLOR = "#05120d";
const GRID_COLOR = "rgba(0, 255, 136, 0.07)";
const HEAD_RGB = [93, 255, 176];
const TAIL_RGB = [0, 102, 58];
const EYE_COLOR = "#05050f";
const GLOW_COLOR = "rgba(0, 255, 136, 0.6)";
const OVERLAY_COLOR = "rgba(0, 0, 0, 0.6)";
const OVERLAY_FONT = "bold 56px monospace";
const OVERLAY_TEXT_COLOR = "#ffffff";

const SEGMENT_INSET = 4;
const SEGMENT_RADIUS = 10;
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
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = GRID_COLOR;
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

// Degradado desde la cabeza (clara) hasta la cola (oscura)
function segmentColor(index: number, length: number) {
  const ratio = length > 1 ? index / (length - 1) : 0;
  const [r, g, b] = HEAD_RGB.map((head, channel) =>
    Math.round(head + (TAIL_RGB[channel] - head) * ratio),
  );
  return `rgb(${r}, ${g}, ${b})`;
}

function drawSegment(
  ctx: CanvasRenderingContext2D,
  cell: Cell,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(
    cell.col * CELL_SIZE + SEGMENT_INSET,
    cell.row * CELL_SIZE + SEGMENT_INSET,
    CELL_SIZE - SEGMENT_INSET * 2,
    CELL_SIZE - SEGMENT_INSET * 2,
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
  const half = CELL_SIZE / 2 - SEGMENT_INSET;
  ctx.fillStyle = color;
  ctx.fillRect(
    Math.min(a.x, b.x) - half,
    Math.min(a.y, b.y) - half,
    Math.abs(a.x - b.x) + half * 2,
    Math.abs(a.y - b.y) + half * 2,
  );
}

function drawEyes(
  ctx: CanvasRenderingContext2D,
  head: Cell,
  direction: Direction,
) {
  const center = cellCenter(head);
  const facing = FACING_VECTORS[direction];
  const side = { x: -facing.y, y: facing.x };
  ctx.fillStyle = EYE_COLOR;
  for (const sign of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(
      center.x + facing.x * EYE_FORWARD + side.x * EYE_SPREAD * sign * 0.5,
      center.y + facing.y * EYE_FORWARD + side.y * EYE_SPREAD * sign * 0.5,
      EYE_RADIUS,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

function drawSnake(
  ctx: CanvasRenderingContext2D,
  snake: Cell[],
  direction: Direction,
) {
  ctx.save();
  ctx.shadowColor = GLOW_COLOR;
  ctx.shadowBlur = 12;
  for (let index = snake.length - 1; index >= 0; index--) {
    const color = segmentColor(index, snake.length);
    drawSegment(ctx, snake[index], color);
    if (index < snake.length - 1) {
      drawLink(ctx, snake[index], snake[index + 1], color);
    }
  }
  ctx.restore();
  drawEyes(ctx, snake[0], direction);
}

function drawOverlay(ctx: CanvasRenderingContext2D, message: string) {
  ctx.fillStyle = OVERLAY_COLOR;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = OVERLAY_TEXT_COLOR;
  ctx.font = OVERLAY_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

export function renderScene(ctx: CanvasRenderingContext2D, scene: Scene) {
  drawBackground(ctx);
  if (scene.fruit) drawFruit(ctx, scene.image, scene.fruit.name, scene.fruit);
  drawSnake(ctx, scene.snake, scene.direction);

  const overlayMessage = OVERLAY_MESSAGES[scene.state];
  if (overlayMessage) drawOverlay(ctx, overlayMessage);
}
