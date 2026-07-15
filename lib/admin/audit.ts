// lib/admin/audit.ts
//
// Append-only audit trail for sensitive /admin actions (issue #85): premium
// grants/revokes, disable/enable, and account removal. Writing a row must never
// take down the action it records, so recordAdminAudit swallows and logs its own
// errors rather than throwing.
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { adminAudit } from "@/db/schema";

export type AdminAuditEntry = {
  action: string;
  targetId?: string | null;
  adminEmail: string;
  detail?: string | null;
};

export async function recordAdminAudit(entry: AdminAuditEntry): Promise<void> {
  try {
    await db.insert(adminAudit).values({
      action: entry.action,
      targetId: entry.targetId ?? null,
      adminEmail: entry.adminEmail,
      detail: entry.detail ?? null,
    });
  } catch (err) {
    console.error("[admin-audit] Failed to write an audit entry.", entry.action, err);
  }
}

export type AdminAuditRow = typeof adminAudit.$inferSelect;

/** The most recent audit entries, newest first. */
export async function listAdminAudit(limit = 50): Promise<AdminAuditRow[]> {
  return db.select().from(adminAudit).orderBy(desc(adminAudit.createdAt)).limit(limit);
}
