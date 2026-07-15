// lib/support.ts
//
// The pure, testable core of the Help page contact form (issue #72): validating a
// parent's message and deciding where (or whether) it can be delivered. Kept free
// of React, Next, and I/O so it unit tests without a server, exactly like
// lib/validation and lib/ads. The "use server" wiring lives in
// lib/support-actions.ts; the email template lives in lib/email/templates.ts.
//
// Copy note (UI rule 1): every message here is warm and dash free.
import { isValidEmail } from "@bedtime-quests/core/validation";
import { LEGAL, isPlaceholder } from "@/lib/legal";

/** Longest a parent's message may be, to keep a stray paste from becoming abuse. */
export const SUPPORT_MESSAGE_MAX = 4000;
/** Shortest a message may be, so an empty or one character send is rejected. */
export const SUPPORT_MESSAGE_MIN = 2;
/** Longest an optional name may be, matching the account display name cap. */
export const SUPPORT_NAME_MAX = 60;

/** The raw fields a submission carries. */
export type SupportRequestInput = {
  email: string;
  message: string;
  /** Optional; the parent may leave their name off. */
  name?: string;
};

/** A clean, trimmed submission ready to turn into an email. */
export type SupportRequest = {
  email: string;
  message: string;
  /** Empty string when not supplied. */
  name: string;
};

/** Which field a validation error points at, so the form can highlight it. */
export type SupportField = "email" | "message";

export type SupportValidation =
  | { ok: true; value: SupportRequest }
  | { ok: false; field: SupportField; message: string };

const INVALID_EMAIL = "That email does not look right. Please check for typos.";
const EMPTY_MESSAGE = "Please add a short message so we know how to help.";
const LONG_MESSAGE = "That message is a little long. Please shorten it and try again.";

/**
 * Validate and normalize a submission. Server side truth: the action calls this
 * rather than trusting the client, since a Server Action is reachable by direct
 * POST. Returns the trimmed request on success, or the first field error.
 */
export function validateSupportRequest(input: SupportRequestInput): SupportValidation {
  const email = (input.email ?? "").trim();
  const message = (input.message ?? "").trim();
  const name = (input.name ?? "").trim().slice(0, SUPPORT_NAME_MAX);

  if (!isValidEmail(email)) {
    return { ok: false, field: "email", message: INVALID_EMAIL };
  }
  if (message.length < SUPPORT_MESSAGE_MIN) {
    return { ok: false, field: "message", message: EMPTY_MESSAGE };
  }
  if (message.length > SUPPORT_MESSAGE_MAX) {
    return { ok: false, field: "message", message: LONG_MESSAGE };
  }

  return { ok: true, value: { email, message, name } };
}

/**
 * Where a support message should be delivered, or null when we have nowhere to
 * send it yet. Order: an explicit SUPPORT_EMAIL wins, otherwise the published
 * support address from lib/legal once it is filled (it ships as a [SUPPORT EMAIL]
 * placeholder). A null result means "no support inbox is configured", which the
 * action treats as a safe no-op, mirroring how sendEmail degrades with no provider.
 */
export function resolveSupportInbox(env: Partial<NodeJS.ProcessEnv> = process.env): string | null {
  const fromEnv = env.SUPPORT_EMAIL?.trim();
  if (fromEnv && isValidEmail(fromEnv)) return fromEnv;

  const published = LEGAL.supportEmail;
  if (!isPlaceholder(published) && isValidEmail(published)) return published;

  return null;
}
