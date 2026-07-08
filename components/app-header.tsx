// components/app-header.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOutAction } from "@/lib/auth-actions";

export function AppHeader({ displayName }: { displayName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <header
      className="sticky top-0 z-30 border-b border-[var(--pc-line)] backdrop-blur"
      style={{ background: "color-mix(in srgb, var(--pc-sky) 85%, transparent)" }}
    >
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight text-[var(--pc-ink)]">
          <span className="relative h-6 w-6 -rotate-6 rounded-lg" style={{ background: "var(--pc-poppy)" }}>
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full" style={{ background: "var(--pc-sun)" }} />
          </span>
          Storytime
        </Link>
        <div className="flex-1" />
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
              <div role="menu" className="absolute right-0 z-20 mt-2 w-48 rounded-2xl border border-[var(--pc-line)] bg-white p-1.5 shadow-xl">
                <p className="px-3 py-2 text-sm text-[var(--pc-sub)]">Reading as <b className="text-[var(--pc-ink)]">{displayName}</b></p>
                <button
                  role="menuitem"
                  onClick={async () => { await signOutAction(); router.push("/sign-in"); router.refresh(); }}
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
