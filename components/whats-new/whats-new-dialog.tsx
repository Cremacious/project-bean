// components/whats-new/whats-new-dialog.tsx
//
// The in-app "What's new" modal (issue #74). A dismissible overlay that shows the
// shared changelog (ChangelogList) so a returning parent can see what changed. It
// never blocks the app: it only opens when the parent chooses it from the menu,
// closes on the backdrop, the close button, or Escape, and returns focus to
// wherever it came from.
"use client";

import { useEffect, useRef } from "react";
import { WHATS_NEW_COPY } from "@bedtime-quests/core/changelog";
import { ChangelogList } from "@/components/whats-new/changelog-list";

export function WhatsNewDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape closes; move focus to the close button when it opens so keyboard users
  // land inside the dialog. Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whats-new-title"
    >
      {/* Backdrop: click to dismiss. */}
      <button
        type="button"
        aria-label={WHATS_NEW_COPY.close}
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-[var(--pc-ink)]/40"
      />

      <div className="relative z-10 flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border-2 border-[var(--pc-line)] bg-white shadow-2xl sm:rounded-3xl">
        <header className="flex items-start justify-between gap-3 border-b-2 border-[var(--pc-line)] bg-white px-5 py-4">
          <div>
            <h2
              id="whats-new-title"
              className="font-display text-2xl font-extrabold tracking-tight text-[var(--pc-ink)]"
            >
              {WHATS_NEW_COPY.title}
            </h2>
            <p className="mt-0.5 text-sm font-semibold text-[var(--pc-sub)]">{WHATS_NEW_COPY.intro}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={WHATS_NEW_COPY.close}
            className="flex h-10 w-10 flex-none cursor-pointer items-center justify-center rounded-full border-2 border-[var(--pc-line)] bg-white text-[var(--pc-ink)] shadow-[0_3px_0_var(--pc-line)] outline-none transition-transform hover:translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden>
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5">
          <ChangelogList />
          <p className="mt-5 text-center">
            <a
              href="/whats-new"
              className="cursor-pointer text-sm font-bold text-[var(--pc-plum-ink)] underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              See the full history
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
