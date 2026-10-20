import { MAX_INPUT_QUEUE } from "./constants";
import { isOppositeDirection } from "./entities";
import type { Direction } from "./types";

const TURN_KEYS: Record<string, Direction> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};
const PREVENT_DEFAULT_KEYS = [...Object.keys(TURN_KEYS), "Space"];
const PAUSE_KEYS = ["KeyP", "Escape"];

export interface InputHandlers {
  onPauseToggle: () => void;
  canTurn: () => boolean;
  getDirection: () => Direction;
}

export interface SnakeInput {
  nextTurn: () => Direction | undefined;
  attach: () => void;
  detach: () => void;
  reset: () => void;
}

export function createInput({
  onPauseToggle,
  canTurn,
  getDirection,
}: InputHandlers): SnakeInput {
  const queue: Direction[] = [];

  // Descarta giros repetidos o de reversa respecto al último giro conocido
  const enqueueTurn = (direction: Direction) => {
    if (queue.length >= MAX_INPUT_QUEUE) return;
    const reference = queue[queue.length - 1] ?? getDirection();
    if (direction === reference || isOppositeDirection(direction, reference)) {
      return;
    }
    queue.push(direction);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (PREVENT_DEFAULT_KEYS.includes(event.code)) event.preventDefault();
    if (PAUSE_KEYS.includes(event.code)) {
      if (!event.repeat) onPauseToggle();
      return;
    }
    const direction = TURN_KEYS[event.code];
    if (direction && canTurn()) enqueueTurn(direction);
  };

  const reset = () => {
    queue.length = 0;
  };

  const attach = () => window.addEventListener("keydown", onKeyDown);

  const detach = () => {
    window.removeEventListener("keydown", onKeyDown);
    reset();
  };

  return { nextTurn: () => queue.shift(), attach, detach, reset };
}
