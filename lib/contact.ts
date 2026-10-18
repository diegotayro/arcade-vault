export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

export type ContactResult =
  | { status: "success"; senderName: string }
  | { status: "error"; reason: "invalid" | "send-failed" };

export const CONTACT_LIMITS = { name: 80, email: 254, message: 2000 } as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isWithinLimit(value: string, limit: number): boolean {
  return value.length > 0 && value.length <= limit;
}

export function validateContactMessage(input: ContactMessage): ContactMessage | null {
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();

  const isValid =
    isWithinLimit(name, CONTACT_LIMITS.name) &&
    isWithinLimit(email, CONTACT_LIMITS.email) &&
    EMAIL_PATTERN.test(email) &&
    isWithinLimit(message, CONTACT_LIMITS.message);

  return isValid ? { name, email, message } : null;
}
