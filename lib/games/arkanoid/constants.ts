export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PADDLE_WIDTH = 81;
export const PADDLE_HEIGHT = 14;
export const PADDLE_Y = 560;
export const PADDLE_SPEED = 400;
// Margen bajo la paleta en el que todavía cuenta el rebote
export const PADDLE_BOUNCE_TOLERANCE = 8;

export const BALL_SIZE = 16;
export const BASE_BALL_VX = 200;
export const BASE_BALL_VY = -300;

export const BLOCK_COLS = 10;
export const BLOCK_WIDTH = 64;
export const BLOCK_HEIGHT = 24;
export const BLOCKS_ORIGIN_X = (CANVAS_WIDTH - BLOCK_COLS * BLOCK_WIDTH) / 2;
export const BLOCKS_ORIGIN_Y = 80;

export const POINTS_PER_BLOCK = 10;
export const INITIAL_LIVES = 3;
export const MAX_LEVEL = 5;

// Límite de dt (segundos) para que un frame largo no atraviese bloques
export const MAX_DT = 0.05;

export const EXPLOSION_DURATION = 150; // ms
export const EXPLOSION_FRAME_COUNT = 4;

export const SPRITESHEET_URL = "/games/arkanoid/spritesheet-breakout.png";
export const BOUNCE_SOUND_URL = "/games/arkanoid/sounds/ball-bounce.mp3";
export const BREAK_SOUND_URL = "/games/arkanoid/sounds/break-sound.mp3";
