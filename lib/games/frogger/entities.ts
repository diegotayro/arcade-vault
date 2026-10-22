import {
  CELL,
  COLS,
  FRAME_MS,
  GOAL_COUNT,
  GOAL_FIRST_COL,
  GOAL_SPACING,
  GOAL_WIDTH,
  LEVEL_SPEED_FACTOR,
  MIN_ROUND_TIME_S,
  RIVER_LANES,
  ROAD_LANES,
  ROUND_TIME_S,
  ROUND_TIME_STEP_S,
  ROW_RIVER_BOT,
  ROW_RIVER_TOP,
  ROW_ROAD_BOT,
  ROW_ROAD_TOP,
  ROW_START,
  ROWS,
  START_COL,
  TURTLE_CYCLE_MS,
  TURTLE_GROUP_OFFSET_MS,
  TURTLE_VISIBLE_MS,
  type LaneConfig,
} from "./constants";
import type { Direction, Entity, Frog, Lane } from "./types";

// Medio ancho de la rana (en celdas) usado para chocar con vehículos
const FROG_HALF_WIDTH = 0.3;

const DIRECTION_VECTORS: Record<Direction, { col: number; row: number }> = {
  up: { col: 0, row: -1 },
  down: { col: 0, row: 1 },
  left: { col: -1, row: 0 },
  right: { col: 1, row: 0 },
};

export const isRiverRow = (row: number) =>
  row >= ROW_RIVER_TOP && row <= ROW_RIVER_BOT;

export const isRoadRow = (row: number) =>
  row >= ROW_ROAD_TOP && row <= ROW_ROAD_BOT;

export const roundTimeFor = (level: number) =>
  Math.max(MIN_ROUND_TIME_S, ROUND_TIME_S - (level - 1) * ROUND_TIME_STEP_S);

export const createFrog = (): Frog => ({
  col: START_COL,
  row: ROW_START,
  animating: false,
  animT: 0,
  targetCol: START_COL,
  targetRow: ROW_START,
  facing: "up",
});

function buildLane(config: LaneConfig, level: number): Lane {
  const step = config.width + config.gap;
  // El patrón debe ser más largo que la pantalla para que el salto de reaparición no se vea
  const count = Math.ceil((COLS + config.width) / step);
  const entities: Entity[] = Array.from({ length: count }, (_, index) => ({
    col: index * step,
    width: config.width,
    type: config.type,
    ...(config.type === "turtle" && {
      submerged: false,
      diveClock: (index * TURTLE_GROUP_OFFSET_MS) % TURTLE_CYCLE_MS,
    }),
  }));

  return {
    row: config.row,
    speed: config.speed * LEVEL_SPEED_FACTOR ** (level - 1),
    dir: config.dir,
    period: count * step,
    entities,
  };
}

export const buildLanes = (level: number): Lane[] =>
  [...RIVER_LANES, ...ROAD_LANES].map((config) => buildLane(config, level));

// Desplazamiento en celdas de un carril durante dt milisegundos
export const laneShift = (lane: Lane, dt: number) =>
  ((lane.speed * lane.dir) / CELL) * (dt / FRAME_MS);

function wrapEntity(entity: Entity, lane: Lane) {
  if (lane.dir > 0 && entity.col >= COLS) entity.col -= lane.period;
  if (lane.dir < 0 && entity.col + entity.width <= 0) {
    entity.col += lane.period;
  }
}

function advanceDive(entity: Entity, dt: number) {
  if (entity.diveClock === undefined) return;
  entity.diveClock = (entity.diveClock + dt) % TURTLE_CYCLE_MS;
  entity.submerged = entity.diveClock >= TURTLE_VISIBLE_MS;
}

export function moveLanes(lanes: Lane[], dt: number) {
  for (const lane of lanes) {
    const shift = laneShift(lane, dt);
    for (const entity of lane.entities) {
      entity.col += shift;
      wrapEntity(entity, lane);
      advanceDive(entity, dt);
    }
  }
}

const frogCenter = (frog: Frog) => frog.col + 0.5;

export function checkRoadCollision(frog: Frog, lanes: Lane[]): boolean {
  if (!isRoadRow(frog.row)) return false;
  const center = frogCenter(frog);
  return lanes.some(
    (lane) =>
      lane.row === frog.row &&
      lane.entities.some(
        (entity) =>
          center + FROG_HALF_WIDTH > entity.col &&
          center - FROG_HALF_WIDTH < entity.col + entity.width,
      ),
  );
}

export function findLane(lanes: Lane[], row: number): Lane | undefined {
  return lanes.find((lane) => lane.row === row);
}

// Tronco o tortuga visible bajo la rana; null = agua
export function getSupport(frog: Frog, lanes: Lane[]): Entity | null {
  const lane = findLane(lanes, frog.row);
  if (!lane || !isRiverRow(frog.row)) return null;
  const center = frogCenter(frog);
  const entity = lane.entities.find(
    (candidate) =>
      center >= candidate.col && center < candidate.col + candidate.width,
  );
  return entity && !entity.submerged ? entity : null;
}

export const isOffRiverEdge = (frog: Frog) => {
  const center = frogCenter(frog);
  return center < 0 || center > COLS;
};

// Boca que corresponde a la columna de la rana; null = seto
export function checkGoal(frog: Frog): number | null {
  const offset = frogCenter(frog) - GOAL_FIRST_COL;
  const index = Math.floor(offset / GOAL_SPACING);
  if (index < 0 || index >= GOAL_COUNT) return null;
  return offset - index * GOAL_SPACING < GOAL_WIDTH ? index : null;
}

export const goalCol = (index: number) =>
  GOAL_FIRST_COL + index * GOAL_SPACING + (GOAL_WIDTH - 1) / 2;

export function jumpTarget(
  frog: Frog,
  direction: Direction,
): { col: number; row: number } | null {
  const vector = DIRECTION_VECTORS[direction];
  const col = frog.col + vector.col;
  const row = frog.row + vector.row;
  if (col < 0 || col > COLS - 1 || row < 0 || row > ROWS - 1) return null;
  return { col, row };
}
