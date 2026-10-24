// Deben coincidir con `images.remotePatterns` de next.config.ts
const AVATAR_HOSTS = [
  ".googleusercontent.com",
  "avatars.githubusercontent.com",
];

const isAllowedHost = (hostname: string) =>
  AVATAR_HOSTS.some((host) =>
    host.startsWith(".") ? hostname.endsWith(host) : hostname === host,
  );

export function toAvatarUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && isAllowedHost(url.hostname)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function getInitials(username: string) {
  const words = username.split(/[\s._-]+/).filter(Boolean);
  const initials =
    words.length >= 2 ? words[0][0] + words[1][0] : username.slice(0, 2);
  return initials.toUpperCase() || "?";
}
