import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_SKIN,
  MAX_DT,
  POINTS_PER_FRUIT,
  TOTAL_CELLS,
} from "./constants";
import {
  createFruit,
  createSnake,
  hitsBody,
  INITIAL_DIRECTION,
  isOutOfBounds,
  isSameCell,
  levelFor,
  nextHead,
  tickIntervalFor,
  type Fruit,
} from "./entities";
import { createInput } from "./input";
import { createRenderer } from "./render";
import { loadFruitsSpritesheet } from "./sprites";
import type {
  Cell,
  Direction,
  SnakeCallbacks,
  SnakeEngine,
  SnakeSkin,
  SnakeState,
} from "./types";

export function createSnakeEngine(
  canvas: HTMLCanvasElement,
  callbacks: SnakeCallbacks,
): SnakeEngine {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is not available");
  const renderScene = createRenderer(context);

  let snake: Cell[] = [];
  let fruit: Fruit | null = null;
  let direction: Direction = INITIAL_DIRECTION;
  let spritesheet: HTMLImageElement | null = null;
  let state: SnakeState = "playing";
  let skin: SnakeSkin = DEFAULT_SKIN;
  let score = 0;
  let fruitsEaten = 0;
  let level = 1;
  let tickAccumulator = 0;

  let started = false;
  let ready = false;
  let destroyed = false;
  let manuallyPaused = false;
  let hiddenPaused = false;
  let frameId: number | null = null;
  let lastTime: number | null = null;
  let cancelSpritesheetLoad: (() => void) | null = null;

  const emitted = { score: -1, level: -1, paused: false };

  const isPaused = () => manuallyPaused || hiddenPaused;
  const isPlaying = () => state === "playing";

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
    state = "playing";
    score = 0;
    fruitsEaten = 0;
    level = 1;
    tickAccumulator = 0;
    direction = INITIAL_DIRECTION;
    snake = createSnake();
    fruit = createFruit(snake);
    syncCallbacks(true);
  }

  function finishGame(finalState: "gameover" | "win") {
    state = finalState;
    manuallyPaused = false;
    stopLoop();
    syncPause();
    syncCallbacks();
    callbacks.onGameOver(score);
  }

  // ── Update y dibujo ─────────────────────────────────────────────────────────
  function eatFruit() {
    score += POINTS_PER_FRUIT;
    fruitsEaten++;
    level = levelFor(fruitsEaten);
  }

  function step() {
    const turn = input.nextTurn();
    if (turn) direction = turn;

    const head = nextHead(snake[0], direction);
    const willEat = fruit !== null && isSameCell(head, fruit);
    // Si no come, la cola se libera en este mismo tick
    const obstacles = willEat ? snake : snake.slice(0, -1);
    if (isOutOfBounds(head) || hitsBody(head, obstacles)) {
      finishGame("gameover");
      return;
    }

    snake.unshift(head);
    if (!willEat) {
      snake.pop();
      return;
    }

    eatFruit();
    fruit = createFruit(snake);
    if (!fruit || snake.length >= TOTAL_CELLS) finishGame("win");
  }

  function update(dt: number) {
    tickAccumulator += dt * 1000;
    while (isPlaying() && tickAccumulator >= tickIntervalFor(level)) {
      tickAccumulator -= tickIntervalFor(level);
      step();
    }
    syncCallbacks();
  }

  function draw() {
    if (!spritesheet) return;
    renderScene({
      image: spritesheet,
      snake,
      fruit,
      direction,
      state,
      skin,
      score,
      level,
    });
  }

  // ── Loop principal ──────────────────────────────────────────────────────────
  function loop(timestamp: number) {
    const dt =
      lastTime === null ? 0 : Math.min((timestamp - lastTime) / 1000, MAX_DT);
    lastTime = timestamp;
    frameId = null;
    update(dt);
    draw();
    if (!isPlaying()) return;
    frameId = requestAnimationFrame(loop);
  }

  const shouldRun = () => ready && !destroyed && isPlaying() && !isPaused();

  function startLoop() {
    if (frameId !== null || !shouldRun()) return;
    // Evita el salto de dt al reanudar
    lastTime = null;
    tickAccumulator = 0;
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
    if (!ready || destroyed || !isPlaying() || manuallyPaused) return;
    manuallyPaused = true;
    applyPauseState();
  }

  function resumeGame() {
    if (!ready || destroyed || !isPlaying() || !manuallyPaused) return;
    manuallyPaused = false;
    applyPauseState();
  }

  function togglePause() {
    if (manuallyPaused) resumeGame();
    else pauseGame();
  }

  function onVisibilityChange() {
    if (!isPlaying()) return;
    hiddenPaused = document.hidden;
    applyPauseState();
  }

  const input = createInput({
    onPauseToggle: togglePause,
    canTurn: () => isPlaying() && !isPaused(),
    getDirection: () => direction,
  });

  function onSpritesheetLoaded(image: HTMLImageElement) {
    cancelSpritesheetLoad = null;
    if (destroyed) return;
    spritesheet = image;
    ready = true;
    hiddenPaused = document.hidden;
    initGame();
    draw();
    input.attach();
    document.addEventListener("visibilitychange", onVisibilityChange);
    syncPause();
    startLoop();
  }

  // ── API pública ─────────────────────────────────────────────────────────────
  return {
    start() {
      if (started || destroyed) return;
      started = true;
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      cancelSpritesheetLoad = loadFruitsSpritesheet(onSpritesheetLoaded, () =>
        console.error("Failed to load fruits spritesheet"),
      );
    },

    pause: pauseGame,
    resume: resumeGame,

    endGame() {
      if (!ready || destroyed || !isPlaying()) return;
      finishGame("gameover");
      draw();
    },

    restart() {
      if (!ready || destroyed) return;
      manuallyPaused = false;
      hiddenPaused = document.hidden;
      stopLoop();
      input.reset();
      initGame();
      draw();
      syncPause();
      startLoop();
    },

    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelSpritesheetLoad?.();
      stopLoop();
      input.detach();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    },

    // Redibuja al instante (también en pausa) sin tocar el estado del juego
    setSkin(newSkin) {
      skin = newSkin;
      if (started && !destroyed) draw();
    },
  };
}
