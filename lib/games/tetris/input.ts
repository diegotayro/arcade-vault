export type InputAction =
  "left" | "right" | "rotate" | "softDrop" | "hardDrop" | "pause";

const KEY_ACTIONS: Record<string, InputAction> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "rotate",
  KeyX: "rotate",
  ArrowDown: "softDrop",
  Space: "hardDrop",
  KeyP: "pause",
};

const SCROLL_KEYS = [
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
];

export interface TetrisInput {
  attach: () => void;
  detach: () => void;
}

export function createInput(
  onAction: (action: InputAction) => void,
): TetrisInput {
  // La repetición de keydown mueve la pieza, como en el original
  const onKeyDown = (event: KeyboardEvent) => {
    if (SCROLL_KEYS.includes(event.code)) event.preventDefault();
    const action = KEY_ACTIONS[event.code];
    if (action) onAction(action);
  };

  const attach = () => window.addEventListener("keydown", onKeyDown);
  const detach = () => window.removeEventListener("keydown", onKeyDown);

  return { attach, detach };
}
