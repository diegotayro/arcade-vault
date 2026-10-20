import {
  COLS,
  FRUITS_PER_LEVEL,
  INITIAL_LENGTH,
  INITIAL_TICK_MS,
  MIN_TICK_MS,
  ROWS,
  TICK_STEP_MS,
} from "./constants";
import { FRUIT_NAMES, type FruitName } from "./sprites";
import type { Cell, Direction } from "./types";

export interface Fruit extends Cell {
  name: FruitName;
}

export const INITIAL_DIRECTION: Direction = "right";

const DIRECTION_VECTORS: Record<Direction, Cell> = {
  up: { col: 0, row: -1 },
  down: { col: 0, row: 1 },
  left: { col: -1, row: 0 },
  right: { col: 1, row: 0 },
};

const OPPOSITES: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

// La cabeza va primero
export function createSnake(): Cell[] {
  const headCol = Math.floor(COLS / 2);
  const row = Math.floor(ROWS / 2);
  return Array.from({ length: INITIAL_LENGTH }, (_, index) => ({
    col: headCol - index,
    row,
  }));
}

export function nextHead(head: Cell, direction: Direction): Cell {
  const vector = DIRECTION_VECTORS[direction];
  return { col: head.col + vector.col, row: head.row + vector.row };
}

export const isOppositeDirection = (a: Direction, b: Direction) =>
  OPPOSITES[a] === b;

export const isSameCell = (a: Cell, b: Cell) =>
  a.col === b.col && a.row === b.row;

export const isOutOfBounds = ({ col, row }: Cell) =>
  col < 0 || col >= COLS || row < 0 || row >= ROWS;

export const hitsBody = (cell: Cell, body: Cell[]) =>
  body.some((segment) => isSameCell(segment, cell));

// Elige entre las celdas libres; null si la serpiente ocupa todo el tablero
export function pickFreeCell(snake: Cell[]): Cell | null {
  const freeCells: Cell[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (!hitsBody({ col, row }, snake)) freeCells.push({ col, row });
    }
  }
  if (freeCells.length === 0) return null;
  return freeCells[Math.floor(Math.random() * freeCells.length)];
}

export function createFruit(snake: Cell[]): Fruit | null {
  const cell = pickFreeCell(snake);
  if (!cell) return null;
  const name = FRUIT_NAMES[Math.floor(Math.random() * FRUIT_NAMES.length)];
  return { ...cell, name };
}

export const levelFor = (fruitsEaten: number) =>
  1 + Math.floor(fruitsEaten / FRUITS_PER_LEVEL);

export const tickIntervalFor = (level: number) =>
  Math.max(MIN_TICK_MS, INITIAL_TICK_MS - (level - 1) * TICK_STEP_MS);
