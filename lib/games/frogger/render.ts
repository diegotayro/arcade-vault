import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CELL,
  GOAL_WIDTH,
  JUMP_MS,
  ROW_GOALS,
  ROW_ROAD_BOT,
  ROW_ROAD_TOP,
  ROW_SAFE_MID,
  ROW_START,
  ROWS,
  SKINS,
} from "./constants";
import { goalCol, isRiverRow } from "./entities";
import type {
  Direction,
  Entity,
  FroggerSkin,
  FroggerState,
  Frog,
  Lane,
  SkinDefinition,
} from "./types";

const HUD_FONT = "bold 16px monospace";
const OVERLAY_FONT = "bold 56px monospace";
const HUD_MARGIN = 8;
const TIME_BAR_HEIGHT = 5;
const LIFE_ICON_RADIUS = 6;
const LIFE_ICON_GAP = 18;
const GOAL_INSET = 4;
const ENTITY_INSET = 4;
const WHEEL_RADIUS = 4;
const FROG_BODY_RX = 14; // elipse 28×24 px
const FROG_BODY_RY = 12;
const FROG_EYE_RADIUS = 4;
const FROG_PUPIL_RADIUS = 2;
const FROG_LEG_REACH = 14;
const LOG_LINE_SPACING = 12;
const GLOW_BLUR = 12;
const SOFT_RADIUS = 8;
// El estilo pixel dibuja el mundo a 1/PIXEL_SCALE y lo escala sin suavizado
const PIXEL_SCALE = 4;

const FACING_ANGLE: Record<Direction, number> = {
  up: 0,
  right: Math.PI / 2,
  down: Math.PI,
  left: -Math.PI / 2,
};

export interface Scene {
  frog: Frog;
  lanes: Lane[];
  goals: boolean[];
  state: FroggerState;
  score: number;
  level: number;
  lives: number;
  timeLeft: number; // segundos
  roundTime: number; // segundos
  skin: FroggerSkin;
}

const rowY = (row: number) => row * CELL;

function applyGlow(
  ctx: CanvasRenderingContext2D,
  skin: SkinDefinition,
  color: string,
) {
  if (skin.drawStyle !== "glow") return;
  ctx.shadowColor = color;
  ctx.shadowBlur = GLOW_BLUR;
}

// Pastel redondea las cajas; el resto de estilos conserva los rectángulos
function boxPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(SOFT_RADIUS, h / 2));
}

function fillBox(
  ctx: CanvasRenderingContext2D,
  skin: SkinDefinition,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  if (skin.drawStyle !== "soft") return ctx.fillRect(x, y, w, h);
  boxPath(ctx, x, y, w, h);
  ctx.fill();
}

function strokeBox(
  ctx: CanvasRenderingContext2D,
  skin: SkinDefinition,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  if (skin.drawStyle !== "soft") return ctx.strokeRect(x, y, w, h);
  boxPath(ctx, x, y, w, h);
  ctx.stroke();
}

function rowColor(row: number, skin: SkinDefinition): string {
  if (row === ROW_GOALS) return skin.goalZone;
  if (isRiverRow(row)) return skin.river;
  if (row === ROW_SAFE_MID || row === ROW_START) return skin.safe;
  return skin.road;
}

function drawBackground(ctx: CanvasRenderingContext2D, skin: SkinDefinition) {
  for (let row = 0; row < ROWS; row++) {
    ctx.fillStyle = rowColor(row, skin);
    ctx.fillRect(0, rowY(row), CANVAS_WIDTH, CELL);
  }

  // Marcas discontinuas entre carriles de carretera
  ctx.strokeStyle = skin.laneMark;
  ctx.lineWidth = 2;
  ctx.setLineDash([16, 12]);
  for (let row = ROW_ROAD_TOP + 1; row <= ROW_ROAD_BOT; row++) {
    ctx.beginPath();
    ctx.moveTo(0, rowY(row));
    ctx.lineTo(CANVAS_WIDTH, rowY(row));
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawWheels(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  skin: SkinDefinition,
) {
  ctx.fillStyle = skin.wheel;
  for (const wheelX of [x + 6, x + w - 6]) {
    for (const wheelY of [y, y + CELL - ENTITY_INSET * 2]) {
      ctx.beginPath();
      ctx.arc(wheelX, wheelY, WHEEL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  lane: Lane,
  skin: SkinDefinition,
) {
  const x = entity.col * CELL + ENTITY_INSET;
  const y = rowY(lane.row) + ENTITY_INSET;
  const w = entity.width * CELL - ENTITY_INSET * 2;
  drawWheels(ctx, x, y, w, skin);
  ctx.fillStyle = skin.cars[lane.row % skin.cars.length];
  fillBox(ctx, skin, x, y + 3, w, CELL - ENTITY_INSET * 2 - 6);
}

function drawTruck(
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  lane: Lane,
  skin: SkinDefinition,
) {
  const x = entity.col * CELL + ENTITY_INSET;
  const y = rowY(lane.row) + ENTITY_INSET;
  const w = entity.width * CELL - ENTITY_INSET * 2;
  const h = CELL - ENTITY_INSET * 2;
  const cabWidth = CELL * 0.7;
  const cabX = lane.dir > 0 ? x + w - cabWidth : x;
  const trailerX = lane.dir > 0 ? x : x + cabWidth + 2;

  drawWheels(ctx, x, y, w, skin);
  ctx.fillStyle = skin.truck;
  fillBox(ctx, skin, trailerX, y + 2, w - cabWidth - 2, h - 4);
  ctx.fillStyle = skin.truckCab;
  fillBox(ctx, skin, cabX, y + 4, cabWidth, h - 8);
}

function drawLog(
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  lane: Lane,
  skin: SkinDefinition,
) {
  const x = entity.col * CELL + 2;
  const y = rowY(lane.row) + ENTITY_INSET;
  const w = entity.width * CELL - 4;
  const h = CELL - ENTITY_INSET * 2;
  ctx.fillStyle = skin.log;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();

  ctx.strokeStyle = skin.logLine;
  ctx.lineWidth = 2;
  for (
    let lineX = x + LOG_LINE_SPACING;
    lineX < x + w - 8;
    lineX += LOG_LINE_SPACING
  ) {
    ctx.beginPath();
    ctx.moveTo(lineX, y + 8);
    ctx.lineTo(lineX + 6, y + h - 8);
    ctx.stroke();
  }
}

function drawTurtles(
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  lane: Lane,
  skin: SkinDefinition,
) {
  const radius = CELL / 2 - ENTITY_INSET - 1;
  const centerY = rowY(lane.row) + CELL / 2;
  for (let index = 0; index < entity.width; index++) {
    const centerX = (entity.col + index) * CELL + CELL / 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    if (entity.submerged) {
      ctx.strokeStyle = skin.turtleSubmerged;
      ctx.lineWidth = 2;
      ctx.stroke();
      continue;
    }
    ctx.fillStyle = skin.turtle;
    ctx.fill();
    // Escamas: cruz y anillo interior sobre el caparazón
    ctx.strokeStyle = skin.turtleScale;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius / 2, 0, Math.PI * 2);
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX, centerY + radius);
    ctx.stroke();
  }
}

const ENTITY_PAINTERS = {
  car: drawCar,
  truck: drawTruck,
  log: drawLog,
  turtle: drawTurtles,
} as const;

function entityColor(entity: Entity, lane: Lane, skin: SkinDefinition) {
  if (entity.type === "car") return skin.cars[lane.row % skin.cars.length];
  if (entity.type === "truck") return skin.truck;
  if (entity.type === "log") return skin.log;
  return skin.turtle;
}

function drawLanes(
  ctx: CanvasRenderingContext2D,
  lanes: Lane[],
  skin: SkinDefinition,
) {
  for (const lane of lanes) {
    for (const entity of lane.entities) {
      ctx.save();
      applyGlow(ctx, skin, entityColor(entity, lane, skin));
      ENTITY_PAINTERS[entity.type](ctx, entity, lane, skin);
      ctx.restore();
    }
  }
}

function drawFrogShape(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  facing: Direction,
  isJumping: boolean,
  skin: SkinDefinition,
) {
  const legReach = isJumping ? FROG_LEG_REACH : FROG_LEG_REACH / 2;
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(FACING_ANGLE[facing]);
  applyGlow(ctx, skin, skin.frog);

  ctx.strokeStyle = skin.frogDark;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(side * 8, -6);
    ctx.lineTo(side * (8 + legReach / 2), -6 - legReach / 2);
    ctx.moveTo(side * 8, 6);
    ctx.lineTo(side * (8 + legReach / 2), 6 + legReach / 2);
  }
  ctx.stroke();

  ctx.fillStyle = skin.frog;
  ctx.beginPath();
  ctx.ellipse(0, 0, FROG_BODY_RX, FROG_BODY_RY, 0, 0, Math.PI * 2);
  ctx.fill();

  for (const side of [-1, 1]) {
    ctx.fillStyle = skin.eyeWhite;
    ctx.beginPath();
    ctx.arc(side * 6, -8, FROG_EYE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.eyePupil;
    ctx.beginPath();
    ctx.arc(side * 6, -9, FROG_PUPIL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFrog(
  ctx: CanvasRenderingContext2D,
  frog: Frog,
  skin: SkinDefinition,
) {
  const progress = frog.animating ? Math.min(frog.animT / JUMP_MS, 1) : 0;
  const col = frog.col + (frog.targetCol - frog.col) * progress;
  const row = frog.row + (frog.targetRow - frog.row) * progress;
  drawFrogShape(
    ctx,
    col * CELL + CELL / 2,
    row * CELL + CELL / 2,
    frog.facing,
    frog.animating,
    skin,
  );
}

function drawGoals(
  ctx: CanvasRenderingContext2D,
  goals: boolean[],
  skin: SkinDefinition,
) {
  goals.forEach((occupied, index) => {
    const centerX = goalCol(index) * CELL + CELL / 2;
    const x = centerX - (GOAL_WIDTH * CELL) / 2 + GOAL_INSET;
    const y = rowY(ROW_GOALS) + TIME_BAR_HEIGHT + GOAL_INSET;
    const w = GOAL_WIDTH * CELL - GOAL_INSET * 2;
    const h = CELL - TIME_BAR_HEIGHT - GOAL_INSET;
    ctx.fillStyle = skin.goalSlot;
    fillBox(ctx, skin, x, y, w, h);
    ctx.save();
    applyGlow(ctx, skin, skin.goalBorder);
    ctx.strokeStyle = skin.goalBorder;
    ctx.lineWidth = 2;
    strokeBox(ctx, skin, x, y, w, h);
    ctx.restore();
    if (occupied) drawFrogShape(ctx, centerX, y + h / 2, "down", false, skin);
  });
}

function timeColor(ratio: number, skin: SkinDefinition): string {
  if (ratio > 0.5) return skin.timeHigh;
  if (ratio > 0.25) return skin.timeMid;
  return skin.timeLow;
}

function drawHud(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  skin: SkinDefinition,
) {
  const ratio = Math.max(scene.timeLeft / scene.roundTime, 0);
  ctx.fillStyle = timeColor(ratio, skin);
  ctx.fillRect(0, rowY(ROW_GOALS), CANVAS_WIDTH * ratio, TIME_BAR_HEIGHT);

  const textY = TIME_BAR_HEIGHT + HUD_MARGIN;
  ctx.font = HUD_FONT;
  ctx.textBaseline = "top";
  ctx.fillStyle = skin.hudText;
  ctx.shadowColor = skin.hudShadow;
  ctx.shadowBlur = 4;

  ctx.textAlign = "left";
  ctx.fillText(`SCORE  ${scene.score}`, HUD_MARGIN, textY);
  ctx.textAlign = "center";
  ctx.fillText(`NIVEL ${scene.level}`, CANVAS_WIDTH / 2, textY);
  ctx.shadowBlur = 0;

  ctx.fillStyle = skin.frog;
  for (let index = 0; index < scene.lives; index++) {
    const centerX =
      CANVAS_WIDTH - HUD_MARGIN - LIFE_ICON_RADIUS - index * LIFE_ICON_GAP;
    ctx.beginPath();
    ctx.arc(
      centerX,
      textY + LIFE_ICON_RADIUS + 2,
      LIFE_ICON_RADIUS,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

function drawOverlay(ctx: CanvasRenderingContext2D, skin: SkinDefinition) {
  ctx.fillStyle = skin.overlayBackground;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = skin.overlayText;
  ctx.font = OVERLAY_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

function drawWorld(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  skin: SkinDefinition,
) {
  drawBackground(ctx, skin);
  drawGoals(ctx, scene.goals, skin);
  drawLanes(ctx, scene.lanes, skin);
  if (scene.state === "playing") drawFrog(ctx, scene.frog, skin);
}

function createPixelBuffer(): CanvasRenderingContext2D {
  const buffer = document.createElement("canvas");
  buffer.width = CANVAS_WIDTH / PIXEL_SCALE;
  buffer.height = CANVAS_HEIGHT / PIXEL_SCALE;
  const bufferCtx = buffer.getContext("2d");
  if (!bufferCtx) throw new Error("Canvas 2D context is not available");
  bufferCtx.setTransform(1 / PIXEL_SCALE, 0, 0, 1 / PIXEL_SCALE, 0, 0);
  return bufferCtx;
}

export function createRenderer(ctx: CanvasRenderingContext2D) {
  // Se crea al primer frame en pixel: nada de document al importar (SSR)
  let pixelCtx: CanvasRenderingContext2D | null = null;

  function drawPixelWorld(scene: Scene, skin: SkinDefinition) {
    pixelCtx ??= createPixelBuffer();
    drawWorld(pixelCtx, scene, skin);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pixelCtx.canvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.imageSmoothingEnabled = true;
  }

  return function renderScene(scene: Scene) {
    const skin = SKINS[scene.skin];
    if (skin.drawStyle === "pixel") drawPixelWorld(scene, skin);
    else drawWorld(ctx, scene, skin);
    drawHud(ctx, scene, skin);
    if (scene.state === "gameover") drawOverlay(ctx, skin);
  };
}
