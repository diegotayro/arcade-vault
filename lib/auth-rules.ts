import {
  isValidPlayerName,
  MAX_PLAYER_NAME_LENGTH,
  MIN_PLAYER_NAME_LENGTH,
} from "@/lib/score-rules";

const MAX_USERNAME_LENGTH = MAX_PLAYER_NAME_LENGTH;

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72;

export const PASSWORD_RULE_MESSAGE =
  "La contraseña debe tener entre 8 y 72 caracteres, con letras y números";
export const PASSWORD_HINT = "Mínimo 8 caracteres, con letras y números";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LETTER_PATTERN = /[A-Za-z]/;
const DIGIT_PATTERN = /[0-9]/;

export const isValidEmail = (email: string) => EMAIL_PATTERN.test(email);

export const isValidPassword = (password: string) =>
  password.length >= MIN_PASSWORD_LENGTH &&
  password.length <= MAX_PASSWORD_LENGTH &&
  LETTER_PATTERN.test(password) &&
  DIGIT_PATTERN.test(password);

export const isValidUsername = isValidPlayerName;

// Solo rutas internas: evita open redirect con `//evil.com`, `/\evil.com` o `https://evil.com`
export const safeNextPath = (next: string | null, fallback: string) =>
  next &&
  next.startsWith("/") &&
  !next.startsWith("//") &&
  !next.startsWith("/\\")
    ? next
    : fallback;

export const OAUTH_PROVIDERS = ["google", "github"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export const isOAuthProvider = (value: string): value is OAuthProvider =>
  (OAUTH_PROVIDERS as readonly string[]).includes(value);

type OAuthIdentity = {
  provider?: string;
  email?: string;
  metadata: Record<string, unknown>;
};

const providerUsername = ({ provider, metadata }: OAuthIdentity) => {
  if (provider === "github") return String(metadata.user_name ?? "");
  if (provider === "google")
    return String(metadata.full_name ?? "").replace(/\s/g, "");
  return "";
};

export const deriveUsername = (identity: OAuthIdentity) => {
  const fromProvider = providerUsername(identity).slice(0, MAX_USERNAME_LENGTH);
  if (isValidUsername(fromProvider)) return fromProvider;

  const emailLocalPart = (identity.email ?? "")
    .split("@")[0]
    .slice(0, MAX_USERNAME_LENGTH);
  return emailLocalPart.padEnd(MIN_PLAYER_NAME_LENGTH, "0");
};
