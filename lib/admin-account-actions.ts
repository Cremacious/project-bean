"use server";
//
// lib/admin-account-actions.ts
//
// The account-management server actions behind the /admin gate (issue #85):
// grant/revoke premium via the admin override, disable/enable an account, and
// permanently remove one. Every action re-checks the admin session with
// requireAdminEmail (a direct POST bypasses the layout gate) and records an audit
// entry for the sensitive ones. Destructive actions demand an explicit typed
// confirmation that is re-verified here, not just in the UI.
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { user, session } from "@/db/schema";
import { requireAdminEmail } from "@/lib/admin-session";
import { setAdminOverride } from "@/lib/entitlement-store";
import { recordAdminAudit } from "@/lib/admin/audit";

type Result = { ok: boolean; error?: string };

/**
 * Set the premium override for a parent. `override`: true forces premium ON,
 * false forces it OFF, null clears the override and defers to billing again. The
 * change is reflected immediately by content gating (lib/entitlements).
 */
export async function setPremiumOverride(parentId: string, override: boolean | null): Promise<Result> {
  let admin: string;
  try {
    admin = await requireAdminEmail();
  } catch {
    return { ok: false, error: "Not allowed" };
  }
  if (!parentId) return { ok: false, error: "Missing account" };
  await setAdminOverride(parentId, override);
  await recordAdminAudit({
    action: override === null ? "premium_clear" : override ? "premium_grant" : "premium_revoke",
    targetId: parentId,
    adminEmail: admin,
  });
  return { ok: true };
}

/**
 * Disable or re-enable an account. Disabling stamps user.disabledAt (so
 * getParent treats the parent as signed out app-wide) and revokes their existing
 * sessions so the lock-out is immediate. Enabling clears the stamp.
 */
export async function setAccountDisabled(userId: string, disabled: boolean): Promise<Result> {
  let admin: string;
  try {
    admin = await requireAdminEmail();
  } catch {
    return { ok: false, error: "Not allowed" };
  }
  if (!userId) return { ok: false, error: "Missing account" };
  await db.update(user).set({ disabledAt: disabled ? new Date() : null, updatedAt: new Date() }).where(eq(user.id, userId));
  if (disabled) {
    // Revoke live sessions so a disabled parent is logged out right away.
    await db.delete(session).where(eq(session.userId, userId));
  }
  await recordAdminAudit({
    action: disabled ? "account_disable" : "account_enable",
    targetId: userId,
    adminEmail: admin,
  });
  return { ok: true };
}

/**
 * Permanently remove an account. Requires `confirmEmail` to match the account's
 * email exactly (the same typed confirmation the UI demands, re-verified here so
 * a direct POST cannot skip it). Deleting the user row cascades to session,
 * account, child, ending_found, subscription, and the onboarding/whats-new
 * markers via the schema foreign keys. Irreversible.
 */
export async function removeAccount(userId: string, confirmEmail: string): Promise<Result> {
  let admin: string;
  try {
    admin = await requireAdminEmail();
  } catch {
    return { ok: false, error: "Not allowed" };
  }
  if (!userId) return { ok: false, error: "Missing account" };

  const [target] = await db.select({ email: user.email }).from(user).where(eq(user.id, userId)).limit(1);
  if (!target) return { ok: false, error: "That account no longer exists" };
  if (confirmEmail.trim().toLowerCase() !== target.email.trim().toLowerCase()) {
    return { ok: false, error: "The typed email does not match this account" };
  }

  // Record the audit BEFORE the delete: admin_audit has no FK to user, so the
  // entry survives the removal it is describing.
  await recordAdminAudit({ action: "account_remove", targetId: userId, adminEmail: admin, detail: target.email });
  await db.delete(user).where(eq(user.id, userId)); // cascades to all child data
  return { ok: true };
}
