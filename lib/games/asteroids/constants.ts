import { DEFAULT_SKIN_ID } from "@/lib/games/skins";

import type { AsteroidsSkin, SkinDefinition } from "./types";

export const WIDTH = 800;
export const HEIGHT = 600;

export const INITIAL_LIVES = 3;

// Indexados por tamaño de asteroide (1 pequeño, 2 mediano, 3 grande)
export const RADII = [0, 16, 30, 50] as const;
export const SPEEDS = [0, 85, 55, 32] as const;
export const POINTS = [0, 100, 50, 20] as const;

export const POWERUP_DROP_CHANCE = 0.15;
export const POWERUP_DURATION = 5;
export const POWERUP_TTL = 12;
export const TRIPLE_SPREAD = 0.18;

export const DEFAULT_SKIN: AsteroidsSkin = DEFAULT_SKIN_ID;

export const SKINS: Record<AsteroidsSkin, SkinDefinition> = {
  retro: {
    drawStyle: "vector",
    background: "#000",
    ship: { line: "#fff", fill: null },
    thrust: "rgba(255, 130, 0, 0.85)",
    asteroid: { line: "#fff", fill: null },
    bullet: "#fff",
    powerUp: { line: "#0ff", fill: null },
    particle: "#fff",
    text: "#fff",
    textDim: "rgba(255,255,255,0.65)",
    overlayBackground: null,
  },
  neon: {
    drawStyle: "glow",
    background: "#05050c",
    ship: { line: "#00f5ff", fill: null },
    thrust: "#ff8c00",
    asteroid: { line: "#ff2bd6", fill: "rgba(255, 43, 214, 0.08)" },
    bullet: "#f5ff00",
    powerUp: { line: "#39ff14", fill: null },
    particle: "#ff6ad5",
    text: "#ffffff",
    textDim: "rgba(0, 245, 255, 0.75)",
    overlayBackground: "rgba(5, 5, 12, 0.7)",
  },
  pastel: {
    drawStyle: "soft",
    background: "#f6f1ea",
    ship: { line: "#4f6fa8", fill: "#c9dbf7" },
    thrust: "#e8955a",
    asteroid: { line: "#7d6290", fill: "#e6d8ee" },
    bullet: "#c8507a",
    powerUp: { line: "#2f7f74", fill: "#c4ece4" },
    particle: "#a08a70",
    text: "#4a4238",
    textDim: "#7a6f62",
    overlayBackground: "rgba(246, 241, 234, 0.8)",
  },
  // Dos tonos por entidad: contorno claro y relleno oscuro
  pixel: {
    drawStyle: "pixel",
    background: "#0f0f1e",
    ship: { line: "#7cf0ff", fill: "#1f5fbf" },
    thrust: "#f08010",
    asteroid: { line: "#c8a070", fill: "#5a3c24" },
    bullet: "#f8d800",
    powerUp: { line: "#80f080", fill: "#207a30" },
    particle: "#f08010",
    text: "#f0f0f0",
    textDim: "#8888aa",
    overlayBackground: "rgba(15, 15, 30, 0.85)",
  },
};
