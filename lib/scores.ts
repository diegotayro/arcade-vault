export interface ScoreEntry {
  rank: number;
  name: string;
  score: number;
  date: string;
}

const PLAYERS = [
  "PX_KAI", "NEONFOX", "Z3R0COOL", "M00NRYU", "VAULT_07", "GLITCHA",
  "ATARI_KID", "CYBER_LU", "MAGENTA88", "SCANLINE", "BIT_LORD", "ARKADYA",
  "DROID_X", "RGB_QUEEN", "PIXEL_DAD", "RETROVIRA", "VECTORX", "JOY_STK",
];

const MIN_SCORE = 1000;

// Generador congruencial lineal: misma semilla, mismo resultado (evita errores de hidratación)
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

const twoDigits = (value: number) => String(value).padStart(2, "0");

export function seededScores(seed: number, count = 12): ScoreEntry[] {
  const random = createRandom(seed);
  const usedNames = new Set<string>();
  const rows: ScoreEntry[] = [];

  for (let i = 0; i < count; i++) {
    let name: string;
    do {
      name = PLAYERS[Math.floor(random() * PLAYERS.length)];
    } while (usedNames.has(name) && usedNames.size < PLAYERS.length);
    usedNames.add(name);

    const base = Math.floor(50000 + random() * 250000);
    const score = base - i * Math.floor(2000 + random() * 4000);
    const day = twoDigits(1 + Math.floor(random() * 28));
    const month = twoDigits(1 + Math.floor(random() * 12));

    rows.push({ rank: i + 1, name, score: Math.max(score, MIN_SCORE), date: `${day}/${month}/2026` });
  }

  return rows
    .sort((a, b) => b.score - a.score)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}
