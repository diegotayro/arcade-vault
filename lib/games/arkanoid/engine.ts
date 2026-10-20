import {
  BOUNCE_SOUND_URL,
  BREAK_SOUND_URL,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  EXPLOSION_DURATION,
  INITIAL_LIVES,
  MAX_DT,
  MAX_LEVEL,
  PADDLE_BOUNCE_TOLERANCE,
  PADDLE_SPEED,
  POINTS_PER_BLOCK,
} from "./constants";
import {
  collidesWithBlock,
  createBall,
  createBlocks,
  createPaddle,
} from "./entities";
import { createInput } from "./input";
import { LEVELS } from "./levels";
import { loadSpritesheet } from "./sprites";
import type {
  ArkanoidCallbacks,
  ArkanoidEngine,
  ArkanoidState,
  Ball,
  Block,
  Explosion,
  Paddle,
} from "./types";

// Reproduce un clon del audio; el Promise de play() se captura por si el navegador lo bloquea
function createSoundPlayer(url: string): () => void {
  const audio = new Audio(url);
  return () => {
    const clone = audio.cloneNode() as HTMLAudioElement;
    clone.play().catch(() => undefined);
  };
}

export function createArkanoidEngine(
  canvas: HTMLCanvasElement,
  callbacks: ArkanoidCallbacks,
): ArkanoidEngine {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is not available");
  const ctx: CanvasRenderingContext2D = context;

  const playBounce = createSoundPlayer(BOUNCE_SOUND_URL);
  const playBreak = createSoundPlayer(BREAK_SOUND_URL);

  let paddle: Paddle = createPaddle();
  let ball: Ball = createBall(paddle, LEVELS[0].speed);
  let blocks: Block[] = [];
  let explosions: Explosion[] = [];
  let spritesheet: HTMLImageElement | null = null;
  let state: ArkanoidState = "playing";
  let score = 0;
  let lives = INITIAL_LIVES;
  let level = 1;

  let started = false;
  let ready = false;
  let destroyed = false;
  let manuallyPaused = false;
  let hiddenPaused = false;
  let frameId: number | null = null;
  let lastTime: number | null = null;
  let cancelSpritesheetLoad: (() => void) | null = null;

  const emitted = { score: -1, lives: -1, level: -1, paused: false };

  const isPaused = () => manuallyPaused || hiddenPaused;
  const isPlaying = () => state === "playing";

  // Los callbacks se invocan solo cuando el valor cambia
  function syncCallbacks(force = false) {
    if (force || emitted.score !== score) callbacks.onScoreChange(score);
    if (force || emitted.lives !== lives) callbacks.onLivesChange(lives);
    if (force || emitted.level !== level) callbacks.onLevelChange(level);
    emitted.score = score;
    emitted.lives = lives;
    emitted.level = level;
  }

  function syncPause() {
    if (emitted.paused === isPaused()) return;
    emitted.paused = isPaused();
    callbacks.onPauseChange(emitted.paused);
  }

  // ── Estado del juego ────────────────────────────────────────────────────────
  function loadLevel(nextLevel: number) {
    level = nextLevel;
    const levelData = LEVELS[level - 1];
    blocks = createBlocks(levelData);
    explosions = [];
    ball = createBall(paddle, levelData.speed);
  }

  function initGame() {
    state = "playing";
    score = 0;
    lives = INITIAL_LIVES;
    paddle = createPaddle();
    loadLevel(1);
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
  function movePaddleTo(centerX: number) {
    paddle.x = Math.max(
      0,
      Math.min(CANVAS_WIDTH - paddle.w, centerX - paddle.w / 2),
    );
  }

  function updatePaddle(dt: number) {
    if (input.keys.ArrowLeft) {
      paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt);
    }
    if (input.keys.ArrowRight) {
      paddle.x = Math.min(
        CANVAS_WIDTH - paddle.w,
        paddle.x + PADDLE_SPEED * dt,
      );
    }
  }

  function bounceOnWalls() {
    if (ball.x <= 0) {
      ball.x = 0;
      ball.vx = Math.abs(ball.vx);
      playBounce();
    }
    if (ball.x + ball.w >= CANVAS_WIDTH) {
      ball.x = CANVAS_WIDTH - ball.w;
      ball.vx = -Math.abs(ball.vx);
      playBounce();
    }
    if (ball.y <= 0) {
      ball.y = 0;
      ball.vy = Math.abs(ball.vy);
      playBounce();
    }
  }

  function bounceOnPaddle() {
    const touchesPaddle =
      ball.vy > 0 &&
      ball.x + ball.w > paddle.x &&
      ball.x < paddle.x + paddle.w &&
      ball.y + ball.h >= paddle.y &&
      ball.y + ball.h <= paddle.y + paddle.h + PADDLE_BOUNCE_TOLERANCE;
    if (!touchesPaddle) return;
    ball.y = paddle.y - ball.h;
    ball.vy = -Math.abs(ball.vy);
    playBounce();
  }

  function breakBlock(block: Block) {
    block.alive = false;
    explosions.push({
      x: block.x,
      y: block.y,
      w: block.w,
      h: block.h,
      color: block.color,
      elapsed: 0,
    });
    score += POINTS_PER_BLOCK;
    ball.vy = -ball.vy;
    playBreak();

    if (blocks.some((candidate) => candidate.alive)) return;
    if (level < MAX_LEVEL) loadLevel(level + 1);
    else finishGame("win");
  }

  // Un solo bloque destruido por frame
  function collideWithBlocks() {
    const hitBlock = blocks.find(
      (block) => block.alive && collidesWithBlock(ball, block),
    );
    if (hitBlock) breakBlock(hitBlock);
  }

  function updateExplosions(dt: number) {
    for (const explosion of explosions) explosion.elapsed += dt * 1000;
    explosions = explosions.filter(
      (explosion) => explosion.elapsed < EXPLOSION_DURATION,
    );
  }

  function loseLife() {
    lives--;
    if (lives <= 0) {
      lives = 0;
      finishGame("gameover");
      return;
    }
    ball = createBall(paddle, LEVELS[level - 1].speed);
  }

  function update(dt: number) {
    updatePaddle(dt);

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    bounceOnWalls();
    bounceOnPaddle();
    collideWithBlocks();
    updateExplosions(dt);

    if (isPlaying() && ball.y > CANVAS_HEIGHT) loseLife();
    syncCallbacks();
  }

  function draw() {
    // El dibujo se conecta con render.ts en el paso 9
    void ctx;
    void spritesheet;
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

  const input = createInput(canvas, {
    onPauseToggle: togglePause,
    onMouseMove(canvasX) {
      if (isPlaying() && !isPaused()) movePaddleTo(canvasX);
    },
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
      cancelSpritesheetLoad = loadSpritesheet(onSpritesheetLoaded, () =>
        console.error("Failed to load spritesheet"),
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
  };
}
