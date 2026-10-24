// Layout del gamepad virtual por juego. Cada tecla usa el mismo `code` que el teclado.

export type DpadDirection = "up" | "down" | "left" | "right";

export interface TouchButton {
  label: string;
  code: string;
}

export interface TouchLayout {
  dpad: Partial<Record<DpadDirection, string>>; // ausente = deshabilitada
  a?: TouchButton;
  b?: TouchButton;
}

export const KEY_REPEAT_DELAY_MS = 250;
export const KEY_REPEAT_INTERVAL_MS = 60;

export const TOUCH_LAYOUTS = {
  asteroids: {
    dpad: { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp" },
    a: { label: "DISPARO", code: "Space" },
  },
  tetris: {
    dpad: {
      left: "ArrowLeft",
      right: "ArrowRight",
      up: "ArrowUp",
      down: "ArrowDown",
    },
    a: { label: "ROTAR", code: "KeyX" },
    b: { label: "CAÍDA", code: "Space" },
  },
  arkanoid: {
    dpad: { left: "ArrowLeft", right: "ArrowRight" },
  },
  snake: {
    dpad: {
      left: "ArrowLeft",
      right: "ArrowRight",
      up: "ArrowUp",
      down: "ArrowDown",
    },
  },
  frogger: {
    dpad: {
      left: "ArrowLeft",
      right: "ArrowRight",
      up: "ArrowUp",
      down: "ArrowDown",
    },
  },
} as const satisfies Record<string, TouchLayout>;

export type TouchGameId = keyof typeof TOUCH_LAYOUTS;

export const getTouchLayout = (gameId: string): TouchLayout | null =>
  gameId in TOUCH_LAYOUTS ? TOUCH_LAYOUTS[gameId as TouchGameId] : null;
