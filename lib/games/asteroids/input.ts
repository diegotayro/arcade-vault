export type KeyState = Record<string, boolean | undefined>;

const GAME_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"];

export interface AsteroidsInput {
  keys: KeyState;
  pressed: (code: string) => boolean;
  attach: () => void;
  detach: () => void;
  reset: () => void;
}

export function createInput(): AsteroidsInput {
  const keys: KeyState = {};
  const justPressed: KeyState = {};

  const onKeyDown = (event: KeyboardEvent) => {
    if (GAME_KEYS.includes(event.code)) event.preventDefault();
    if (!keys[event.code]) justPressed[event.code] = true;
    keys[event.code] = true;
  };

  const onKeyUp = (event: KeyboardEvent) => {
    keys[event.code] = false;
  };

  const pressed = (code: string) => {
    const value = justPressed[code] === true;
    justPressed[code] = false;
    return value;
  };

  const reset = () => {
    for (const code of Object.keys(keys)) keys[code] = false;
    for (const code of Object.keys(justPressed)) justPressed[code] = false;
  };

  const attach = () => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
  };

  const detach = () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    reset();
  };

  return { keys, pressed, attach, detach, reset };
}
