import { CELL_SIZE } from "./constants";
import type { Cell, DrawStyle, FruitColors } from "./types";

const FRUIT_RADIUS = 12;
const FRUIT_OFFSET_Y = 2;
const PIXEL_SIZE = 4;

// Manzana de 8×8: L = hoja, F = tono claro, D = tono oscuro
const PIXEL_FRUIT = [
  "....LL..",
  "...L....",
  ".FFFFFD.",
  "FFFFFFFD",
  "FFFFFFDD",
  "FFFFFFDD",
  ".FFFFDD.",
  "..DDDD..",
];

const cellOrigin = (cell: Cell) => ({
  x: cell.col * CELL_SIZE,
  y: cell.row * CELL_SIZE,
});

function drawPixelFruit(
  ctx: CanvasRenderingContext2D,
  cell: Cell,
  colors: FruitColors,
) {
  const palette: Record<string, string> = {
    L: colors.leaf,
    F: colors.fill,
    D: colors.line,
  };
  const offset = (CELL_SIZE - PIXEL_FRUIT.length * PIXEL_SIZE) / 2;
  const origin = cellOrigin(cell);
  PIXEL_FRUIT.forEach((row, y) => {
    [...row].forEach((code, x) => {
      if (!palette[code]) return;
      ctx.fillStyle = palette[code];
      ctx.fillRect(
        origin.x + offset + x * PIXEL_SIZE,
        origin.y + offset + y * PIXEL_SIZE,
        PIXEL_SIZE,
        PIXEL_SIZE,
      );
    });
  });
}

function drawRoundFruit(
  ctx: CanvasRenderingContext2D,
  cell: Cell,
  colors: FruitColors,
) {
  const origin = cellOrigin(cell);
  const x = origin.x + CELL_SIZE / 2;
  const y = origin.y + CELL_SIZE / 2 + FRUIT_OFFSET_Y;

  ctx.save();
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(x, y, FRUIT_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = colors.fill;
  ctx.fill();
  ctx.strokeStyle = colors.line;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(x + 5, y - FRUIT_RADIUS - 2, 6, 3, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = colors.leaf;
  ctx.fill();
  ctx.restore();
}

export function drawVectorFruit(
  ctx: CanvasRenderingContext2D,
  cell: Cell,
  colors: FruitColors,
  style: DrawStyle,
) {
  if (style === "pixel") drawPixelFruit(ctx, cell, colors);
  else drawRoundFruit(ctx, cell, colors);
}
