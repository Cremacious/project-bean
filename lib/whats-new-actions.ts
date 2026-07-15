// lib/whats-new-actions.ts
"use server";
import { getParent } from "@/lib/session";
import { db } from "@/db/client";
import { whatsNewSeen } from "@/db/schema";
import { isMissingWhatsNewTable } from "@/lib/whats-new";

/**
 * Record that the signed-in parent has opened the "What's new" panel on a given
 * changelog entry (issue #74), clearing the unseen dot until a newer entry ships.
 * Upserts one row in `whats_new_seen` keyed on the parent, always advancing the
 * marker to `entryId` (the latest entry they just saw).
 *
 * The client also records the same id in local storage as a secondary, per-device
 * fallback so the dot clears immediately even if the table is not present yet (a
 * dev database, or the brief window before the additive migration is applied per
 * docs/DATABASE.md section 1.4). Hence a missing table is treated as a soft,
 * non-fatal outcome rather than an error.
 */
export async function markWhatsNewSeen(entryId: string): Promise<{ ok: boolean }> {
  const parent = await getParent();
  if (!parent) return { ok: false };
  // Guard against an empty/garbage id so we never write a marker the core
  // decision cannot match against a real entry.
  if (typeof entryId !== "string" || entryId.trim() === "") return { ok: false };

  try {
    await db
      .insert(whatsNewSeen)
      .values({ parentId: parent.id, lastSeenEntryId: entryId, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: whatsNewSeen.parentId,
        set: { lastSeenEntryId: entryId, updatedAt: new Date() },
      });
    return { ok: true };
  } catch (error) {
    if (isMissingWhatsNewTable(error)) {
      // Deploy/dev window before the additive migration has been applied. The
      // per-device local storage flag still clears the dot; log and move on.
      console.warn("whats_new_seen table not present yet; relying on the local fallback.");
      return { ok: false };
    }
    throw error;
  }
}
