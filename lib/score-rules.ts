export const MIN_PLAYER_NAME_LENGTH = 3;
export const MAX_PLAYER_NAME_LENGTH = 12;
export const MAX_SCORE = 10_000_000;

export const isValidPlayerName = (name: string) =>
  name.length >= MIN_PLAYER_NAME_LENGTH && name.length <= MAX_PLAYER_NAME_LENGTH;

export const isValidScore = (score: number) =>
  Number.isInteger(score) && score >= 0 && score <= MAX_SCORE;
