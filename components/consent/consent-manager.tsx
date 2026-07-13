"use client";

// components/consent/consent-manager.tsx
//
// The preferences dialog (issue #50): where a parent chooses categories, and the
// same surface they reopen later from the footer to change or withdraw consent.
// A labelled modal dialog with a focus trap, Escape to close, background scroll
// lock, and focus restored to the trigger on close (mirrors the parental gate so
// the app has one consistent, accessible dialog pattern).
//
// No dark patterns: "Reject optional" sits right beside "Accept all" with equal
// weight, each category defaults OFF, and turning a category off is one tap. Copy
// is dash-free and high-contrast (app-wide UI rules 1 and 3); every control is a
// real button with a visible focus ring and a pointer cursor (rule 2).

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useConsent } from "./consent-provider";
import { isCategoryGranted, type OptionalCategory } from "@bedtime-quests/core/consent";

/** One optional category, described in plain parent-facing language. */
const CATEGORIES: {
  key: OptionalCategory;
  title: string;
  description: string;
}[] = [
  {
    key: "analytics",
    title: "Analytics",
    description:
      "Helps us understand how the app is used so we can make it better. Aggregate and privacy safe. Never your child's name.",
  },
  {
    key: "advertising",
    title: "Advertising",
    description:
      "Lets us show ads to keep the free plan running. Ads are based on the page, never on tracking or profiling your child.",
  },
];

/** An accessible on/off switch styled as a chunky Paper Cut control. */
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-14 flex-none cursor-pointer items-center rounded-full border-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
        checked
          ? "border-[var(--pc-leaf-ink)] bg-[var(--pc-leaf)]"
          : "border-[var(--pc-sub)] bg-white"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full shadow-[0_2px_0_rgba(22,40,58,0.35)] transition-transform ${
          checked ? "translate-x-7 bg-white" : "translate-x-1 bg-[var(--pc-sub)]"
        }`}
      />
    </button>
  );
}

export function ConsentManager() {
  const { isManagerOpen } = useConsent();
  // Only mount the dialog while it is open. Because it mounts fresh each time,
  // its draft state seeds from the current choice on mount (no syncing effect).
  if (!isManagerOpen) return null;
  return <ManagerDialog />;
}

function ManagerDialog() {
  const { state, closeManager, save, acceptAll, rejectOptional } = useConsent();

  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // Local draft of the per-category choices, seeded once from the current state
  // (default OFF when there is no decision yet). A fresh mount per open means the
  // dialog always reflects the latest stored choice.
  const [choices, setChoices] = useState<Record<OptionalCategory, boolean>>(() => ({
    analytics: isCategoryGranted(state, "analytics"),
    advertising: isCategoryGranted(state, "advertising"),
  }));

  // Focus into the panel on open, lock background scroll, restore focus on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  // Escape closes; Tab is kept inside the panel.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeManager();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeManager]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[rgba(22,40,58,0.55)] p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeManager();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className="my-8 w-full max-w-lg rounded-3xl bg-white p-6 shadow-[0_20px_44px_-18px_rgba(22,40,58,0.5)] outline-none sm:p-8"
      >
        <h2
          id={titleId}
          className="font-display text-2xl font-extrabold tracking-tight text-[var(--pc-ink)]"
        >
          Cookie choices
        </h2>
        <p id={descId} className="mt-1 text-sm font-semibold text-[var(--pc-sub)]">
          Choose what Bedtime Quests may use. You can change this any time from the
          footer. See our{" "}
          <Link
            href="/privacy"
            className="font-bold text-[var(--pc-plum-ink)] underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            Privacy Policy
          </Link>
          .
        </p>

        <ul className="mt-5 space-y-3">
          {/* Strictly necessary: always on, shown but not a choice. */}
          <li className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--pc-line)] bg-[var(--pc-sky)] p-4">
            <div>
              <p className="font-display font-extrabold text-[var(--pc-ink)]">
                Strictly necessary
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[var(--pc-ink)]">
                Keeps you signed in and the app secure. These are always on.
              </p>
            </div>
            <span className="mt-0.5 flex-none rounded-full bg-[var(--pc-leaf)] px-3 py-1 text-xs font-extrabold text-white">
              Always on
            </span>
          </li>

          {CATEGORIES.map((cat) => (
            <li
              key={cat.key}
              className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--pc-line)] bg-white p-4"
            >
              <div>
                <p className="font-display font-extrabold text-[var(--pc-ink)]">
                  {cat.title}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[var(--pc-ink)]">
                  {cat.description}
                </p>
              </div>
              <div className="mt-0.5">
                <Toggle
                  checked={choices[cat.key]}
                  onChange={(next) =>
                    setChoices((prev) => ({ ...prev, [cat.key]: next }))
                  }
                  label={`${cat.title} cookies`}
                />
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => save(choices)}
            className="w-full cursor-pointer rounded-2xl bg-[var(--pc-plum)] py-3 font-display font-bold text-white shadow-[0_5px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--pc-plum-ink)]"
          >
            Save my choices
          </button>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Reject is exactly as easy and prominent as accept (no dark pattern). */}
            <button
              type="button"
              onClick={rejectOptional}
              className="cursor-pointer rounded-2xl border-2 border-[var(--pc-ink)] bg-white py-3 font-display font-bold text-[var(--pc-ink)] shadow-[0_5px_0_var(--pc-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--pc-ink)]"
            >
              Reject optional
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="cursor-pointer rounded-2xl border-2 border-[var(--pc-leaf-ink)] bg-[var(--pc-leaf)] py-3 font-display font-bold text-white shadow-[0_5px_0_var(--pc-leaf-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--pc-leaf-ink)]"
            >
              Accept all
            </button>
          </div>
          <button
            type="button"
            onClick={closeManager}
            className="w-full cursor-pointer rounded-2xl px-2 py-2 text-sm font-bold text-[var(--pc-sub)] underline underline-offset-2 outline-none hover:text-[var(--pc-ink)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
