"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import { clearActiveChild } from "@/lib/active-child-actions";

export function AppHeader({
  parentName,
  activeChildName,
}: {
  parentName: string;
  activeChildName: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const initial = parentName.trim().charAt(0).toUpperCase() || "?";

  async function handleSwitch() {
    await clearActiveChild();
    router.push("/");
    router.refresh();
  }

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <header
      className="sticky top-0 z-30 flex-none border-b border-[var(--pc-line)] backdrop-blur"
      style={{ background: "color-mix(in srgb, var(--pc-sky) 85%, transparent)" }}
    >
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight text-[var(--pc-ink)]">
          <span className="relative h-6 w-6 -rotate-6 rounded-lg" style={{ background: "var(--pc-poppy)" }}>
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full" style={{ background: "var(--pc-sun)" }} />
          </span>
          Storytime
        </Link>

        <div className="flex-1" />

        {activeChildName && (
          <div className="hidden items-center gap-2 rounded-full border border-[var(--pc-line)] bg-white py-1 pl-3 pr-1 sm:flex">
            <span className="text-sm text-[var(--pc-sub)]">
              Reading: <b className="font-display text-[var(--pc-ink)]">{activeChildName}</b>
            </span>
            <button
              onClick={handleSwitch}
              className="min-h-[32px] rounded-full px-3 py-1 text-xs font-bold text-[var(--pc-plum-ink)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] hover:bg-[var(--accent)]"
            >
              Switch
            </button>
          </div>
        )}

        {activeChildName && (
          <button
            onClick={handleSwitch}
            className="min-h-[44px] rounded-full border border-[var(--pc-line)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--pc-plum-ink)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] sm:hidden"
          >
            Switch
          </button>
        )}

        {activeChildName && (
          <Link
            href="/collection"
            className="min-h-[44px] rounded-full px-3 py-2 text-center text-xs font-extrabold text-white shadow-[0_4px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 sm:px-4 sm:text-sm"
            style={{ background: "var(--pc-plum)" }}
          >
            My Collection
          </Link>
        )}

        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            className="grid h-9 w-9 rotate-3 place-items-center rounded-xl font-display font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            style={{ background: "var(--pc-plum)" }}
          >
            {initial}
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div role="menu" className="absolute right-0 z-20 mt-2 w-52 rounded-2xl border border-[var(--pc-line)] bg-white p-1.5 shadow-xl">
                <p className="px-3 py-2 text-sm text-[var(--pc-sub)]">
                  Signed in as <b className="text-[var(--pc-ink)]">{parentName}</b>
                </p>
                <Link
                  href="/family"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--pc-ink)] hover:bg-[var(--muted)]"
                >
                  Family
                </Link>
                <button
                  role="menuitem"
                  onClick={handleSignOut}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--pc-ink)] hover:bg-[var(--muted)]"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
