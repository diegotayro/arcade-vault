import { BLOCK_COLS } from "./constants";
import type { BlockColor, Level, LevelBlock } from "./types";

const ROWS = 6;

function buildBlocks(
  getColor: (col: number, row: number) => BlockColor | null,
): LevelBlock[] {
  const blocks: LevelBlock[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < BLOCK_COLS; col++) {
      const color = getColor(col, row);
      if (color) blocks.push({ col, row, color });
    }
  }
  return blocks;
}

const ROW_COLORS_GRID: BlockColor[] = [
  "red",
  "yellow",
  "cyan",
  "magenta",
  "hotpink",
  "green",
];
const ROW_COLORS_PYRAMID: BlockColor[] = [
  "gray",
  "cyan",
  "hotpink",
  "yellow",
  "magenta",
  "green",
];
const ROW_COLORS_GAPS: BlockColor[] = [
  "cyan",
  "magenta",
  "green",
  "yellow",
  "hotpink",
  "red",
];

const PYRAMID_START = [4, 3, 2, 1, 0, 0];
const PYRAMID_END = [5, 6, 7, 8, 9, 9];

const GAPS_BY_ROW = [
  [2, 5, 8],
  [0, 4, 7, 9],
  [1, 3, 6],
  [2, 5, 8, 9],
  [0, 4, 7],
  [1, 3, 6, 9],
];

const grid = buildBlocks((_col, row) => ROW_COLORS_GRID[row]);

const pyramid = buildBlocks((col, row) =>
  col >= PYRAMID_START[row] && col <= PYRAMID_END[row]
    ? ROW_COLORS_PYRAMID[row]
    : null,
);

const checkerboard = buildBlocks((col, row) => {
  if ((col + row) % 2 !== 0) return null;
  return row < 3 ? "yellow" : "magenta";
});

const gappedRows = buildBlocks((col, row) =>
  GAPS_BY_ROW[row].includes(col) ? null : ROW_COLORS_GAPS[row],
);

const frameWithCross = buildBlocks((col, row) => {
  const isFrame =
    col === 0 || col === BLOCK_COLS - 1 || row === 0 || row === ROWS - 1;
  const isCross = col === 4 || row === 2;
  if (!isFrame && !isCross) return null;
  return isCross && !isFrame ? "hotpink" : "cyan";
});

export const LEVELS: readonly Level[] = [
  { speed: 1.0, blocks: grid },
  { speed: 1.1, blocks: pyramid },
  { speed: 1.21, blocks: checkerboard },
  { speed: 1.33, blocks: gappedRows },
  { speed: 1.46, blocks: frameWithCross },
];
