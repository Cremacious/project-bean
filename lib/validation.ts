// lib/validation.ts
/** Shared client + server input checks for forms. Keep all messages warm and dash-free. */

/** BetterAuth's default minimum password length. */
export const PASSWORD_MIN = 8;

/** Loose email shape check: text, a single @, then a dotted domain. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** True when the value is a plausible http or https web address. Callers decide if empty is allowed. */
export function isValidHttpUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  try {
    const url = new URL(v);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
