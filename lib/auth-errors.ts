// lib/auth-errors.ts
/** Maps BetterAuth client errors to warm, dash-free messages for our forms. */

/** The subset of a BetterAuth client error we read: an HTTP status and message. */
export type AuthLikeError = { status?: number; message?: string } | null | undefined;

/** Shown when the auth endpoint rate limiter (HTTP 429) turns an attempt away. */
export const RATE_LIMIT_MESSAGE =
  "Too many attempts. Please wait a moment, then try again.";

/**
 * A friendly message for a failed auth call. Rate-limited responses (429) get a
 * calm "slow down" note; otherwise we surface the server's message, falling back
 * to the caller's default when none is present.
 */
export function friendlyAuthError(error: AuthLikeError, fallback: string): string {
  if (error?.status === 429) return RATE_LIMIT_MESSAGE;
  return error?.message?.trim() || fallback;
}
