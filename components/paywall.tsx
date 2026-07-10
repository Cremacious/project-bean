"use client";

// components/paywall.tsx
// Shown in place of a premium story when a non-subscriber tries to read it (#34).
// The reader route decides this on the SERVER and renders this instead of the
// story, so locked content is never sent to the browser. The subscribe call to
// action passes through the parental gate (#32) before routing to the plan and
// checkout entry point that #35 fills in.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useParentalGate } from "@/components/parental-gate/parental-gate-provider";
import { track } from "@/lib/analytics";

export function Paywall({ storyTitle, storySlug }: { storyTitle?: string; storySlug?: string }) {
  const requireAdult = useParentalGate();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  // Record that the paywall was shown. Non-personal: the story slug only, never
  // who saw it. Fires once per mount (per locked story view).
  useEffect(() => {
    track("paywall_shown", storySlug ? { story: storySlug } : undefined);
  }, [storySlug]);

  async function startSubscribe() {
    setChecking(true);
    try {
      const ok = await requireAdult("purchase"); // grown up check before any purchase flow
      if (!ok) return; // backed out of the gate
      // Non-personal: the parent chose to begin subscribing from a locked story.
      track("subscribe_started", { from: "paywall", ...(storySlug ? { story: storySlug } : {}) });
      router.push("/subscribe");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center py-8 text-center">
      <div className="w-full rounded-3xl border border-[var(--pc-line)] bg-white p-6 shadow-[0_5px_0_var(--pc-line)] sm:p-8">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
          style={{ background: "var(--accent)" }}
          aria-hidden="true"
        >
          🌟
        </div>

        <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-[var(--pc-ink)] sm:text-3xl">
          Unlock the whole library
        </h1>

        <p className="mt-3 text-base font-medium text-[var(--pc-ink)]">
          {storyTitle ? (
            <>
              <span className="font-bold">{storyTitle}</span> is part of Bedtime Quests Premium. Start a free
              trial to read it and every other bedtime adventure.
            </>
          ) : (
            <>This story is part of Bedtime Quests Premium. Start a free trial to read it and every other bedtime adventure.</>
          )}
        </p>

        <ul className="mt-5 space-y-2 text-left">
          {[
            "Every story, ready for tonight and every night",
            "Fresh quests added every month",
            "Cancel anytime, no fuss",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2.5 text-sm font-semibold text-[var(--pc-ink)]">
              <span className="mt-0.5 text-[var(--pc-leaf-ink)]" aria-hidden="true">
                ✓
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={startSubscribe}
          disabled={checking}
          className="mt-6 flex min-h-[52px] w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-[var(--pc-poppy-ink)] bg-[var(--pc-poppy)] px-5 py-3 text-base font-bold text-white shadow-[0_5px_0_var(--pc-poppy-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--pc-poppy-ink)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {checking ? "One moment…" : "Start your free trial"}
        </button>

        <p className="mt-3 text-xs font-semibold text-[var(--pc-sub)]">
          A grown up confirms this step. Plans and pricing are shown before anything is charged.
        </p>
      </div>

      <Link
        href="/"
        className="mt-5 inline-flex min-h-[44px] cursor-pointer items-center rounded-full px-4 py-2 text-sm font-bold text-[var(--pc-plum-ink)] underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        Back to the free stories
      </Link>
    </div>
  );
}
