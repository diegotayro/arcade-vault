import { HEIGHT, SKINS, WIDTH } from "./constants";
import {
  rand,
  type Asteroid,
  type Bullet,
  type Particle,
  type PowerUp,
  type Ship,
} from "./entities";
import type {
  AsteroidsSkin,
  DrawStyle,
  EntityColors,
  SkinDefinition,
} from "./types";

export interface RenderState {
  ship: Ship;
  bullets: Bullet[];
  asteroids: Asteroid[];
  particles: Particle[];
  powerUps: PowerUp[];
  score: number;
  lives: number;
  level: number;
  isGameOver: boolean;
  skin: AsteroidsSkin;
}

interface StyleMetrics {
  lineScale: number;
  bulletScale: number;
  lineJoin: CanvasLineJoin;
}

const STYLE_METRICS: Record<DrawStyle, StyleMetrics> = {
  vector: { lineScale: 1, bulletScale: 1, lineJoin: "round" },
  glow: { lineScale: 1.4, bulletScale: 1.2, lineJoin: "round" },
  soft: { lineScale: 2, bulletScale: 1.6, lineJoin: "round" },
  pixel: { lineScale: 2, bulletScale: 2, lineJoin: "miter" },
};

// El estilo pixel dibuja el mundo a 1/PIXEL_SCALE y lo escala sin suavizado
const PIXEL_SCALE = 3;
// El neón dibuja las figuras a 1/GLOW_SCALE y al escalarlas con suavizado
// quedan difusas: un halo barato en lugar de shadowBlur por figura
const GLOW_SCALE = 4;
const PIXEL_PARTICLE_SIZE = 6;
const FULL_CIRCLE = Math.PI * 2;
const SOFT_CORNER_RATIO = 0.35;
const FONT = "monospace";

const isBlinkHidden = (timer: number) =>
  timer > 0 && Math.floor(timer * 8) % 2 === 0;

// Parpadea cuando le quedan menos de 2 segundos de vida
const isPowerUpHidden = (powerUp: PowerUp) =>
  powerUp.ttl < 2 && isBlinkHidden(powerUp.ttl);

function paintPath(
  ctx: CanvasRenderingContext2D,
  skin: SkinDefinition,
  colors: EntityColors,
  lineWidth: number,
) {
  const metrics = STYLE_METRICS[skin.drawStyle];
  if (colors.fill) {
    ctx.fillStyle = colors.fill;
    ctx.fill();
  }
  ctx.strokeStyle = colors.line;
  ctx.lineWidth = lineWidth * metrics.lineScale;
  ctx.lineJoin = metrics.lineJoin;
  ctx.stroke();
}

function drawBullet(
  ctx: CanvasRenderingContext2D,
  bullet: Bullet,
  skin: SkinDefinition,
) {
  const radius = bullet.radius * STYLE_METRICS[skin.drawStyle].bulletScale;
  ctx.fillStyle = skin.bullet;
  if (skin.drawStyle === "pixel") {
    ctx.fillRect(bullet.x - radius, bullet.y - radius, radius * 2, radius * 2);
    return;
  }
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, radius, 0, FULL_CIRCLE);
  ctx.fill();
}

function drawAsteroid(
  ctx: CanvasRenderingContext2D,
  asteroid: Asteroid,
  skin: SkinDefinition,
) {
  const [first, ...rest] = asteroid.verts;
  ctx.save();
  ctx.translate(asteroid.x, asteroid.y);
  ctx.rotate(asteroid.rot);
  ctx.beginPath();
  ctx.moveTo(first[0], first[1]);
  rest.forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.closePath();
  paintPath(ctx, skin, skin.asteroid, 1.5);
  ctx.restore();
}

function drawPowerUpLabel(
  ctx: CanvasRenderingContext2D,
  powerUp: PowerUp,
  skin: SkinDefinition,
) {
  if (isPowerUpHidden(powerUp)) return;
  ctx.fillStyle = skin.powerUp.line;
  ctx.font = `bold 12px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("3x", powerUp.x, powerUp.y);
}

function drawPowerUp(
  ctx: CanvasRenderingContext2D,
  powerUp: PowerUp,
  skin: SkinDefinition,
) {
  if (isPowerUpHidden(powerUp)) return;
  const pulse = 0.85 + Math.sin(performance.now() / 150) * 0.15;
  const r = powerUp.radius * pulse;
  ctx.save();
  ctx.translate(powerUp.x, powerUp.y);
  ctx.rotate(Math.PI / 4);
  ctx.beginPath();
  if (skin.drawStyle === "soft") {
    ctx.roundRect(-r, -r, r * 2, r * 2, r * SOFT_CORNER_RATIO);
  } else {
    ctx.rect(-r, -r, r * 2, r * 2);
  }
  paintPath(ctx, skin, skin.powerUp, 2);
  ctx.restore();
  // En pixel la etiqueta se dibuja a resolución completa para que sea legible
  if (skin.drawStyle !== "pixel") drawPowerUpLabel(ctx, powerUp, skin);
}

function traceShipHull(ctx: CanvasRenderingContext2D) {
  // Silueta clásica: triángulo con muesca trasera
  ctx.beginPath();
  ctx.moveTo(20, 0); // nariz
  ctx.lineTo(-12, -9); // ala izquierda
  ctx.lineTo(-7, 0); // muesca trasera
  ctx.lineTo(-12, 9); // ala derecha
  ctx.closePath();
}

function drawThrust(ctx: CanvasRenderingContext2D, skin: SkinDefinition) {
  if (Math.random() <= 0.35) return;
  ctx.beginPath();
  ctx.moveTo(-8, -4);
  ctx.lineTo(-8 - rand(6, 14), 0);
  ctx.lineTo(-8, 4);
  paintPath(ctx, skin, { line: skin.thrust, fill: null }, 1.5);
}

function drawShip(
  ctx: CanvasRenderingContext2D,
  ship: Ship,
  skin: SkinDefinition,
) {
  if (ship.dead || isBlinkHidden(ship.invincible)) return;
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  traceShipHull(ctx);
  paintPath(ctx, skin, skin.ship, 1.5);
  if (ship.thrusting) drawThrust(ctx, skin);
  ctx.restore();
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  particle: Particle,
  skin: SkinDefinition,
) {
  ctx.fillStyle = skin.particle;
  if (skin.drawStyle === "pixel") {
    ctx.fillRect(
      particle.x,
      particle.y,
      PIXEL_PARTICLE_SIZE,
      PIXEL_PARTICLE_SIZE,
    );
    return;
  }
  ctx.globalAlpha = particle.ttl / particle.life;
  ctx.strokeStyle = skin.particle;
  ctx.lineWidth = STYLE_METRICS[skin.drawStyle].lineScale;
  ctx.beginPath();
  ctx.moveTo(particle.x, particle.y);
  ctx.lineTo(particle.x - particle.vx * 0.05, particle.y - particle.vy * 0.05);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawBackground(ctx: CanvasRenderingContext2D, skin: SkinDefinition) {
  ctx.fillStyle = skin.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawActors(
  ctx: CanvasRenderingContext2D,
  state: RenderState,
  skin: SkinDefinition,
) {
  state.particles.forEach((particle) => drawParticle(ctx, particle, skin));
  state.asteroids.forEach((asteroid) => drawAsteroid(ctx, asteroid, skin));
  state.powerUps.forEach((powerUp) => drawPowerUp(ctx, powerUp, skin));
  state.bullets.forEach((bullet) => drawBullet(ctx, bullet, skin));
  drawShip(ctx, state.ship, skin);
}

function drawWorld(
  ctx: CanvasRenderingContext2D,
  state: RenderState,
  skin: SkinDefinition,
) {
  drawBackground(ctx, skin);
  drawActors(ctx, state, skin);
}

function drawLifeIcon(
  ctx: CanvasRenderingContext2D,
  skin: SkinDefinition,
  x: number,
  y: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-6, 5);
  ctx.closePath();
  paintPath(ctx, skin, skin.ship, 1.2);
  ctx.restore();
}

function drawLifeIcons(
  ctx: CanvasRenderingContext2D,
  state: RenderState,
  skin: SkinDefinition,
) {
  for (let i = 0; i < state.lives; i++) {
    drawLifeIcon(ctx, skin, WIDTH - 16 - i * 22, 18);
  }
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  state: RenderState,
  skin: SkinDefinition,
) {
  ctx.fillStyle = skin.text;
  ctx.font = `15px ${FONT}`;
  ctx.textBaseline = "alphabetic";

  ctx.textAlign = "left";
  ctx.fillText(`SCORE  ${state.score}`, 14, 26);

  ctx.textAlign = "center";
  ctx.fillText(`NIVEL ${state.level}`, WIDTH / 2, 26);

  drawLifeIcons(ctx, state, skin);

  if (state.ship.tripleShot > 0) {
    ctx.textAlign = "left";
    ctx.fillStyle = skin.powerUp.line;
    ctx.fillText(`3x  ${state.ship.tripleShot.toFixed(1)}s`, 14, 46);
  }
}

function drawGameOver(
  ctx: CanvasRenderingContext2D,
  state: RenderState,
  skin: SkinDefinition,
) {
  if (skin.overlayBackground) {
    ctx.fillStyle = skin.overlayBackground;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = skin.text;
  ctx.font = `bold 46px ${FONT}`;
  ctx.fillText("GAME OVER", WIDTH / 2, HEIGHT / 2 - 18);
  ctx.font = `18px ${FONT}`;
  ctx.fillStyle = skin.textDim;
  ctx.fillText(
    `PUNTAJE: ${state.score}   —   ESPACIO PARA REINICIAR`,
    WIDTH / 2,
    HEIGHT / 2 + 22,
  );
}

function createScaledBuffer(scale: number): CanvasRenderingContext2D {
  const buffer = document.createElement("canvas");
  buffer.width = WIDTH / scale;
  buffer.height = HEIGHT / scale;
  const bufferCtx = buffer.getContext("2d");
  if (!bufferCtx) throw new Error("Canvas 2D context is not available");
  bufferCtx.setTransform(1 / scale, 0, 0, 1 / scale, 0, 0);
  return bufferCtx;
}

export function createRenderer(ctx: CanvasRenderingContext2D) {
  // Se crean al primer frame de su skin: nada de document al importar (SSR)
  let pixelCtx: CanvasRenderingContext2D | null = null;
  let glowCtx: CanvasRenderingContext2D | null = null;

  function drawGlowWorld(state: RenderState, skin: SkinDefinition) {
    glowCtx ??= createScaledBuffer(GLOW_SCALE);
    glowCtx.clearRect(0, 0, WIDTH, HEIGHT);
    drawActors(glowCtx, state, skin);
    drawLifeIcons(glowCtx, state, skin);

    drawBackground(ctx, skin);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(glowCtx.canvas, 0, 0, WIDTH, HEIGHT);
    drawActors(ctx, state, skin);
  }

  function drawPixelWorld(state: RenderState, skin: SkinDefinition) {
    pixelCtx ??= createScaledBuffer(PIXEL_SCALE);
    drawWorld(pixelCtx, state, skin);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pixelCtx.canvas, 0, 0, WIDTH, HEIGHT);
    ctx.imageSmoothingEnabled = true;
    state.powerUps.forEach((powerUp) => drawPowerUpLabel(ctx, powerUp, skin));
  }

  return function drawFrame(state: RenderState) {
    const skin = SKINS[state.skin];
    if (skin.drawStyle === "pixel") drawPixelWorld(state, skin);
    else if (skin.drawStyle === "glow") drawGlowWorld(state, skin);
    else drawWorld(ctx, state, skin);
    drawHUD(ctx, state, skin);
    if (state.isGameOver) drawGameOver(ctx, state, skin);
  };
}
