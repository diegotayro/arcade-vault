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
// El neón dibuja las siluetas a 1/GLOW_SCALE y al escalarlas con suavizado
// quedan difusas: un halo barato en lugar de shadowBlur por figura
const GLOW_SCALE = 8;
// Las siluetas son macizas: atenuarlas deja ver el contorno neón como antes
const HALO_ALPHA = 0.4;

const OVERLAY_MESSAGES: Partial<Record<ArkanoidState, string>> = {
  gameover: "GAME OVER",
  win: "¡Completaste el juego!",
};

function drawBackground(ctx: CanvasRenderingContext2D, skin: SkinDefinition) {
  ctx.fillStyle = skin.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

// Todo lo que pinta el painter: bloques, explosiones, paleta, bola y vidas
function drawActors(
  ctx: CanvasRenderingContext2D,
  scene: RenderState,
  painter: Painter,
) {
  for (const block of scene.blocks) {
    if (block.alive) painter.block(ctx, block.color, block);
  }
  for (const explosion of scene.explosions) painter.explosion(ctx, explosion);
  painter.paddle(ctx, scene.paddle);
  painter.ball(ctx, scene.ball);
  if (scene.state === "playing") drawLives(ctx, scene.lives, painter);
}

function drawLives(
  ctx: CanvasRenderingContext2D,
  lives: number,
  painter: Painter,
) {
  for (let index = 0; index < lives; index++) {
    const x =
      CANVAS_WIDTH - HUD_MARGIN - (lives - index) * (BALL_SIZE + LIFE_SPACING);
    painter.ball(ctx, { x, y: HUD_MARGIN, w: BALL_SIZE, h: BALL_SIZE });
  }
}

function drawHudText(
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

function createScaledBuffer(scale: number): CanvasRenderingContext2D {
  const buffer = document.createElement("canvas");
  buffer.width = CANVAS_WIDTH / scale;
  buffer.height = CANVAS_HEIGHT / scale;
  const bufferCtx = buffer.getContext("2d");
  if (!bufferCtx) throw new Error("Canvas 2D context is not available");
  bufferCtx.setTransform(1 / scale, 0, 0, 1 / scale, 0, 0);
  return bufferCtx;
}

export function createRenderer(ctx: CanvasRenderingContext2D) {
  // Se crea al primer frame en neón: nada de document al importar (SSR)
  let glowCtx: CanvasRenderingContext2D | null = null;

  function drawHalo(scene: RenderState, halo: Painter) {
    glowCtx ??= createScaledBuffer(GLOW_SCALE);
    glowCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawActors(glowCtx, scene, halo);
    ctx.imageSmoothingQuality = "high";
    ctx.globalAlpha = HALO_ALPHA;
    ctx.drawImage(glowCtx.canvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.globalAlpha = 1;
  }

  return function renderScene(scene: RenderState) {
    const skin = SKINS[scene.skin];
    ctx.imageSmoothingEnabled = skin.drawStyle !== "pixel";

    drawBackground(ctx, skin);
    if (scene.painter.halo) drawHalo(scene, scene.painter.halo);
    drawActors(ctx, scene, scene.painter);
    if (scene.state === "playing") drawHudText(ctx, scene, skin);

    const overlayMessage = OVERLAY_MESSAGES[scene.state];
    if (overlayMessage) drawOverlay(ctx, overlayMessage, skin);
  };
}
