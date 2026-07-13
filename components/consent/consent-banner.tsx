"use client";

// components/consent/consent-banner.tsx
//
// The first-visit consent banner (issue #50). Shown once, until the parent makes
// any choice. Deliberately NOT a modal: it is a polite bottom region that never
// traps focus and never blocks the page, so a parent can ignore it and still read
// stories (optional categories simply stay OFF). Reading is never gated on it.
//
// It offers the three required actions with equal prominence, so rejecting is as
// easy as accepting (no dark pattern): "Accept all", "Reject optional", and
// "Choose settings" (opens the preferences dialog). Copy is dash-free and high
// contrast; buttons are chunky Paper Cut controls with a pointer cursor and a
// visible focus ring (app-wide UI rules).

import Link from "next/link";
import { useConsent } from "./consent-provider";

export function ConsentBanner() {
  const { needsDecision, acceptAll, rejectOptional, openManager } = useConsent();

  if (!needsDecision) return null;

  return (
    <div
      role="region"
      aria-label="Cookie choices"
      className="pb-safe px-gutter fixed inset-x-0 bottom-0 z-40 border-t border-[var(--pc-line)] bg-white shadow-[0_-8px_24px_-12px_rgba(22,40,58,0.35)]"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="max-w-2xl">
          <p className="font-display text-base font-extrabold text-[var(--pc-ink)]">
            A quick note about cookies
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--pc-ink)]">
            We use cookies that keep you signed in and secure. With your okay we
            also use analytics to improve the app and cookies for ads that keep the
            free plan running. These stay off until you choose. Read our{" "}
            <Link
              href="/privacy"
              className="font-bold text-[var(--pc-plum-ink)] underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap lg:flex-nowrap">
          <button
            type="button"
            onClick={openManager}
            className="order-3 cursor-pointer rounded-2xl border-2 border-[var(--pc-line)] bg-white px-5 py-2.5 font-display font-bold text-[var(--pc-ink)] outline-none transition-colors hover:bg-[var(--pc-sky)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] sm:order-1"
          >
            Choose settings
          </button>
          <button
            type="button"
            onClick={rejectOptional}
            className="order-2 cursor-pointer rounded-2xl border-2 border-[var(--pc-ink)] bg-white px-5 py-2.5 font-display font-bold text-[var(--pc-ink)] shadow-[0_5px_0_var(--pc-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--pc-ink)]"
          >
            Reject optional
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="order-1 cursor-pointer rounded-2xl border-2 border-[var(--pc-leaf-ink)] bg-[var(--pc-leaf)] px-5 py-2.5 font-display font-bold text-white shadow-[0_5px_0_var(--pc-leaf-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--pc-leaf-ink)] sm:order-3"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
