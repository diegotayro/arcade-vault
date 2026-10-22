// Piezas comunes a todos los juegos con selector de skins

export const SKIN_IDS = ["retro", "neon", "pastel", "pixel"] as const;

export type SkinId = (typeof SKIN_IDS)[number];

export const SKIN_LABELS: Record<SkinId, string> = {
  retro: "RETRO",
  neon: "NEON",
  pastel: "PASTEL",
  pixel: "PIXEL ART",
};

export const DEFAULT_SKIN_ID: SkinId = "retro";

export const isSkinId = (value: unknown): value is SkinId =>
  typeof value === "string" && (SKIN_IDS as readonly string[]).includes(value);

export const skinStorageKey = (gameId: string) => `${gameId}-skin`;
