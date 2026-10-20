import { COLS, PIECE_TYPES_COUNT, PIECES, ROWS } from "./constants";
import type { ActivePiece, Board, PieceType } from "./types";

export const createBoard = (): Board =>
  Array.from({ length: ROWS }, () => new Array(COLS).fill(0));

export function randomPiece(): ActivePiece {
  const type = (Math.floor(Math.random() * PIECE_TYPES_COUNT) + 1) as PieceType;
  const shape = PIECES[type]!.map((row) => [...row]);
  return {
    type,
    shape,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0,
  };
}

export function collide(
  board: Board,
  shape: readonly (readonly number[])[],
  offsetX: number,
  offsetY: number,
): boolean {
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (!shape[row][col]) continue;
      const x = offsetX + col;
      const y = offsetY + row;
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y >= 0 && board[y][x]) return true;
    }
  }
  return false;
}

export function rotateCW(shape: readonly (readonly number[])[]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      result[col][rows - 1 - row] = shape[row][col];
    }
  }
  return result;
}

export function merge(board: Board, piece: ActivePiece): void {
  piece.shape.forEach((rowCells, row) => {
    rowCells.forEach((cell, col) => {
      if (cell) board[piece.y + row][piece.x + col] = cell as PieceType;
    });
  });
}

// Elimina las filas completas (mutando el tablero) y devuelve cuántas fueron
export function clearLines(board: Board): number {
  let cleared = 0;
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row].every((cell) => cell !== 0)) {
      board.splice(row, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      row++;
    }
  }
  return cleared;
}
