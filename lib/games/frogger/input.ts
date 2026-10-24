import type { Direction } from "./types";

const JUMP_KEYS: Record<string, Direction> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};
const PREVENT_DEFAULT_KEYS = [...Object.keys(JUMP_KEYS), "Space"];
const PAUSE_KEYS = ["KeyP", "Escape"];

export interface InputHandlers {
  onPauseToggle: () => void;
  canJump: () => boolean;
}

export interface FroggerInput {
  takePending: () => Direction | null;
  attach: () => void;
  detach: () => void;
  reset: () => void;
}

export function createInput({
  onPauseToggle,
  canJump,
}: InputHandlers): FroggerInput {
  let pendingDir: Direction | null = null;

  const onKeyDown = (event: KeyboardEvent) => {
    if (PREVENT_DEFAULT_KEYS.includes(event.code)) event.preventDefault();
    // un salto por pulsación: también descarta la auto-repetición del gamepad táctil
    if (event.repeat) return;
    if (PAUSE_KEYS.includes(event.code)) {
      onPauseToggle();
      return;
    }
    const direction = JUMP_KEYS[event.code];
    if (direction && canJump()) pendingDir = direction;
  };

  const reset = () => {
    pendingDir = null;
  };

  const takePending = () => {
    const direction = pendingDir;
    pendingDir = null;
    return direction;
  };

  // En `window`, donde el gamepad táctil despacha sus eventos sintéticos
  const attach = () => window.addEventListener("keydown", onKeyDown);

  const detach = () => {
    window.removeEventListener("keydown", onKeyDown);
    reset();
  };

  return { takePending, attach, detach, reset };
}
