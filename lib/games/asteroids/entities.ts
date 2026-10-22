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
}
