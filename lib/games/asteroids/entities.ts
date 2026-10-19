import {
  HEIGHT,
  POINTS,
  POWERUP_TTL,
  RADII,
  SPEEDS,
  TRIPLE_SPREAD,
  WIDTH,
} from "./constants";
import type { KeyState } from "./input";
import type { AsteroidSize } from "./types";

// ── Utils ─────────────────────────────────────────────────────────────────────
export const wrap = (value: number, max: number) => ((value % max) + max) % max;
export const dist = (
  a: { x: number; y: number },
  b: { x: number; y: number },
) => Math.hypot(a.x - b.x, a.y - b.y);
export const rand = (min: number, max: number) =>
  min + Math.random() * (max - min);
export const randInt = (min: number, max: number) =>
  Math.floor(rand(min, max + 1));

const FULL_CIRCLE = Math.PI * 2;

export class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl = 1.1;
  radius = 2;
  dead = false;

  constructor(x: number, y: number, angle: number) {
    const speed = 520;
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, WIDTH);
    this.y = wrap(this.y + this.vy * dt, HEIGHT);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, FULL_CIRCLE);
    ctx.fill();
  }
}

export class Asteroid {
  x: number;
  y: number;
  size: AsteroidSize;
  radius: number;
  vx: number;
  vy: number;
  rot = rand(0, FULL_CIRCLE);
  rotSpeed = rand(-1.2, 1.2);
  verts: [number, number][] = [];
  dead = false;

  constructor(x: number, y: number, size: AsteroidSize = 3) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.radius = RADII[size];

    const angle = rand(0, FULL_CIRCLE);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    // Polígono irregular
    const vertexCount = randInt(8, 13);
    for (let i = 0; i < vertexCount; i++) {
      const vertexAngle = (i / vertexCount) * FULL_CIRCLE;
      const vertexRadius = this.radius * rand(0.6, 1.0);
      this.verts.push([
        Math.cos(vertexAngle) * vertexRadius,
        Math.sin(vertexAngle) * vertexRadius,
      ]);
    }
  }

  get points() {
    return POINTS[this.size];
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, WIDTH);
    this.y = wrap(this.y + this.vy * dt, HEIGHT);
    this.rot += this.rotSpeed * dt;
  }

  split(): Asteroid[] {
    if (this.size <= 1) return [];
    const smaller = (this.size - 1) as AsteroidSize;
    return [
      new Asteroid(this.x, this.y, smaller),
      new Asteroid(this.x, this.y, smaller),
    ];
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++) {
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

export class PowerUp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius = 12;
  ttl = POWERUP_TTL;
  dead = false;

  constructor(x: number, y: number) {
    const angle = rand(0, FULL_CIRCLE);
    const speed = rand(20, 40);
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, WIDTH);
    this.y = wrap(this.y + this.vy * dt, HEIGHT);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;
    const pulse = 0.85 + Math.sin(performance.now() / 150) * 0.15;
    const r = this.radius * pulse;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = "#0ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(-r, -r, r * 2, r * 2);
    ctx.restore();
    ctx.fillStyle = "#0ff";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("3x", this.x, this.y);
  }
}

export class Ship {
  x = WIDTH / 2;
  y = HEIGHT / 2;
  angle = -Math.PI / 2;
  vx = 0;
  vy = 0;
  radius = 12;
  thrusting = false;
  invincible = 3;
  shootCooldown = 0;
  tripleShot = 0;
  dead = false;

  reset() {
    this.x = WIDTH / 2;
    this.y = HEIGHT / 2;
    this.angle = -Math.PI / 2;
    this.vx = 0;
    this.vy = 0;
    this.radius = 12;
    this.thrusting = false;
    this.invincible = 3;
    this.shootCooldown = 0;
    this.dead = false;
  }

  update(dt: number, keys: KeyState) {
    if (this.dead) return;
    if (this.invincible > 0) this.invincible -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.tripleShot > 0) this.tripleShot -= dt;

    const rotationSpeed = 3.5; // rad/s
    const thrust = 260; // px/s²
    const drag = 0.987;

    if (keys.ArrowLeft) this.angle -= rotationSpeed * dt;
    if (keys.ArrowRight) this.angle += rotationSpeed * dt;

    this.thrusting = !!keys.ArrowUp;
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * thrust * dt;
      this.vy += Math.sin(this.angle) * thrust * dt;
    }

    this.vx *= drag;
    this.vy *= drag;
    this.x = wrap(this.x + this.vx * dt, WIDTH);
    this.y = wrap(this.y + this.vy * dt, HEIGHT);
  }

  tryShoot(): Bullet[] {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const nose = 21;
    const originX = this.x + Math.cos(this.angle) * nose;
    const originY = this.y + Math.sin(this.angle) * nose;
    if (this.tripleShot > 0) {
      return [
        new Bullet(originX, originY, this.angle - TRIPLE_SPREAD),
        new Bullet(originX, originY, this.angle),
        new Bullet(originX, originY, this.angle + TRIPLE_SPREAD),
      ];
    }
    return [new Bullet(originX, originY, this.angle)];
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0)
      return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo(20, 0); // nariz
    ctx.lineTo(-12, -9); // ala izquierda
    ctx.lineTo(-7, 0); // muesca trasera
    ctx.lineTo(-12, 9); // ala derecha
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8, 4);
      ctx.strokeStyle = "rgba(255, 130, 0, 0.85)";
      ctx.stroke();
    }

    ctx.restore();
  }
}

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life = rand(0.4, 1.1);
  ttl = this.life;
  dead = false;

  constructor(x: number, y: number) {
    const angle = rand(0, FULL_CIRCLE);
    const speed = rand(30, 130);
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}
