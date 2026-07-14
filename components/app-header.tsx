"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import { clearActiveChild } from "@/lib/active-child-actions";
import { BRAND } from "@/lib/brand";
import { BrandMark } from "@/components/brand-mark";
import { useParentalGate } from "@/components/parental-gate/parental-gate-provider";

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-5 w-5">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 1.8c-4.3 0-7.8 2.6-7.8 5.9 0 .6.5 1.1 1.1 1.1h13.4c.6 0 1.1-.5 1.1-1.1 0-3.3-3.5-5.9-7.8-5.9Z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={`h-3.5 w-3.5 text-[var(--pc-sub)] transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AppHeader({
  parentName,
  activeChildName,
  isAdmin = false,
}: {
  parentName: string;
  activeChildName: string | null;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const requireAdult = useParentalGate();
  const [open, setOpen] = useState(false);

  // Keyboard users open the menu with Enter/Space; Escape must close it and
  // return focus to the trigger (issue #13).
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleSwitch() {
    setOpen(false);
    await clearActiveChild();
    router.push("/");
    router.refresh();
  }

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/sign-in");
    router.refresh();
  }

  // Family and Account settings hold the parent controls a child should not reach:
  // per child delete, full account delete, and billing (docs/COMPLIANCE-COPPA.md
  // section 4, issue #64 GAP 4). Gate the entry with the same grown up check the
  // sign up and purchase flows use, so a child cannot wander into data controls.
  async function openBehindGate(href: string) {
    setOpen(false);
    const ok = await requireAdult("settings");
    if (!ok) return;
    router.push(href);
  }

  return (
    <header className="pt-safe sticky top-0 z-30 flex-none border-b border-[var(--pc-plum-ink)] bg-[var(--pc-plum)]">
      <div className="px-gutter mx-auto flex h-14 w-full max-w-5xl items-center gap-2 sm:h-16 sm:gap-3">
        <Link
          href="/"
          aria-label={`${BRAND.name} home`}
          className="flex flex-none cursor-pointer items-center gap-2.5 rounded-lg font-display text-lg font-extrabold tracking-tight text-white outline-none focus-visible:ring-2 focus-visible:ring-white sm:text-xl"
        >
          <BrandMark size="md" />
          {BRAND.name}
        </Link>

        <div className="flex-1" />

        {/* Reader indicator + switch. Desktop only; on mobile these live in the
            account menu to keep the bar uncluttered and aligned. */}
        {activeChildName && (
          <div className="hidden h-10 shrink-0 items-center gap-1 rounded-full border border-[var(--pc-line)] bg-white pl-3 pr-1 sm:flex">
            <span className="whitespace-nowrap text-sm text-[var(--pc-sub)]">
              Reading: <b className="font-display text-[var(--pc-ink)]">{activeChildName}</b>
            </span>
            <button
              onClick={handleSwitch}
              className="h-8 cursor-pointer rounded-full bg-[var(--accent)] px-3 text-xs font-bold text-[var(--accent-foreground)] outline-none transition-colors hover:brightness-95 focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              Switch
            </button>
          </div>
        )}

        {activeChildName && (
          <Link
            href="/collection"
            className="hidden h-10 shrink-0 cursor-pointer items-center rounded-full px-4 text-sm font-extrabold text-[var(--pc-ink)] shadow-[0_2px_0_var(--pc-sun-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--pc-ink)] active:translate-y-0.5 sm:inline-flex"
            style={{ background: "var(--pc-sun)" }}
          >
            My Collection
          </Link>
        )}

        <div className="relative flex-none">
          <button
            ref={triggerRef}
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="Menu"
            className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-[var(--pc-line)] bg-white pl-3 pr-2.5 text-[var(--pc-ink)] outline-none transition-colors hover:bg-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--pc-ink)]"
          >
            <PersonIcon />
            <span className="text-sm font-bold">Menu</span>
            <ChevronIcon open={open} />
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div
                role="menu"
                className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-[var(--pc-line)] bg-white p-1.5 shadow-xl"
              >
                <p className="px-3 py-2 text-sm text-[var(--pc-sub)]">
                  Signed in as <b className="text-[var(--pc-ink)]">{parentName}</b>
                </p>

                {/* Mobile only: the reader controls that show inline on desktop. */}
                {activeChildName && (
                  <div className="sm:hidden">
                    <p className="px-3 pt-1 text-sm text-[var(--pc-sub)]">
                      Reading: <b className="text-[var(--pc-ink)]">{activeChildName}</b>
                    </p>
                    <Link
                      href="/collection"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="block w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--pc-ink)] outline-none hover:bg-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    >
                      My Collection
                    </Link>
                    <button
                      role="menuitem"
                      onClick={handleSwitch}
                      className="w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--pc-ink)] outline-none hover:bg-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    >
                      Switch reader
                    </button>
                    <div className="my-1 h-px bg-[var(--pc-line)]" />
                  </div>
                )}

                <button
                  role="menuitem"
                  onClick={() => openBehindGate("/family")}
                  className="block w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--pc-ink)] outline-none hover:bg-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  Family
                </button>
                <button
                  role="menuitem"
                  onClick={() => openBehindGate("/account")}
                  className="block w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--pc-ink)] outline-none hover:bg-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  Account settings
                </button>
                {isAdmin && (
                  <Link
                    href="/admin"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="block w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--pc-ink)] outline-none hover:bg-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  >
                    Admin
                  </Link>
                )}
                <button
                  role="menuitem"
                  onClick={handleSignOut}
                  className="w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--pc-ink)] outline-none hover:bg-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
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
