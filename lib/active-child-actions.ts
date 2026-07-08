// lib/active-child-actions.ts
"use server";
import { cookies } from "next/headers";
import { getParent } from "@/lib/session";
import { getChildForParent } from "@/lib/children";
import { ACTIVE_CHILD_COOKIE, signChildId } from "@/lib/active-child";

export async function setActiveChild(childId: number): Promise<{ ok: boolean }> {
  const parent = await getParent();
  if (!parent) return { ok: false };
  const c = await getChildForParent(parent.id, childId);
  if (!c) return { ok: false };
  const jar = await cookies();
  jar.set(ACTIVE_CHILD_COOKIE, signChildId(childId), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 60 * 60 * 24 * 90,
  });
  return { ok: true };
}

export async function clearActiveChild(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACTIVE_CHILD_COOKIE);
}
