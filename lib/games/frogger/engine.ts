import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GOAL_COUNT,
  INITIAL_LIVES,
  JUMP_MS,
  MAX_DT_MS,
  POINTS_PER_GOAL,
  POINTS_PER_ROUND,
  POINTS_PER_ROW,
  POINTS_PER_SECOND_LEFT,
  ROW_GOALS,
  ROW_START,
  COLS,
  DEFAULT_SKIN,
} from "./constants";
import {
  buildLanes,
  checkGoal,
  checkRoadCollision,
  createFrog,
  findLane,
  getSupport,
  isOffRiverEdge,
  isRiverRow,
  jumpTarget,
  laneShift,
  moveLanes,
  roundTimeFor,
} from "./entities";
import { createInput } from "./input";
import { createRenderer } from "./render";
import type {
  FroggerCallbacks,
  FroggerEngine,
  FroggerSkin,
  FroggerState,
  Frog,
  Lane,
} from "./types";

const MS_PER_SECOND = 1000;

const emptyGoals = () => Array<boolean>(GOAL_COUNT).fill(false);

export function createFroggerEngine(
  canvas: HTMLCanvasElement,
  callbacks: FroggerCallbacks,
): FroggerEngine {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is not available");
  const renderScene = createRenderer(context);

  let frog: Frog = createFrog();
  let lanes: Lane[] = [];
  let goals = emptyGoals();
  let state: FroggerState = "playing";
  let score = 0;
  let lives = INITIAL_LIVES;
  let level = 1;
  let timeLeftMs = 0;
  let skin: FroggerSkin = DEFAULT_SKIN;
  let bestRow = ROW_START; // fila más alta alcanzada por la rana actual

  let started = false;
  let destroyed = false;
  let manuallyPaused = false;
  let hiddenPaused = false;
  let frameId: number | null = null;
  let lastTime: number | null = null;

  const emitted = { score: -1, lives: -1, level: -1, paused: false };

  const isPaused = () => manuallyPaused || hiddenPaused;
  const isPlaying = () => state === "playing";
  const roundTimeMs = () => roundTimeFor(level) * MS_PER_SECOND;

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
  function respawnFrog() {
    frog = createFrog();
    timeLeftMs = roundTimeMs();
    input.reset();
  }

  function initGame() {
    state = "playing";
    score = 0;
    lives = INITIAL_LIVES;
    level = 1;
    goals = emptyGoals();
    lanes = buildLanes(level);
    bestRow = ROW_START;
    respawnFrog();
    syncCallbacks(true);
  }

  function finishGame() {
    state = "gameover";
    lives = 0;
    manuallyPaused = false;
    stopLoop();
    syncPause();
    syncCallbacks();
    callbacks.onGameOver(score);
  }

  function killFrog() {
    lives--;
    if (lives === 0) {
      finishGame();
      return;
    }
    syncCallbacks();
    respawnFrog();
  }

  function completeRound() {
    score += POINTS_PER_ROUND;
    goals = emptyGoals();
    level++;
    lanes = buildLanes(level);
  }

  function reachGoal(index: number) {
    goals[index] = true;
    const secondsLeft = Math.floor(timeLeftMs / MS_PER_SECOND);
    score += POINTS_PER_GOAL + secondsLeft * POINTS_PER_SECOND_LEFT;
    if (goals.every(Boolean)) completeRound();
    bestRow = ROW_START;
    respawnFrog();
  }

  // ── Update y dibujo ─────────────────────────────────────────────────────────
  function startJump() {
    const direction = input.takePending();
    if (!direction) return;
    frog.facing = direction;
    const target = jumpTarget(frog, direction);
    if (!target) return;
    frog.animating = true;
    frog.animT = 0;
    frog.targetCol = target.col;
    frog.targetRow = target.row;
  }

  function land() {
    frog.col = frog.targetCol;
    frog.row = frog.targetRow;
    frog.animating = false;

    if (frog.row < bestRow) {
      score += POINTS_PER_ROW;
      bestRow = frog.row;
    }

    if (frog.row === ROW_GOALS) {
      const goal = checkGoal(frog);
      if (goal === null || goals[goal]) killFrog();
      else reachGoal(goal);
      return;
    }

    // Fuera del río la rana vuelve a la cuadrícula
    if (!isRiverRow(frog.row)) {
      frog.col = Math.min(Math.max(Math.round(frog.col), 0), COLS - 1);
    }
  }

  function updateFrog(dt: number) {
    if (!frog.animating) startJump();
    if (frog.animating) {
      frog.animT += dt;
      if (frog.animT >= JUMP_MS) land();
      return;
    }

    if (checkRoadCollision(frog, lanes)) {
      killFrog();
      return;
    }
    if (!isRiverRow(frog.row)) return;

    const lane = findLane(lanes, frog.row);
    if (!lane || !getSupport(frog, lanes)) {
      killFrog();
      return;
    }
    frog.col += laneShift(lane, dt);
    if (isOffRiverEdge(frog)) killFrog();
  }

  function update(dt: number) {
    moveLanes(lanes, dt);
    updateFrog(dt);
    if (!isPlaying()) return;

    timeLeftMs -= dt;
    if (timeLeftMs <= 0) killFrog();
    syncCallbacks();
  }

  function draw() {
    renderScene({
      frog,
      lanes,
      goals,
      state,
      score,
      level,
      lives,
      timeLeft: Math.max(timeLeftMs, 0) / MS_PER_SECOND,
      roundTime: roundTimeFor(level),
      skin,
    });
  }

  // ── Loop principal ──────────────────────────────────────────────────────────
  // En pausa el loop sigue dibujando, pero no actualiza
  function loop(timestamp: number) {
    const dt =
      lastTime === null ? 0 : Math.min(timestamp - lastTime, MAX_DT_MS);
    lastTime = timestamp;
    frameId = null;
    if (!isPaused()) update(dt);
    draw();
    if (!isPlaying() || destroyed) return;
    frameId = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (frameId !== null || destroyed || !isPlaying()) return;
    lastTime = null;
    frameId = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (frameId === null) return;
    cancelAnimationFrame(frameId);
    frameId = null;
  }

  function pauseGame() {
    if (!started || destroyed || !isPlaying() || manuallyPaused) return;
    manuallyPaused = true;
    syncPause();
  }

  function resumeGame() {
    if (!started || destroyed || !isPlaying() || !manuallyPaused) return;
    manuallyPaused = false;
    syncPause();
  }

  function togglePause() {
    if (manuallyPaused) resumeGame();
    else pauseGame();
  }

  function onVisibilityChange() {
    if (!isPlaying()) return;
    hiddenPaused = document.hidden;
    syncPause();
  }

  const input = createInput({
    onPauseToggle: togglePause,
    canJump: () => isPlaying() && !isPaused(),
  });

  // ── API pública ─────────────────────────────────────────────────────────────
  return {
    start() {
      if (started || destroyed) return;
      started = true;
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      hiddenPaused = document.hidden;
      initGame();
      input.attach();
      document.addEventListener("visibilitychange", onVisibilityChange);
      syncPause();
      startLoop();
    },

    pause: pauseGame,
    resume: resumeGame,

    endGame() {
      if (!started || destroyed || !isPlaying()) return;
      finishGame();
      draw();
    },

    restart() {
      if (!started || destroyed) return;
      manuallyPaused = false;
      hiddenPaused = document.hidden;
      stopLoop();
      initGame();
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

    // Redibuja al instante (también en pausa o tras game over) sin tocar el estado
    setSkin(newSkin) {
      skin = newSkin;
      if (started && !destroyed) draw();
    },
  };
}
