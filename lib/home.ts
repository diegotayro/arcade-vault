import type { NeonColor } from "@/lib/games";

export type FeatureIconKind = "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";

export interface FeatureItem {
  icon: FeatureIconKind;
  title: string;
  description: string;
  color: NeonColor;
}

export interface RecentScore {
  player: string;
  gameTitle: string;
  score: number;
  timeAgo: string;
  color: NeonColor;
}

export interface TopPlayer {
  rank: number;
  player: string;
  score: number;
}

export interface StatBlock {
  value: string;
  unit: string;
  caption: string;
}

export const FEATURES: FeatureItem[] = [
  {
    icon: "GAMEPAD",
    title: "JUEGOS CLÁSICOS",
    description: "Arkanoid, Tetris, Snake y muchos más. Los mejores arcades de todos los tiempos en un solo lugar.",
    color: "cyan",
  },
  {
    icon: "FREE",
    title: "100% GRATIS",
    description: "Sin suscripciones, sin pagos ocultos. Todos los juegos disponibles de forma gratuita.",
    color: "yellow",
  },
  {
    icon: "TROPHY",
    title: "LADDER BOARDS",
    description: "Compite con jugadores de todo el mundo. Escala el ranking y demuestra quién es el mejor.",
    color: "magenta",
  },
  {
    icon: "ROCKET",
    title: "SIEMPRE CRECIENDO",
    description: "Agregamos nuevos juegos constantemente. Vuelve seguido, siempre habrá algo nuevo que jugar.",
    color: "green",
  },
];

export const RECENT_SCORES: RecentScore[] = [
  { player: "NEONFOX", gameTitle: "Caída", score: 184220, timeAgo: "hace 2 min", color: "magenta" },
  { player: "PX_KAI", gameTitle: "Glotón", score: 96400, timeAgo: "hace 5 min", color: "yellow" },
  { player: "Z3R0COOL", gameTitle: "Invasores", score: 54190, timeAgo: "hace 8 min", color: "green" },
  { player: "VAULT_07", gameTitle: "Rocas", score: 41200, timeAgo: "hace 12 min", color: "cyan" },
  { player: "GLITCHA", gameTitle: "Bloque Buster", score: 28450, timeAgo: "hace 18 min", color: "cyan" },
  { player: "ARKADYA", gameTitle: "Serpentina", score: 7820, timeAgo: "hace 24 min", color: "green" },
  { player: "CYBER_LU", gameTitle: "Ranaria", score: 18900, timeAgo: "hace 31 min", color: "yellow" },
];

export const TOP_PLAYERS: TopPlayer[] = [
  { rank: 1, player: "NEONFOX", score: 312840 },
  { rank: 2, player: "PX_KAI", score: 248110 },
  { rank: 3, player: "M00NRYU", score: 196720 },
  { rank: 4, player: "VAULT_07", score: 154300 },
  { rank: 5, player: "GLITCHA", score: 138900 },
];

export const STATS: StatBlock[] = [
  { value: "12+", unit: "JUEGOS", caption: "Y CONTANDO" },
  { value: "MILES", unit: "DE PARTIDAS", caption: "JUGADAS CADA DÍA" },
  { value: "GLOBAL", unit: "RANKING", caption: "COMPITE CON EL MUNDO" },
];
