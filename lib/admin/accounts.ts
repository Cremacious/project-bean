// lib/admin/accounts.ts
//
// Read models for the /admin account panel (issue #85). Parent accounts, their
// child count, and their effective premium state (admin override applied on top
// of the billing-driven computation, exactly as lib/entitlements does it). Scoped
// to the operator's own data; no data leaves the app.
import { eq, desc, count, ilike } from "drizzle-orm";
import { db } from "@/db/client";
import { user, subscription, child, endingFound } from "@/db/schema";
import { normalizeStatus, computeIsActive } from "@bedtime-quests/core/entitlements";

/** Escape LIKE/ILIKE wildcards so a typed % or _ matches literally (default \ escape). */
function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export type AdminAccount = {
  id: string;
  email: string;
  createdAt: Date;
  disabledAt: Date | null;
  childCount: number;
  /** Admin override tri-state: null = defer to billing, true/false = forced. */
  override: boolean | null;
  billingStatus: string;
  /** Effective entitlement the app gates on (override wins over billing). */
  isPremium: boolean;
  source: string;
};

/** Every parent account with its child count and effective premium state.
 *  Pass `query` to filter by a case-insensitive substring of the email. */
export async function listAccounts(query?: string): Promise<AdminAccount[]> {
  const q = query?.trim();
  const emailFilter = q ? ilike(user.email, `%${escapeLike(q)}%`) : undefined;
  const users = await db
    .select({ id: user.id, email: user.email, createdAt: user.createdAt, disabledAt: user.disabledAt })
    .from(user)
    .where(emailFilter) // undefined is a no-op, so this returns everyone when there is no query
    .orderBy(desc(user.createdAt));

  const subs = await db.select().from(subscription);
  const subById = new Map(subs.map((s) => [s.parentId, s]));

  const counts = await db
    .select({ parentId: child.parentId, n: count() })
    .from(child)
    .groupBy(child.parentId);
  const countById = new Map(counts.map((c) => [c.parentId, Number(c.n)]));

  return users.map((u) => resolveAccount(u, subById.get(u.id), countById.get(u.id) ?? 0));
}

export type AdminAccountDetail = AdminAccount & {
  children: { id: number; name: string; createdAt: Date }[];
  endingsFound: number;
  currentPeriodEnd: Date | null;
};

/** One account with its children and progress, or null if it does not exist. */
export async function getAccount(id: string): Promise<AdminAccountDetail | null> {
  const [u] = await db
    .select({ id: user.id, email: user.email, createdAt: user.createdAt, disabledAt: user.disabledAt })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);
  if (!u) return null;

  const [sub] = await db.select().from(subscription).where(eq(subscription.parentId, id)).limit(1);
  const kids = await db
    .select({ id: child.id, name: child.name, createdAt: child.createdAt })
    .from(child)
    .where(eq(child.parentId, id))
    .orderBy(child.id);

  const childIds = kids.map((k) => k.id);
  let endingsFound = 0;
  if (childIds.length) {
    const rows = await db
      .select({ childId: endingFound.childId })
      .from(endingFound);
    const set = new Set(childIds);
    endingsFound = rows.filter((r) => set.has(r.childId)).length;
  }

  const base = resolveAccount(u, sub, kids.length);
  return { ...base, children: kids, endingsFound, currentPeriodEnd: sub?.currentPeriodEnd ?? null };
}

type UserRow = { id: string; email: string; createdAt: Date; disabledAt: Date | null };
type SubRow = typeof subscription.$inferSelect;

function resolveAccount(u: UserRow, sub: SubRow | undefined, childCount: number): AdminAccount {
  const status = sub ? normalizeStatus(sub.status) : "none";
  const billingActive = sub ? computeIsActive(status, sub.currentPeriodEnd ?? null) : false;
  const override = sub?.adminOverride ?? null;
  return {
    id: u.id,
    email: u.email,
    createdAt: u.createdAt,
    disabledAt: u.disabledAt,
    childCount,
    override,
    billingStatus: status,
    isPremium: override ?? billingActive,
    source: sub?.source ?? "internal",
  };
}
