import {
  BLOCK,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  BOARD_X,
  COLS,
  CONTROLS_HELP,
  GHOST_ALPHA,
  HEIGHT,
  PANEL_X,
  ROWS,
  SKINS,
  WIDTH,
} from "./constants";
import type { ActivePiece, Board, BlockStyle, TetrisSkin } from "./types";

export interface RenderState {
  board: Board;
  current: ActivePiece;
  ghostY: number;
  next: ActivePiece;
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
  skin: TetrisSkin;
}

const PANEL_PADDING = 16;
const NEXT_BLOCK = 24;
const NEXT_GRID = 4;
const FONT = "monospace";

function fillBlockByStyle(
  ctx: CanvasRenderingContext2D,
  style: BlockStyle,
  color: string,
  x: number,
  y: number,
  size: number,
) {
  ctx.fillStyle = color;
  switch (style) {
    case "bevel":
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(x, y, size, 4);
      break;
    case "glow":
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(x, y, size, size);
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.globalAlpha *= 0.35;
      ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
      break;
    case "soft":
      ctx.beginPath();
      ctx.roundRect(x, y, size, size, 8);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.beginPath();
      ctx.roundRect(x + 4, y + 4, size - 8, 5, 3);
      ctx.fill();
      break;
    case "pixel": {
      const edge = Math.max(2, Math.round(size / 8));
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(x, y, size, edge);
      ctx.fillRect(x, y, edge, size);
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(x, y + size - edge, size, edge);
      ctx.fillRect(x + size - edge, y, edge, size);
      break;
    }
  }
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  skin: TetrisSkin,
  originX: number,
  originY: number,
  col: number,
  row: number,
  colorIndex: number,
  size: number,
  alpha = 1,
) {
  if (!colorIndex) return;
  const { pieceColors, blockStyle } = SKINS[skin];
  ctx.globalAlpha = alpha;
  fillBlockByStyle(
    ctx,
    blockStyle,
    pieceColors[colorIndex]!,
    originX + col * size + 1,
    originY + row * size + 1,
    size - 2,
  );
  ctx.globalAlpha = 1;
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  skin: TetrisSkin,
  shape: readonly (readonly number[])[],
  originX: number,
  originY: number,
  col: number,
  row: number,
  size: number,
  alpha = 1,
) {
  shape.forEach((cells, r) => {
    cells.forEach((cell, c) => {
      drawBlock(
        ctx,
        skin,
        originX,
        originY,
        col + c,
        row + r,
        cell,
        size,
        alpha,
      );
    });
  });
}

function drawGrid(ctx: CanvasRenderingContext2D, gridColor: string) {
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let col = 1; col < COLS; col++) {
    ctx.moveTo(BOARD_X + col * BLOCK, 0);
    ctx.lineTo(BOARD_X + col * BLOCK, BOARD_HEIGHT);
  }
  for (let row = 1; row < ROWS; row++) {
    ctx.moveTo(BOARD_X, row * BLOCK);
    ctx.lineTo(BOARD_X + BOARD_WIDTH, row * BLOCK);
  }
  ctx.stroke();
}

function drawBoard(ctx: CanvasRenderingContext2D, state: RenderState) {
  const { board, current, ghostY } = state;
  board.forEach((cells, row) => {
    cells.forEach((cell, col) => {
      drawBlock(ctx, state.skin, BOARD_X, 0, col, row, cell, BLOCK);
    });
  });
  drawShape(
    ctx,
    state.skin,
    current.shape,
    BOARD_X,
    0,
    current.x,
    ghostY,
    BLOCK,
    GHOST_ALPHA,
  );
  drawShape(
    ctx,
    state.skin,
    current.shape,
    BOARD_X,
    0,
    current.x,
    current.y,
    BLOCK,
  );
}

function drawStat(
  ctx: CanvasRenderingContext2D,
  state: RenderState,
  label: string,
  value: string,
  y: number,
) {
  const palette = SKINS[state.skin];
  const x = PANEL_X + PANEL_PADDING;
  ctx.textAlign = "left";
  ctx.fillStyle = palette.labelText;
  ctx.font = `12px ${FONT}`;
  ctx.fillText(label, x, y);
  ctx.fillStyle = palette.text;
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillText(value, x, y + 24);
}

function drawNextPiece(
  ctx: CanvasRenderingContext2D,
  state: RenderState,
  y: number,
) {
  const palette = SKINS[state.skin];
  const x = PANEL_X + PANEL_PADDING;
  ctx.textAlign = "left";
  ctx.fillStyle = palette.labelText;
  ctx.font = `12px ${FONT}`;
  ctx.fillText("NEXT", x, y);

  const { shape } = state.next;
  const offsetCol = Math.floor((NEXT_GRID - shape[0].length) / 2);
  const offsetRow = Math.floor((NEXT_GRID - shape.length) / 2);
  drawShape(
    ctx,
    state.skin,
    shape,
    x,
    y + 10,
    offsetCol,
    offsetRow,
    NEXT_BLOCK,
  );
}

function drawControls(
  ctx: CanvasRenderingContext2D,
  state: RenderState,
  y: number,
) {
  const palette = SKINS[state.skin];
  ctx.textAlign = "left";
  ctx.fillStyle = palette.labelText;
  ctx.font = `11px ${FONT}`;
  CONTROLS_HELP.forEach((line, index) => {
    ctx.fillText(line, PANEL_X + PANEL_PADDING, y + index * 18);
  });
}

function drawPanel(ctx: CanvasRenderingContext2D, state: RenderState) {
  ctx.textBaseline = "alphabetic";
  drawStat(ctx, state, "SCORE", state.score.toLocaleString(), 40);
  drawStat(ctx, state, "LINES", String(state.lines), 100);
  drawStat(ctx, state, "LEVEL", String(state.level), 160);
  drawNextPiece(ctx, state, 230);
  drawControls(ctx, state, 400);
}

function drawGameOver(ctx: CanvasRenderingContext2D, state: RenderState) {
  const palette = SKINS[state.skin];
  const centerX = BOARD_X + BOARD_WIDTH / 2;
  ctx.fillStyle = palette.overlayBackground;
  ctx.fillRect(BOARD_X, 0, BOARD_WIDTH, BOARD_HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = palette.text;
  ctx.font = `bold 34px ${FONT}`;
  ctx.fillText("GAME OVER", centerX, HEIGHT / 2 - 10);
  ctx.font = `16px ${FONT}`;
  ctx.fillText(
    `Puntuación: ${state.score.toLocaleString()}`,
    centerX,
    HEIGHT / 2 + 22,
  );
}

export function drawFrame(ctx: CanvasRenderingContext2D, state: RenderState) {
  const palette = SKINS[state.skin];
  ctx.fillStyle = palette.canvasBackground;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawGrid(ctx, palette.gridLine);
  drawBoard(ctx, state);
  drawPanel(ctx, state);
  if (state.gameOver) drawGameOver(ctx, state);
}
