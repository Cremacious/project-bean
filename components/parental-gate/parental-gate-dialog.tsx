"use client";

// components/parental-gate/parental-gate-dialog.tsx
// The on screen parental gate (issue #32). It shows three numbers spelled out as
// words and asks a grown up to type the digits. Rendered by ParentalGateProvider
// while a protected action (sign up, purchase) is waiting on it.
//
// Accessibility: it is a labelled modal dialog. The numbers live inside the
// field's own <label>, so a screen reader announces "Enter these numbers, four,
// seven, two" when the field is focused. Escape and a Go back button both
// cancel, focus starts in the field and is trapped inside the panel, and the
// previously focused element is restored on close. Copy has no dashes and stays
// high contrast (app-wide UI rules).

import { useEffect, useId, useRef, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import {
  generateGateChallenge,
  checkGateAnswer,
  type GateChallenge,
} from "@/lib/parental-gate";

export function ParentalGateDialog({
  onPass,
  onCancel,
}: {
  /** Called once the grown up enters the numbers correctly. */
  onPass: () => void;
  /** Called when the grown up backs out (button, Escape, or backdrop). */
  onCancel: () => void;
}) {
  const titleId = useId();
  const descId = useId();
  const inputId = useId();
  const errorId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [challenge, setChallenge] = useState<GateChallenge>(() =>
    generateGateChallenge(),
  );
  const [value, setValue] = useState("");
  const [showError, setShowError] = useState(false);

  // Focus the field on open and restore focus to the trigger on close. Also lock
  // background scroll so the page behind the gate cannot be moved on mobile.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  // Escape cancels; Tab is kept inside the panel so focus cannot wander to the
  // page behind the gate.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
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
  }, [onCancel]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (checkGateAnswer(challenge, value)) {
      onPass();
      return;
    }
    // Wrong: show a gentle message and swap in a new set of numbers so the gate
    // cannot be beaten by repeating the same guess.
    setShowError(true);
    setChallenge(generateGateChallenge());
    setValue("");
    inputRef.current?.focus();
  }

  const spoken = challenge.words.join(", ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(22,40,58,0.55)] p-4"
      // A click on the dim backdrop (outside the panel) backs out.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-[0_20px_44px_-18px_rgba(22,40,58,0.5)] sm:p-8"
      >
        <div className="mb-5 flex flex-col items-center gap-2.5 text-center">
          <BrandMark size="lg" />
          <div>
            <h2
              id={titleId}
              className="font-display text-2xl font-extrabold tracking-tight text-[var(--pc-ink)]"
            >
              Grown ups only
            </h2>
            <p id={descId} className="mt-1 text-sm font-semibold text-[var(--pc-sub)]">
              A quick check that a grown up is here. If you are a kid, ask a grown up.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <label htmlFor={inputId} className="block text-center">
              <span className="block text-sm font-bold text-[var(--pc-ink)]">
                Enter these numbers
              </span>
              <span className="mt-1 block font-display text-2xl font-extrabold tracking-wide text-[var(--pc-plum-ink)]">
                {spoken}
              </span>
            </label>
            <input
              ref={inputRef}
              id={inputId}
              name="parental-gate-answer"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (showError) setShowError(false);
              }}
              aria-invalid={showError}
              aria-describedby={showError ? errorId : undefined}
              placeholder="like 472"
              className="h-12 w-full rounded-2xl border border-[var(--pc-line)] bg-white px-4 text-center text-lg font-bold tracking-widest text-[var(--pc-ink)] outline-none placeholder:font-semibold placeholder:tracking-normal placeholder:text-[var(--pc-sub)] focus-visible:border-[var(--pc-plum)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
            {showError && (
              <p
                id={errorId}
                role="alert"
                className="text-center text-sm font-semibold text-[var(--pc-poppy-ink)]"
              >
                That was not quite right. Here are new numbers to try.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full cursor-pointer rounded-2xl bg-[var(--pc-plum)] py-3 font-display font-bold text-white shadow-[0_5px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--pc-plum-ink)]"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full cursor-pointer rounded-2xl border border-[var(--pc-line)] bg-white py-3 font-display font-bold text-[var(--pc-ink)] outline-none transition-colors hover:bg-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            Go back
          </button>
        </form>
      </div>
    </div>
  );
}
