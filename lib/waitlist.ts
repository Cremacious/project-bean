// lib/waitlist.ts
//
// The persistence + validation seam for the marketing waitlist (issue #68). The
// public /welcome page collects a parent's email (name optional) to notify them
// at launch. Kept as a plain, testable function (mock @/db/client in the unit
// test) and separate from the "use server" action wrapper in
// lib/waitlist-actions.ts, matching how the rest of the app splits domain logic
// from its server-action entry points.
//
// This only ever stores an adult's email + optional name. No child data lands
// here (COPPA, docs/COMPLIANCE-COPPA.md).
import { db } from "@/db/client";
import { waitlist } from "@/db/schema";
import { isValidEmail, DISPLAY_NAME_MAX } from "@bedtime-quests/core/validation";
import { sendEmail, waitlistConfirmationEmail } from "@/lib/email";

export type AddToWaitlistInput = {
  email: string;
  /** Optional first name; blank/whitespace is treated as absent. */
  name?: string | null;
  /** Where the signup came from, for future attribution. Defaults to "welcome". */
  source?: string;
};

export type AddToWaitlistResult =
  | { ok: true; status: "added" | "already_on_list" }
  | { ok: false; reason: "invalid_email" | "error" };

/**
 * Adds one parent to the launch waitlist.
 *
 * - Validates the email shape with the same check the auth forms use.
 * - Normalises the email (trim + lowercase) so casing never creates a duplicate.
 * - Relies on the unique email constraint for race-safe de-duplication via
 *   onConflictDoNothing: an insert that returns no row means the email was
 *   already on the list, which is reported as a graceful success, not an error.
 * - On a genuinely new signup, sends a best-effort confirmation email. sendEmail
 *   already no-ops (logs) when RESEND_API_KEY/EMAIL_FROM are absent, and a send
 *   failure never fails the signup.
 */
export async function addToWaitlist(input: AddToWaitlistInput): Promise<AddToWaitlistResult> {
  const email = input.email.trim().toLowerCase();
  if (!isValidEmail(email)) return { ok: false, reason: "invalid_email" };

  const trimmedName = input.name?.trim() ?? "";
  const name = trimmedName ? trimmedName.slice(0, DISPLAY_NAME_MAX) : null;
  const source = input.source?.trim() || "welcome";

  try {
    const inserted = await db
      .insert(waitlist)
      .values({ email, name, source })
      .onConflictDoNothing({ target: waitlist.email })
      .returning({ id: waitlist.id });

    const added = inserted.length > 0;

    if (added) {
      try {
        const message = waitlistConfirmationEmail({ name });
        await sendEmail({ to: email, ...message });
      } catch (err) {
        // A confirmation email is a nicety, not part of the signup contract.
        console.error("Waitlist confirmation email failed to send.", err);
      }
    }

    return { ok: true, status: added ? "added" : "already_on_list" };
  } catch (err) {
    console.error("Failed to persist a waitlist signup.", err);
    return { ok: false, reason: "error" };
  }
}
