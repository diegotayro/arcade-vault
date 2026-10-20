import { CELL_SIZE, FRUITS_SPRITESHEET_URL } from "./constants";
import type { Cell } from "./types";

export interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Coordenadas de references/source-assets/snake-assets/sprites.js (fila y=136–295)
export const FRUIT_SPRITES = {
  banana: { x: 34, y: 136, w: 110, h: 160 },
  orange: { x: 186, y: 136, w: 150, h: 160 },
  grape: { x: 378, y: 136, w: 110, h: 160 },
  garlic: { x: 540, y: 136, w: 130, h: 160 },
  eggplant: { x: 712, y: 136, w: 130, h: 160 },
  strawberry: { x: 894, y: 136, w: 110, h: 160 },
  cherry: { x: 1066, y: 136, w: 110, h: 160 },
  carrot: { x: 1228, y: 136, w: 130, h: 160 },
  mushroom: { x: 1400, y: 136, w: 130, h: 160 },
  broccoli: { x: 1582, y: 136, w: 110, h: 160 },
  watermelon: { x: 1734, y: 136, w: 150, h: 160 },
  pepper: { x: 1906, y: 136, w: 150, h: 160 },
  kiwi: { x: 2068, y: 136, w: 170, h: 160 },
  lemon: { x: 2250, y: 136, w: 140, h: 160 },
  peach: { x: 2432, y: 136, w: 130, h: 160 },
  peanut: { x: 2604, y: 136, w: 130, h: 160 },
  apple: { x: 2786, y: 136, w: 110, h: 160 },
  tomato: { x: 2948, y: 136, w: 130, h: 160 },
  berries: { x: 3110, y: 136, w: 150, h: 160 },
  grapes2: { x: 3302, y: 136, w: 110, h: 160 },
  pineapple: { x: 3454, y: 136, w: 150, h: 160 },
  melon: { x: 3637, y: 136, w: 130, h: 160 },
} as const satisfies Record<string, SpriteRect>;

export type FruitName = keyof typeof FRUIT_SPRITES;

export const FRUIT_NAMES = Object.keys(FRUIT_SPRITES) as FruitName[];

const FRUIT_PADDING = 3;

/** Carga el spritesheet; devuelve una función que cancela la carga pendiente. */
export function loadFruitsSpritesheet(
  onLoad: (image: HTMLImageElement) => void,
  onError: () => void,
): () => void {
  const image = new Image();
  image.onload = () => onLoad(image);
  image.onerror = onError;
  image.src = FRUITS_SPRITESHEET_URL;

  return () => {
    image.onload = null;
    image.onerror = null;
  };
}

// Escala el recorte para caber en la celda sin deformarlo y lo centra
export function drawFruit(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  name: FruitName,
  cell: Cell,
): void {
  const sprite: SpriteRect = FRUIT_SPRITES[name];
  const available = CELL_SIZE - FRUIT_PADDING * 2;
  const scale = Math.min(available / sprite.w, available / sprite.h);
  const width = sprite.w * scale;
  const height = sprite.h * scale;
  const x = cell.col * CELL_SIZE + (CELL_SIZE - width) / 2;
  const y = cell.row * CELL_SIZE + (CELL_SIZE - height) / 2;
  ctx.drawImage(image, sprite.x, sprite.y, sprite.w, sprite.h, x, y, width, height);
}
