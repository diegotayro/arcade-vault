import {
  BALL_SIZE,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  EXPLOSION_DURATION,
  EXPLOSION_FRAME_COUNT,
} from "./constants";
import { drawFrame, drawSprite, EXPLOSION_FRAMES } from "./sprites";
import type { ArkanoidState, Ball, Block, Explosion, Paddle } from "./types";

export interface RenderState {
  image: HTMLImageElement;
  blocks: Block[];
  explosions: Explosion[];
  paddle: Paddle;
  ball: Ball;
  score: number;
  lives: number;
  level: number;
  state: ArkanoidState;
}

const BACKGROUND_COLOR = "#000";
const TEXT_COLOR = "#fff";
const OVERLAY_COLOR = "rgba(0, 0, 0, 0.6)";
const HUD_FONT = "bold 18px monospace";
const OVERLAY_FONT = "bold 64px monospace";
const HUD_MARGIN = 10;
const LIFE_SPACING = 4;

const OVERLAY_MESSAGES: Partial<Record<ArkanoidState, string>> = {
  gameover: "GAME OVER",
  win: "¡Completaste el juego!",
};

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawBlocks(ctx: CanvasRenderingContext2D, scene: RenderState) {
  for (const block of scene.blocks) {
    if (!block.alive) continue;
    drawSprite(
      ctx,
      scene.image,
      block.color,
      block.x,
      block.y,
      block.w,
      block.h,
    );
  }
}

function drawExplosions(ctx: CanvasRenderingContext2D, scene: RenderState) {
  for (const explosion of scene.explosions) {
    const frameIndex = Math.min(
      Math.floor(
        (explosion.elapsed / EXPLOSION_DURATION) * EXPLOSION_FRAME_COUNT,
      ),
      EXPLOSION_FRAME_COUNT - 1,
    );
    const frame = EXPLOSION_FRAMES[explosion.color][frameIndex];
    drawFrame(
      ctx,
      scene.image,
      frame,
      explosion.x,
      explosion.y,
      explosion.w,
      explosion.h,
    );
  }
}

function drawHud(ctx: CanvasRenderingContext2D, scene: RenderState) {
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = HUD_FONT;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${scene.score}`, HUD_MARGIN, HUD_MARGIN);
  ctx.textAlign = "center";
  ctx.fillText(`Nivel: ${scene.level}`, CANVAS_WIDTH / 2, HUD_MARGIN);

  for (let index = 0; index < scene.lives; index++) {
    const x =
      CANVAS_WIDTH -
      HUD_MARGIN -
      (scene.lives - index) * (BALL_SIZE + LIFE_SPACING);
    drawSprite(ctx, scene.image, "ball", x, HUD_MARGIN, BALL_SIZE, BALL_SIZE);
  }
}

function drawOverlay(ctx: CanvasRenderingContext2D, message: string) {
  ctx.fillStyle = OVERLAY_COLOR;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = OVERLAY_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

export function renderScene(ctx: CanvasRenderingContext2D, scene: RenderState) {
  drawBackground(ctx);
  drawBlocks(ctx, scene);
  drawExplosions(ctx, scene);

  const { paddle, ball, image } = scene;
  drawSprite(ctx, image, "paddle", paddle.x, paddle.y, paddle.w, paddle.h);
  drawSprite(ctx, image, "ball", ball.x, ball.y, ball.w, ball.h);

  if (scene.state === "playing") drawHud(ctx, scene);

  const overlayMessage = OVERLAY_MESSAGES[scene.state];
  if (overlayMessage) drawOverlay(ctx, overlayMessage);
}
