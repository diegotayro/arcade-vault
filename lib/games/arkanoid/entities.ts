import {
  BALL_SIZE,
  BASE_BALL_VX,
  BASE_BALL_VY,
  BLOCK_HEIGHT,
  BLOCK_WIDTH,
  BLOCKS_ORIGIN_X,
  BLOCKS_ORIGIN_Y,
  CANVAS_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_Y,
} from "./constants";
import type { Ball, Block, Level, Paddle } from "./types";

export function createBlocks(level: Level): Block[] {
  return level.blocks.map(({ col, row, color }) => ({
    x: BLOCKS_ORIGIN_X + col * BLOCK_WIDTH,
    y: BLOCKS_ORIGIN_Y + row * BLOCK_HEIGHT,
    w: BLOCK_WIDTH,
    h: BLOCK_HEIGHT,
    color,
    alive: true,
  }));
}

export function createPaddle(): Paddle {
  return {
    x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
    y: PADDLE_Y,
    w: PADDLE_WIDTH,
    h: PADDLE_HEIGHT,
  };
}

/** Bola centrada sobre la paleta, con la velocidad base escalada por el nivel. */
export function createBall(paddle: Paddle, levelSpeed: number): Ball {
  return {
    x: paddle.x + (paddle.w - BALL_SIZE) / 2,
    y: paddle.y - BALL_SIZE,
    w: BALL_SIZE,
    h: BALL_SIZE,
    vx: BASE_BALL_VX * levelSpeed,
    vy: BASE_BALL_VY * levelSpeed,
  };
}

export function collidesWithBlock(ball: Ball, block: Block): boolean {
  return (
    ball.x < block.x + block.w &&
    ball.x + ball.w > block.x &&
    ball.y < block.y + block.h &&
    ball.y + ball.h > block.y
  );
}
