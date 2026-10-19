export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type NeonColor = "cyan" | "magenta" | "yellow" | "green";

export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  category: GameCategory;
  cover: string;
  color: NeonColor;
  best: number;
  plays: string;
}

export const CATEGORIES = [
  "TODOS",
  "ARCADE",
  "PUZZLE",
  "SHOOTER",
  "VERSUS",
] as const;
