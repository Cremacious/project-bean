// lib/active-child.ts
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getParent } from "@/lib/session";
import { getChildForParent, type Child } from "@/lib/children";

export const ACTIVE_CHILD_COOKIE = "active_child";

function secret(): string {
  const s = process.env.BETTER_AUTH_SECRET;
  if (!s) throw new Error("BETTER_AUTH_SECRET is not set");
  return s;
}
export function signChildId(id: number): string {
  const payload = String(id);
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
export function readChildId(token: string | undefined): number | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const n = Number(payload);
  return Number.isInteger(n) ? n : null;
}

/** The active child (validated against the signed-in parent), or null. */
export async function getActiveChild(): Promise<Child | null> {
  const parent = await getParent();
  if (!parent) return null;
  const jar = await cookies();
  const id = readChildId(jar.get(ACTIVE_CHILD_COOKIE)?.value);
  if (id == null) return null;
  return getChildForParent(parent.id, id);
}
