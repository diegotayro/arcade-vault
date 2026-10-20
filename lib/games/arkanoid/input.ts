export type KeyState = Record<string, boolean | undefined>;

const SCROLL_KEYS = ["ArrowLeft", "ArrowRight", "Space"];
const PAUSE_KEYS = ["KeyP", "Escape"];

export interface InputHandlers {
  onPauseToggle: () => void;
  onMouseMove: (canvasX: number) => void;
}

export interface ArkanoidInput {
  keys: KeyState;
  attach: () => void;
  detach: () => void;
  reset: () => void;
}

export function createInput(
  canvas: HTMLCanvasElement,
  { onPauseToggle, onMouseMove }: InputHandlers,
): ArkanoidInput {
  const keys: KeyState = {};

  const onKeyDown = (event: KeyboardEvent) => {
    if (SCROLL_KEYS.includes(event.code)) event.preventDefault();
    if (PAUSE_KEYS.includes(event.code)) {
      if (!event.repeat) onPauseToggle();
      return;
    }
    keys[event.code] = true;
  };

  const onKeyUp = (event: KeyboardEvent) => {
    keys[event.code] = false;
  };

  // Escala la posición al tamaño CSS del canvas, como el original
  const onCanvasMouseMove = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    onMouseMove((event.clientX - rect.left) * scaleX);
  };

  const reset = () => {
    for (const code of Object.keys(keys)) keys[code] = false;
  };

  const attach = () => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("mousemove", onCanvasMouseMove);
  };

  const detach = () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    canvas.removeEventListener("mousemove", onCanvasMouseMove);
    reset();
  };

  return { keys, attach, detach, reset };
}
