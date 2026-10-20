import {
  BASE_DROP_INTERVAL,
  DROP_INTERVAL_STEP,
  HARD_DROP_POINTS,
  HEIGHT,
  LINES_PER_LEVEL,
  LINE_SCORES,
  MIN_DROP_INTERVAL,
  SOFT_DROP_POINTS,
  WALL_KICKS,
  WIDTH,
} from "./constants";
import {
  clearLines,
  collide,
  createBoard,
  merge,
  randomPiece,
  rotateCW,
} from "./entities";
import { createInput } from "./input";
import { drawFrame } from "./render";
import type { InputAction } from "./input";
import type {
  ActivePiece,
  Board,
  TetrisCallbacks,
  TetrisEngine,
  TetrisTheme,
} from "./types";

const levelFromLines = (lines: number) =>
  Math.floor(lines / LINES_PER_LEVEL) + 1;

const dropIntervalFor = (level: number) =>
  Math.max(
    MIN_DROP_INTERVAL,
    BASE_DROP_INTERVAL - (level - 1) * DROP_INTERVAL_STEP,
  );

export function createTetrisEngine(
  canvas: HTMLCanvasElement,
  callbacks: TetrisCallbacks,
): TetrisEngine {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is not available");
  const ctx: CanvasRenderingContext2D = context;

  let board: Board = createBoard();
  let current: ActivePiece = randomPiece();
  let next: ActivePiece = randomPiece();
  let score = 0;
  let lines = 0;
  let level = 1;
  let dropInterval = BASE_DROP_INTERVAL;
  let dropAccumulator = 0;
  let gameOver = false;
  let theme: TetrisTheme = "dark";

  let started = false;
  let destroyed = false;
  let manuallyPaused = false;
  let hiddenPaused = false;
  let frameId: number | null = null;
  let lastTime: number | null = null;

  const emitted = { score: -1, level: -1, paused: false };

  const isPaused = () => manuallyPaused || hiddenPaused;

  // Los callbacks se invocan solo cuando el valor cambia
  function syncCallbacks(force = false) {
    if (force || emitted.score !== score) callbacks.onScoreChange(score);
    if (force || emitted.level !== level) callbacks.onLevelChange(level);
    emitted.score = score;
    emitted.level = level;
  }

  function syncPause() {
    if (emitted.paused === isPaused()) return;
    emitted.paused = isPaused();
    callbacks.onPauseChange(emitted.paused);
  }

  // ── Estado del juego ────────────────────────────────────────────────────────
  function initGame() {
    board = createBoard();
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = BASE_DROP_INTERVAL;
    dropAccumulator = 0;
    gameOver = false;
    next = randomPiece();
    spawn();
    syncCallbacks(true);
  }

  function spawn() {
    current = next;
    next = randomPiece();
    if (collide(board, current.shape, current.x, current.y)) finishGame();
  }

  function finishGame() {
    gameOver = true;
    stopLoop();
    syncCallbacks();
    callbacks.onGameOver(score);
  }

  function addClearedLines(cleared: number) {
    if (cleared === 0) return;
    lines += cleared;
    score += LINE_SCORES[cleared] * level;
    level = levelFromLines(lines);
    dropInterval = dropIntervalFor(level);
  }

  function lockPiece() {
    merge(board, current);
    addClearedLines(clearLines(board));
    spawn();
  }

  function ghostY() {
    let y = current.y;
    while (!collide(board, current.shape, current.x, y + 1)) y++;
    return y;
  }

  // ── Acciones ────────────────────────────────────────────────────────────────
  function move(deltaX: number) {
    if (!collide(board, current.shape, current.x + deltaX, current.y)) {
      current.x += deltaX;
    }
  }

  function rotate() {
    const rotated = rotateCW(current.shape);
    const kick = WALL_KICKS.find(
      (offset) => !collide(board, rotated, current.x + offset, current.y),
    );
    if (kick === undefined) return;
    current.shape = rotated;
    current.x += kick;
  }

  function softDrop() {
    if (collide(board, current.shape, current.x, current.y + 1)) {
      lockPiece();
      return;
    }
    current.y++;
    score += SOFT_DROP_POINTS;
  }

  function hardDrop() {
    const landingY = ghostY();
    score += (landingY - current.y) * HARD_DROP_POINTS;
    current.y = landingY;
    lockPiece();
  }

  function togglePause() {
    if (manuallyPaused) resumeGame();
    else pauseGame();
  }

  function handleAction(action: InputAction) {
    if (gameOver) return;
    if (action === "pause") {
      togglePause();
      return;
    }
    if (isPaused()) return;

    if (action === "left") move(-1);
    else if (action === "right") move(1);
    else if (action === "rotate") rotate();
    else if (action === "softDrop") softDrop();
    else hardDrop();

    syncCallbacks();
    draw();
  }

  const input = createInput(handleAction);

  // ── Update y dibujo ─────────────────────────────────────────────────────────
  function update(deltaMs: number) {
    dropAccumulator += deltaMs;
    if (dropAccumulator < dropInterval) return;
    dropAccumulator = 0;
    if (collide(board, current.shape, current.x, current.y + 1)) lockPiece();
    else current.y++;
    syncCallbacks();
  }

  function draw() {
    drawFrame(ctx, {
      board,
      current,
      ghostY: ghostY(),
      next,
      score,
      lines,
      level,
      gameOver,
      theme,
    });
  }

  // ── Loop principal ──────────────────────────────────────────────────────────
  function loop(timestamp: number) {
    const deltaMs = lastTime === null ? 0 : timestamp - lastTime;
    lastTime = timestamp;
    frameId = null;
    update(deltaMs);
    draw();
    if (gameOver) return;
    frameId = requestAnimationFrame(loop);
  }

  const shouldRun = () => started && !destroyed && !gameOver && !isPaused();

  function startLoop() {
    if (frameId !== null || !shouldRun()) return;
    // Evita el salto de dt al reanudar
    lastTime = null;
    frameId = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (frameId === null) return;
    cancelAnimationFrame(frameId);
    frameId = null;
  }

  function applyPauseState() {
    syncPause();
    if (isPaused()) stopLoop();
    else startLoop();
  }

  function pauseGame() {
    if (!started || destroyed || gameOver || manuallyPaused) return;
    manuallyPaused = true;
    applyPauseState();
  }

  function resumeGame() {
    if (!started || destroyed || gameOver || !manuallyPaused) return;
    manuallyPaused = false;
    applyPauseState();
  }

  function onVisibilityChange() {
    if (gameOver) return;
    hiddenPaused = document.hidden;
    applyPauseState();
  }

  // ── API pública ─────────────────────────────────────────────────────────────
  return {
    start() {
      if (started || destroyed) return;
      started = true;
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      hiddenPaused = document.hidden;
      initGame();
      draw();
      input.attach();
      document.addEventListener("visibilitychange", onVisibilityChange);
      syncPause();
      startLoop();
    },

    pause: pauseGame,
    resume: resumeGame,

    endGame() {
      if (!started || destroyed || gameOver) return;
      finishGame();
      draw();
    },

    restart() {
      if (!started || destroyed) return;
      manuallyPaused = false;
      hiddenPaused = document.hidden;
      initGame();
      draw();
      syncPause();
      startLoop();
    },

    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopLoop();
      input.detach();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    },

    setTheme(newTheme) {
      theme = newTheme;
      if (started && !destroyed) draw();
    },
  };
}
