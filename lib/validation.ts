// lib/validation.ts
/** Shared client + server input checks for forms. Keep all messages warm and dash-free. */

/** BetterAuth's default minimum password length. */
export const PASSWORD_MIN = 8;

/** Loose email shape check: text, a single @, then a dotted domain. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Longest a parent display name may be. */
export const DISPLAY_NAME_MAX = 60;

/** True when the display name is present and within the length cap (after trimming). */
export function isValidDisplayName(value: string): boolean {
  const v = value.trim();
  return v.length >= 1 && v.length <= DISPLAY_NAME_MAX;
}

/** The exact word a parent must type to confirm permanent account deletion. */
export const DELETE_CONFIRM_WORD = "DELETE";

/** True when the parent typed the confirmation word exactly (case sensitive, trimmed). */
export function isDeleteConfirmed(value: string): boolean {
  return value.trim() === DELETE_CONFIRM_WORD;
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
