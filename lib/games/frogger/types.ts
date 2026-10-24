import type { SkinId } from "@/lib/games/skins";

export interface FroggerCallbacks {
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onPauseChange: (isPaused: boolean) => void;
  onGameOver: (finalScore: number) => void;
}

export interface FroggerEngine {
  start: () => void; // inicia el loop y los listeners
  pause: () => void;
  resume: () => void;
  endGame: () => void; // fuerza game over (botón FIN)
  restart: () => void;
  destroy: () => void; // cancela rAF y quita listeners
  setSkin: (skin: FroggerSkin) => void; // redibuja sin reiniciar
}

export type FroggerState = "playing" | "gameover";

export type Direction = "up" | "down" | "left" | "right";

export type EntityType = "car" | "truck" | "log" | "turtle";

export interface Entity {
  col: number; // fraccional: las entidades se desplazan en continuo
  width: number;
  type: EntityType;
  submerged?: boolean;
  diveClock?: number; // ms dentro del ciclo de inmersión (solo tortugas)
}

export interface Lane {
  row: number;
  speed: number; // px/frame a 60 fps
  dir: 1 | -1;
  period: number; // celdas tras las que el patrón del carril se repite
  entities: Entity[];
}

export interface Frog {
  col: number; // fraccional mientras viaja sobre troncos o tortugas
  row: number;
  animating: boolean;
  animT: number;
  targetCol: number;
  targetRow: number;
  facing: Direction;
}

export type FroggerSkin = SkinId;
export type DrawStyle = "flat" | "glow" | "soft" | "pixel";

export interface SkinDefinition {
  label: string;
  drawStyle: DrawStyle;
  goalZone: string;
  goalSlot: string;
  goalBorder: string;
  river: string;
  safe: string;
  road: string;
  laneMark: string;
  cars: readonly string[];
  truck: string;
  truckCab: string;
  wheel: string;
  log: string;
  logLine: string;
  turtle: string;
  turtleScale: string;
  turtleSubmerged: string;
  frog: string;
  frogDark: string;
  eyeWhite: string;
  eyePupil: string;
  hudText: string;
  hudShadow: string;
  timeHigh: string;
  timeMid: string;
  timeLow: string;
  overlayBackground: string;
  overlayText: string;
}
