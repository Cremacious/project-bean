// components/ads/house-ad.tsx
//
// The default "house" ad render path (issue #37): our OWN promotion for Bedtime
// Quests Premium. No third party, no ad SDK, no identifiers, no data leaves the
// app, so it carries zero COPPA exposure and needs no consent. It is the safe
// default the ad slot serves until (and unless) a kid-safe paid network is wired.
//
// This is purely presentational. Whether it renders at all is decided upstream by
// the server AdSlot gate, which shows ads to free-tier parents only.
import Link from "next/link";
import type { AdPlacement } from "@/lib/ads";

// Placement-specific lead line. Copy is dash-free (UI rule 1).
const LEAD: Record<AdPlacement, string> = {
  library: "Loving story time?",
  collection: "Want more adventures?",
};

export function HouseAd({ placement }: { placement: AdPlacement }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl text-2xl"
          style={{ background: "var(--pc-sun)" }}
          aria-hidden="true"
        >
          🌟
        </span>
        <div>
          <p className="font-display text-base font-extrabold text-[var(--pc-ink)]">
            {LEAD[placement]} Unlock every bedtime quest
          </p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--pc-ink)]">
            Bedtime Quests Premium opens the whole library, with fresh stories every month.
          </p>
        </div>
      </div>

      {/*
        Our own navigational control, so it is meant to look clickable (UI rule 2):
        chunky Paper Cut affordance, pointer cursor, focus ring. It routes to the
        plan picker, which self-gates (redirects entitled parents away) and runs the
        parental gate before any purchase, so a child can never tap through to a charge.
      */}
      <Link
        href="/subscribe"
        className="inline-flex min-h-[44px] flex-none cursor-pointer items-center justify-center rounded-2xl border-2 border-[var(--pc-plum-ink)] bg-[var(--pc-plum)] px-4 py-2 text-sm font-bold text-white shadow-[0_4px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--pc-plum-ink)] active:translate-y-0.5"
      >
        See Premium
      </Link>
    </div>
  );
}
