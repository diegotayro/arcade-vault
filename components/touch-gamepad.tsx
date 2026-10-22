"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent,
  type ReactNode,
} from "react";

import {
  KEY_REPEAT_DELAY_MS,
  KEY_REPEAT_INTERVAL_MS,
  type DpadDirection,
  type TouchLayout,
} from "@/lib/games/touch-controls";

interface TouchGamepadProps {
  layout: TouchLayout;
  isPaused: boolean;
}

interface TouchKeyProps {
  code?: string;
  repeats?: boolean;
  isPaused: boolean;
  className: string;
  ariaLabel: string;
  children: ReactNode;
}

const DPAD_BUTTONS: Record<
  DpadDirection,
  { symbol: string; ariaLabel: string }
> = {
  up: { symbol: "▲", ariaLabel: "Arriba" },
  left: { symbol: "◀", ariaLabel: "Izquierda" },
  right: { symbol: "▶", ariaLabel: "Derecha" },
  down: { symbol: "▼", ariaLabel: "Abajo" },
};

const DPAD_ORDER: DpadDirection[] = ["up", "left", "right", "down"];

const dispatchKey = (type: "keydown" | "keyup", code: string, repeat = false) =>
  window.dispatchEvent(
    new KeyboardEvent(type, { code, repeat, bubbles: true, cancelable: true }),
  );

// Mantiene una tecla virtual pulsada mientras el dedo siga sobre el botón
function useHeldKey(
  code: string | undefined,
  repeats: boolean,
  isPaused: boolean,
) {
  const activePointer = useRef<number | null>(null);
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const release = useCallback(() => {
    if (activePointer.current === null || !code) return;
    activePointer.current = null;
    if (delayTimer.current) clearTimeout(delayTimer.current);
    if (repeatTimer.current) clearInterval(repeatTimer.current);
    delayTimer.current = null;
    repeatTimer.current = null;
    dispatchKey("keyup", code);
  }, [code]);

  useEffect(() => {
    if (isPaused) release();
  }, [isPaused, release]);

  useEffect(() => {
    const releaseWhenHidden = () => {
      if (document.hidden) release();
    };
    document.addEventListener("visibilitychange", releaseWhenHidden);
    return () => {
      document.removeEventListener("visibilitychange", releaseWhenHidden);
      release();
    };
  }, [release]);

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!code || activePointer.current !== null) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointer.current = event.pointerId;
    dispatchKey("keydown", code);
    if (!repeats) return;
    delayTimer.current = setTimeout(() => {
      dispatchKey("keydown", code, true);
      repeatTimer.current = setInterval(
        () => dispatchKey("keydown", code, true),
        KEY_REPEAT_INTERVAL_MS,
      );
    }, KEY_REPEAT_DELAY_MS);
  };

  const releaseOwnPointer = (event: PointerEvent<HTMLButtonElement>) => {
    if (activePointer.current === event.pointerId) release();
  };

  return {
    onPointerDown,
    onPointerUp: releaseOwnPointer,
    onPointerCancel: releaseOwnPointer,
    onLostPointerCapture: releaseOwnPointer,
  };
}

function TouchKey({
  code,
  repeats = false,
  isPaused,
  className,
  ariaLabel,
  children,
}: TouchKeyProps) {
  const handlers = useHeldKey(code, repeats, isPaused);
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      disabled={!code}
      {...handlers}
    >
      {children}
    </button>
  );
}

export function TouchGamepad({ layout, isPaused }: TouchGamepadProps) {
  const actionButtons = [layout.a, layout.b].flatMap((button, index) =>
    button ? [{ ...button, slot: index === 0 ? "a" : "b" }] : [],
  );

  return (
    <div
      className="touch-gamepad"
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="touch-dpad">
        {DPAD_ORDER.map((direction) => (
          <TouchKey
            key={direction}
            code={layout.dpad[direction]}
            repeats
            isPaused={isPaused}
            className={`touch-btn touch-dpad-${direction}`}
            ariaLabel={DPAD_BUTTONS[direction].ariaLabel}
          >
            {DPAD_BUTTONS[direction].symbol}
          </TouchKey>
        ))}
      </div>
      {actionButtons.length > 0 && (
        <div className="touch-actions">
          {actionButtons.map(({ slot, code, label }) => (
            <TouchKey
              key={slot}
              code={code}
              isPaused={isPaused}
              className={`touch-btn touch-action touch-action-${slot}`}
              ariaLabel={label}
            >
              <span className="touch-action-letter">{slot.toUpperCase()}</span>
              <span className="touch-action-label">{label}</span>
            </TouchKey>
          ))}
        </div>
      )}
    </div>
  );
}
