"use client";

import { useEffect, useRef, useState } from "react";
import {
  ONBOARDING_STEPS,
  ONBOARDING_COPY,
  type OnboardingIconKey,
} from "@bedtime-quests/core/onboarding";
import { completeOnboarding } from "@/lib/onboarding-actions";
import { markOnboardingDoneLocally } from "@/lib/onboarding-local";

// The first-time parent tutorial (issue #73), rendered as a lightweight, on-brand
// Paper Cut dialog. No tour library: it is a handful of cards the parent steps
// through or skips. Content and gating live in @bedtime-quests/core so web and
// native share the exact same words.
//
// Accessibility: it is a labelled modal dialog that moves focus in on open,
// closes on Escape, returns focus to the trigger on close, and announces each
// step for screen readers. Skip and Close are always reachable, so focus is never
// stranded. Every control is a chunky, clearly clickable button with a pointer
// cursor and a visible focus ring (UI rules 2 and 3), and no copy uses dashes
// (UI rule 1).

function StepIcon({ icon }: { icon: OnboardingIconKey }) {
  const common = { viewBox: "0 0 24 24", fill: "none", className: "h-8 w-8", "aria-hidden": true } as const;
  switch (icon) {
    case "welcome":
      return (
        <svg {...common}>
          <path d="M12 3.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L12 16.77l-5.2 2.73.99-5.78-4.21-4.1 5.82-.85z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      );
    case "child":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
          <path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "library":
      return (
        <svg {...common}>
          <path d="M5 4h9a2 2 0 0 1 2 2v14l-4-2.2L8 20V4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M16 6h3v13l-3-1.6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "reading":
      return (
        <svg {...common}>
          <path d="M12 6c-2.5-1.2-5-1.2-8 0v12c3-1.2 5.5-1.2 8 0m0-12c2.5-1.2 5-1.2 8 0v12c-3-1.2-5.5-1.2-8 0m0-12v12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      );
    case "choices":
      return (
        <svg {...common}>
          <path d="M12 4v6m0 0l-5 4v6m5-10l5 4v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="4" r="1.6" fill="currentColor" />
        </svg>
      );
    case "help":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M9.5 9.2a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2-2.4 3.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="17" r="1.1" fill="currentColor" />
        </svg>
      );
  }
}

export function ParentOnboarding({
  onDone,
  returnFocus,
}: {
  /** Called after completion is recorded (finish or skip). */
  onDone: () => void;
  /** Restore focus to the trigger when the dialog closes (the re-open case). */
  returnFocus?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const total = ONBOARDING_STEPS.length;
  const step = ONBOARDING_STEPS[index];
  const isLast = index === total - 1;
  const isFirst = index === 0;

  // Move focus into the dialog on open so keyboard and screen reader users land
  // inside the tour, and restore it to the trigger when the dialog goes away.
  useEffect(() => {
    dialogRef.current?.focus();
    return () => {
      returnFocus?.();
    };
    // Intentionally run once on mount / unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    // Secondary, per-device fallback first (synchronous, never fails), then the
    // authoritative per-account write. The server action is best effort: the
    // local flag already keeps the tour from reappearing on this device.
    markOnboardingDoneLocally();
    void completeOnboarding();
    onDone();
  }

  // Escape skips the tour, matching the app's other dialogs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[rgba(22,40,58,0.55)]" onClick={finish} aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-body"
        tabIndex={-1}
        className="relative flex w-full max-w-md flex-col gap-5 rounded-3xl border border-[var(--pc-line)] bg-white p-5 shadow-[0_24px_48px_-20px_rgba(22,40,58,0.6)] outline-none sm:p-6"
      >
        {/* Eyebrow + progress + close */}
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[var(--accent)] px-3 py-1 font-display text-xs font-extrabold uppercase tracking-wide text-[var(--pc-plum-ink)]">
            {ONBOARDING_COPY.eyebrow}
          </span>
          <span className="text-sm font-bold text-[var(--pc-ink)]" aria-live="polite">
            {ONBOARDING_COPY.progressLabel(index + 1, total)}
          </span>
          <button
            type="button"
            onClick={finish}
            aria-label={ONBOARDING_COPY.close}
            className="ml-auto grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-[var(--pc-line)] bg-white text-[var(--pc-ink)] shadow-[0_3px_0_var(--pc-line)] outline-none transition-transform hover:bg-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--pc-line)]"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Card body */}
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            className="grid h-16 w-16 place-items-center rounded-3xl text-white shadow-[0_10px_22px_-10px_rgba(22,40,58,0.6)]"
            style={{ background: "var(--pc-plum)" }}
            aria-hidden="true"
          >
            <StepIcon icon={step.icon} />
          </span>
          <h2
            id="onboarding-title"
            className="font-display text-2xl font-extrabold tracking-tight text-[var(--pc-ink)] sm:text-3xl"
          >
            {step.title}
          </h2>
          <div id="onboarding-body" className="flex flex-col gap-2">
            {step.body.map((p, i) => (
              <p key={i} className="text-base font-semibold text-[var(--pc-ink)]">
                {p}
              </p>
            ))}
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
          {ONBOARDING_STEPS.map((s, i) => (
            <span
              key={s.id}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-[var(--pc-plum)]" : "w-2 bg-[var(--pc-line)]"
              }`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                className="min-h-[48px] flex-1 cursor-pointer rounded-2xl border border-[var(--pc-line)] bg-white px-4 py-3 font-display text-base font-bold text-[var(--pc-ink)] outline-none shadow-[0_4px_0_var(--pc-line)] transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--pc-line)]"
              >
                {ONBOARDING_COPY.back}
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? finish() : setIndex((i) => Math.min(total - 1, i + 1)))}
              className="min-h-[48px] flex-1 cursor-pointer rounded-2xl px-4 py-3 font-display text-base font-extrabold text-white outline-none shadow-[0_5px_0_var(--pc-plum-ink)] transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 active:shadow-[0_2px_0_var(--pc-plum-ink)]"
              style={{ background: "var(--pc-plum)" }}
            >
              {isLast ? ONBOARDING_COPY.finish : ONBOARDING_COPY.next}
            </button>
          </div>
          {!isLast && (
            <button
              type="button"
              onClick={finish}
              className="min-h-[44px] cursor-pointer rounded-2xl px-4 py-2 text-sm font-bold text-[var(--pc-plum-ink)] underline-offset-4 outline-none transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              {ONBOARDING_COPY.skip}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
