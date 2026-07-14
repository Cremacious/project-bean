"use client";

import { useRef, useState } from "react";
import { ONBOARDING_COPY } from "@bedtime-quests/core/onboarding";
import { ParentOnboarding } from "@/components/onboarding/parent-onboarding";

// The re-open entry for the first-time tutorial (issue #73). Lives in account
// settings so a parent can replay the tour any time. Opening it always shows the
// tour (the auto-show gate does not apply to a deliberate re-open); closing it
// returns focus to this button for keyboard and screen reader users.

export function OnboardingReplay() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="space-y-3">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[48px] w-full cursor-pointer rounded-2xl px-5 py-3 font-display text-base font-extrabold text-white outline-none shadow-[0_5px_0_var(--pc-plum-ink)] transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 active:shadow-[0_2px_0_var(--pc-plum-ink)] sm:w-auto"
        style={{ background: "var(--pc-plum)" }}
      >
        {ONBOARDING_COPY.reopen}
      </button>
      <p className="text-sm font-semibold text-[var(--pc-sub)]">{ONBOARDING_COPY.reopenHint}</p>

      {open && (
        <ParentOnboarding
          onDone={() => setOpen(false)}
          returnFocus={() => buttonRef.current?.focus()}
        />
      )}
    </div>
  );
}
