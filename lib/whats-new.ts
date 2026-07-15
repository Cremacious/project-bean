// lib/whats-new.ts
//
// Server-side read of the "What's new" seen marker (issue #74). The marker lives
// per PARENT account in its own `whats_new_seen` table (one row per parent, the
// id of the newest changelog entry they have opened the panel on), so the unseen
// dot is honest across devices and never greets a parent who has already caught
// up. The unseen DECISION itself is pure and lives in
// @bedtime-quests/core/changelog (hasUnseenWhatsNew); this file only fetches the
// stored value.
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { whatsNewSeen } from "@/db/schema";

// Postgres error code for "undefined_table". docs/DATABASE.md (section 1.4) makes
// schema migrations a deliberate step applied BEFORE the code that needs them.
// During that window (or on a dev database where the additive migration has not
// been applied yet) the table may be missing. Rather than crash the app shell, we
// treat a missing table as "nothing seen yet": the worst case is the dot shows
// until the table exists, which is harmless and never blocks the app. Any other
// error is a real problem and is rethrown.
const UNDEFINED_TABLE = "42P01";

// Drizzle wraps the driver error: the outer Error is a "Failed query" wrapper and
// the Postgres error code lives on its `cause` (a NeonDbError). Walk the cause
// chain so we recognise the missing table however deeply it is nested.
export function isMissingWhatsNewTable(error: unknown): boolean {
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
 * The id of the newest changelog entry this parent has opened the "What's new"
 * panel on, or null if they never have. Returns null (rather than throwing) if
 * the table is not present yet.
 */
export async function getWhatsNewSeenEntryId(parentId: string): Promise<string | null> {
  try {
    const [row] = await db
      .select({ lastSeenEntryId: whatsNewSeen.lastSeenEntryId })
      .from(whatsNewSeen)
      .where(eq(whatsNewSeen.parentId, parentId))
      .limit(1);
    return row?.lastSeenEntryId ?? null;
  } catch (error) {
    if (isMissingWhatsNewTable(error)) return null;
    throw error;
  }
}
