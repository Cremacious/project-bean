// lib/onboarding.ts
//
// Server-side read of the first-time parent tutorial state (issue #73). The
// completion flag lives per PARENT account in its own `parent_onboarding` table
// (one row per parent, present once they finish or skip the tour), so the tour
// never repeats on a new device and never greets a returning parent. The gating
// decision itself is pure and lives in @bedtime-quests/core/onboarding; this file
// only fetches the stored value.
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { parentOnboarding } from "@/db/schema";

// Postgres error code for "undefined_table". docs/DATABASE.md (section 1.4) makes
// schema migrations a deliberate step applied BEFORE the code that needs them.
// During that window (or on a dev database where the additive migration has not
// been applied yet) the table may be missing. Rather than crash the home page, we
// treat a missing table as "not completed": the worst case is the tour shows
// until the table exists, which is harmless. Any other error is a real problem
// and is rethrown.
const UNDEFINED_TABLE = "42P01";

// Drizzle wraps the driver error: the outer Error is a "Failed query" wrapper and
// the Postgres error code lives on its `cause` (a NeonDbError). Walk the cause
// chain so we recognise the missing table however deeply it is nested.
export function isMissingOnboardingTable(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; current && depth < 5; depth++) {
    if (typeof current === "object" && "code" in current && (current as { code?: string }).code === UNDEFINED_TABLE) {
      return true;
    }
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

/**
 * The moment this parent finished or skipped the tour, or null if they never
 * have. Returns null (rather than throwing) if the table is not present yet.
 */
export async function getOnboardingCompletedAt(parentId: string): Promise<Date | null> {
  try {
    const [row] = await db
      .select({ completedAt: parentOnboarding.completedAt })
      .from(parentOnboarding)
      .where(eq(parentOnboarding.parentId, parentId))
      .limit(1);
    return row?.completedAt ?? null;
  } catch (error) {
    if (isMissingOnboardingTable(error)) return null;
    throw error;
  }
}
