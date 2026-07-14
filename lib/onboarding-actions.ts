// lib/onboarding-actions.ts
"use server";
import { getParent } from "@/lib/session";
import { db } from "@/db/client";
import { parentOnboarding } from "@/db/schema";
import { isMissingOnboardingTable } from "@/lib/onboarding";

/**
 * Mark the signed-in parent's first-time tutorial as finished or skipped (issue
 * #73) by recording one row in `parent_onboarding`. That row is what stops the
 * tour auto showing again on this or any other device (see
 * shouldAutoShowOnboarding in the shared core). Idempotent: a second call (for
 * example a later re-open from settings) does nothing, so the original completion
 * date is preserved.
 *
 * The client also records completion in local storage as a secondary, per-device
 * fallback, so if the table is not present yet (a dev database, or the brief
 * window before a migration is applied per docs/DATABASE.md section 1.4) the tour
 * still will not reappear on that device. Hence a missing table is treated as a
 * soft, non-fatal outcome rather than an error.
 */
export async function completeOnboarding(): Promise<{ ok: boolean }> {
  const parent = await getParent();
  if (!parent) return { ok: false };
  try {
    await db
      .insert(parentOnboarding)
      .values({ parentId: parent.id })
      .onConflictDoNothing();
    return { ok: true };
  } catch (error) {
    if (isMissingOnboardingTable(error)) {
      // Deploy/dev window before the additive migration has been applied. The
      // per-device local storage flag still suppresses the tour; log and move on.
      console.warn("parent_onboarding table not present yet; relying on the local fallback.");
      return { ok: false };
    }
    throw error;
  }
}
