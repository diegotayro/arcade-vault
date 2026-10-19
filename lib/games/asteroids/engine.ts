import {
  HEIGHT,
  INITIAL_LIVES,
  POWERUP_DROP_CHANCE,
  POWERUP_DURATION,
  WIDTH,
} from "./constants";
import {
  Asteroid,
  Bullet,
  Particle,
  PowerUp,
  Ship,
  dist,
  rand,
} from "./entities";
import { createInput } from "./input";
import type {
  AsteroidsCallbacks,
  AsteroidsEngine,
  AsteroidsState,
} from "./types";

const MAX_DT = 0.05;
const SAFE_SPAWN_DISTANCE = 130;
const RESPAWN_DELAY = 2;
const SHIP_COLLISION_FACTOR = 0.82;
const GUARANTEED_POWERUP_KILLS = 5;
const INITIAL_ASTEROIDS = 4;

export function createAsteroidsEngine(
  canvas: HTMLCanvasElement,
  callbacks: AsteroidsCallbacks,
): AsteroidsEngine {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is not available");
  const ctx: CanvasRenderingContext2D = context;

  const input = createInput();

  let ship = new Ship();
  let bullets: Bullet[] = [];
  let asteroids: Asteroid[] = [];
  let particles: Particle[] = [];
  let powerUps: PowerUp[] = [];
  let score = 0;
  let lives = INITIAL_LIVES;
  let level = 1;
  let state: AsteroidsState = "playing";
  let deadTimer = 0;
  let powerUpSpawned = false;
  let killsSinceSpawn = 0;

  let started = false;
  let destroyed = false;
  let manuallyPaused = false;
  let hiddenPaused = false;
  let frameId: number | null = null;
  let lastTime: number | null = null;

  const emitted = { score: -1, lives: -1, level: -1 };

  // Los callbacks se invocan solo cuando el valor cambia
  function syncCallbacks(force = false) {
    if (force || emitted.score !== score) callbacks.onScoreChange(score);
    if (force || emitted.lives !== lives) callbacks.onLivesChange(lives);
    if (force || emitted.level !== level) callbacks.onLevelChange(level);
    emitted.score = score;
    emitted.lives = lives;
    emitted.level = level;
  }

  // ── Estado del juego ────────────────────────────────────────────────────────
  function spawnAsteroids(count: number) {
    for (let i = 0; i < count; i++) {
      let x: number;
      let y: number;
      do {
        x = rand(0, WIDTH);
        y = rand(0, HEIGHT);
      } while (Math.hypot(x - WIDTH / 2, y - HEIGHT / 2) < SAFE_SPAWN_DISTANCE);
      asteroids.push(new Asteroid(x, y, 3));
    }
  }

  function initGame() {
    ship = new Ship();
    bullets = [];
    asteroids = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    score = 0;
    lives = INITIAL_LIVES;
    level = 1;
    state = "playing";
    spawnAsteroids(INITIAL_ASTEROIDS);
    syncCallbacks(true);
  }

  function nextLevel() {
    level++;
    bullets = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    ship.reset();
    spawnAsteroids(3 + level);
  }

  function explode(x: number, y: number, count = 8) {
    for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
  }

  function finishGame() {
    state = "gameover";
    syncCallbacks();
    callbacks.onGameOver(score);
  }

  function killShip() {
    explode(ship.x, ship.y, 14);
    ship.dead = true;
    lives--;
    if (lives <= 0) {
      finishGame();
    } else {
      state = "dead";
      deadTimer = RESPAWN_DELAY;
    }
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  function updateParticles(dt: number) {
    particles.forEach((particle) => particle.update(dt));
    particles = particles.filter((particle) => !particle.dead);
  }

  function collectPowerUps() {
    for (const powerUp of powerUps) {
      if (!powerUp.dead && dist(ship, powerUp) < ship.radius + powerUp.radius) {
        powerUp.dead = true;
        ship.tripleShot = POWERUP_DURATION;
      }
    }
  }

  function maybeDropPowerUp(x: number, y: number) {
    if (powerUpSpawned) return;
    killsSinceSpawn++;
    const guaranteed = killsSinceSpawn >= GUARANTEED_POWERUP_KILLS;
    if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
      powerUps.push(new PowerUp(x, y));
      powerUpSpawned = true;
    }
  }

  function resolveBulletHits() {
    const fragments: Asteroid[] = [];
    for (const bullet of bullets) {
      for (const asteroid of asteroids) {
        if (
          asteroid.dead ||
          bullet.dead ||
          dist(bullet, asteroid) >= asteroid.radius
        ) {
          continue;
        }
        bullet.dead = true;
        asteroid.dead = true;
        score += asteroid.points;
        explode(asteroid.x, asteroid.y, asteroid.size * 5);
        fragments.push(...asteroid.split());
        maybeDropPowerUp(asteroid.x, asteroid.y);
      }
    }
    asteroids = asteroids
      .filter((asteroid) => !asteroid.dead)
      .concat(fragments);
    bullets = bullets.filter((bullet) => !bullet.dead);
  }

  function resolveShipCollision() {
    if (ship.invincible > 0) return;
    for (const asteroid of asteroids) {
      if (
        dist(ship, asteroid) <
        ship.radius + asteroid.radius * SHIP_COLLISION_FACTOR
      ) {
        killShip();
        break;
      }
    }
  }

  function updateGameOver(dt: number) {
    if (input.pressed("Space")) {
      initGame();
      return;
    }
    updateParticles(dt);
  }

  function updateDead(dt: number) {
    deadTimer -= dt;
    updateParticles(dt);
    asteroids.forEach((asteroid) => asteroid.update(dt));
    if (deadTimer <= 0) {
      state = "playing";
      ship.reset();
    }
  }

  function updatePlaying(dt: number) {
    if (input.pressed("Space")) bullets.push(...ship.tryShoot());

    ship.update(dt, input.keys);
    bullets.forEach((bullet) => bullet.update(dt));
    asteroids.forEach((asteroid) => asteroid.update(dt));
    particles.forEach((particle) => particle.update(dt));
    powerUps.forEach((powerUp) => powerUp.update(dt));

    bullets = bullets.filter((bullet) => !bullet.dead);
    particles = particles.filter((particle) => !particle.dead);
    powerUps = powerUps.filter((powerUp) => !powerUp.dead);

    collectPowerUps();
    resolveBulletHits();
    resolveShipCollision();

    if (asteroids.length === 0) nextLevel();
  }

  function update(dt: number) {
    if (state === "gameover") updateGameOver(dt);
    else if (state === "dead") updateDead(dt);
    else updatePlaying(dt);
    syncCallbacks();
  }

  // ── Draw ────────────────────────────────────────────────────────────────────
  function drawLifeIcon(x: number, y: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawHUD() {
    ctx.fillStyle = "#fff";
    ctx.font = "15px monospace";
    ctx.textBaseline = "alphabetic";

    ctx.textAlign = "left";
    ctx.fillText(`SCORE  ${score}`, 14, 26);

    ctx.textAlign = "center";
    ctx.fillText(`NIVEL ${level}`, WIDTH / 2, 26);

    for (let i = 0; i < lives; i++) drawLifeIcon(WIDTH - 16 - i * 22, 18);

    if (ship.tripleShot > 0) {
      ctx.textAlign = "left";
      ctx.fillStyle = "#0ff";
      ctx.fillText(`3x  ${ship.tripleShot.toFixed(1)}s`, 14, 46);
    }
  }

  function drawOverlay(title: string, subtitle: string) {
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 46px monospace";
    ctx.fillText(title, WIDTH / 2, HEIGHT / 2 - 18);
    ctx.font = "18px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillText(subtitle, WIDTH / 2, HEIGHT / 2 + 22);
  }

  function draw() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    particles.forEach((particle) => particle.draw(ctx));
    asteroids.forEach((asteroid) => asteroid.draw(ctx));
    powerUps.forEach((powerUp) => powerUp.draw(ctx));
    bullets.forEach((bullet) => bullet.draw(ctx));
    ship.draw(ctx);

    drawHUD();

    if (state === "gameover") {
      drawOverlay(
        "GAME OVER",
        `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`,
      );
    }
  }

  // ── Loop principal ──────────────────────────────────────────────────────────
  function loop(timestamp: number) {
    const dt =
      lastTime === null ? 0 : Math.min((timestamp - lastTime) / 1000, MAX_DT);
    lastTime = timestamp;
    update(dt);
    draw();
    frameId = requestAnimationFrame(loop);
  }

  const shouldRun = () =>
    started && !destroyed && !manuallyPaused && !hiddenPaused;

  function startLoop() {
    if (frameId !== null || !shouldRun()) return;
    // Evita el salto de dt al reanudar y descarta teclas pulsadas en pausa
    lastTime = null;
    input.reset();
    frameId = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (frameId === null) return;
    cancelAnimationFrame(frameId);
    frameId = null;
  }

  function onVisibilityChange() {
    hiddenPaused = document.hidden;
    if (hiddenPaused) stopLoop();
    else startLoop();
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
      startLoop();
    },

    pause() {
      manuallyPaused = true;
      stopLoop();
      input.reset();
    },

    resume() {
      manuallyPaused = false;
      startLoop();
    },

    endGame() {
      if (!started || destroyed || state === "gameover") return;
      explode(ship.x, ship.y, 14);
      ship.dead = true;
      lives = 0;
      finishGame();
      draw();
    },

    restart() {
      if (!started || destroyed) return;
      initGame();
      draw();
    },

    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopLoop();
      input.detach();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    },
  };
}
