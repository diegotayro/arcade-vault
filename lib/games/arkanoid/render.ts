import { BALL_SIZE, CANVAS_HEIGHT, CANVAS_WIDTH, SKINS } from "./constants";
import type { Painter } from "./painters";
import type {
  ArkanoidSkin,
  ArkanoidState,
  Ball,
  Block,
  Explosion,
  Paddle,
  SkinDefinition,
} from "./types";

export interface RenderState {
  skin: ArkanoidSkin;
  painter: Painter;
  blocks: Block[];
  explosions: Explosion[];
  paddle: Paddle;
  ball: Ball;
  score: number;
  lives: number;
  level: number;
  state: ArkanoidState;
}

const HUD_FONT = "bold 18px monospace";
const OVERLAY_FONT = "bold 64px monospace";
const HUD_MARGIN = 10;
const LIFE_SPACING = 4;

const OVERLAY_MESSAGES: Partial<Record<ArkanoidState, string>> = {
  gameover: "GAME OVER",
  win: "¡Completaste el juego!",
};

function drawBackground(ctx: CanvasRenderingContext2D, skin: SkinDefinition) {
  ctx.fillStyle = skin.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawBlocks(ctx: CanvasRenderingContext2D, scene: RenderState) {
  for (const block of scene.blocks) {
    if (block.alive) scene.painter.block(ctx, block.color, block);
  }
}

function drawExplosions(ctx: CanvasRenderingContext2D, scene: RenderState) {
  for (const explosion of scene.explosions) {
    scene.painter.explosion(ctx, explosion);
  }
}

function drawHud(
  ctx: CanvasRenderingContext2D,
  scene: RenderState,
  skin: SkinDefinition,
) {
  ctx.fillStyle = skin.text;
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
    scene.painter.ball(ctx, {
      x,
      y: HUD_MARGIN,
      w: BALL_SIZE,
      h: BALL_SIZE,
    });
  }
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  message: string,
  skin: SkinDefinition,
) {
  ctx.fillStyle = skin.overlay;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = skin.text;
  ctx.font = OVERLAY_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

export function renderScene(ctx: CanvasRenderingContext2D, scene: RenderState) {
  const skin = SKINS[scene.skin];
  ctx.imageSmoothingEnabled = skin.drawStyle !== "pixel";

  drawBackground(ctx, skin);
  drawBlocks(ctx, scene);
  drawExplosions(ctx, scene);
  scene.painter.paddle(ctx, scene.paddle);
  scene.painter.ball(ctx, scene.ball);

  if (scene.state === "playing") drawHud(ctx, scene, skin);

  const overlayMessage = OVERLAY_MESSAGES[scene.state];
  if (overlayMessage) drawOverlay(ctx, overlayMessage, skin);
}
