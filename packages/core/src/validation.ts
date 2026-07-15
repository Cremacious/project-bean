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

/** A password strength read-out for the on-screen meter. `score` runs 0 (too
 *  short to judge) up to 4 (strong). `label` is warm and dash-free. This is only
 *  an indicator: the sole hard gate on sign-up stays PASSWORD_MIN length. */
export type PasswordStrength = { score: number; label: string };

/** Score a password by length and character variety. Below PASSWORD_MIN we do
 *  not grade it (score 0), matching the length rule the form still enforces. */
export function passwordStrength(value: string): PasswordStrength {
  if (value.length < PASSWORD_MIN) return { score: 0, label: "Too short" };
  let points = 0;
  if (/[a-z]/.test(value)) points += 1;
  if (/[A-Z]/.test(value)) points += 1;
  if (/[0-9]/.test(value)) points += 1;
  if (/[^A-Za-z0-9]/.test(value)) points += 1;
  if (value.length >= 12) points += 1;
  if (value.length >= 16) points += 1;
  // points is 1..6 once the length floor is met; fold it into a 1..4 score.
  const score = points <= 1 ? 1 : points === 2 ? 2 : points <= 4 ? 3 : 4;
  const label = score === 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";
  return { score, label };
}

/** True when both passwords are non-empty and identical. Drives the live
 *  "passwords match" indicator; callers keep their own submit-time check. */
export function passwordsMatch(a: string, b: string): boolean {
  return a.length > 0 && a === b;
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
