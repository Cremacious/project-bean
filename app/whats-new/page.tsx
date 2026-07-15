// app/whats-new/page.tsx
// Public, indexable "What's new" page (issue #74). It renders the shared changelog
// (packages/core changelog.ts, the same data the in-app panel shows, so the two
// never drift) as a readable, on-brand history of new stories and improvements.
//
// Public route: allowlisted in proxy.ts and listed in lib/seo.ts so crawlers reach
// and index it. A returning family (or a prospective one) can see the app is alive
// and growing without signing in.
import type { Metadata } from "next";
import Link from "next/link";
import { WHATS_NEW_COPY } from "@bedtime-quests/core/changelog";
import { LegalChrome } from "@/components/legal/legal-chrome";
import { ChangelogList } from "@/components/whats-new/changelog-list";

export const metadata: Metadata = {
  title: "What's new",
  description:
    "See what is new in Bedtime Quests: the latest interactive bedtime stories and the improvements we have added for families.",
  alternates: { canonical: "/whats-new" },
};

export default function WhatsNewPage() {
  return (
    <LegalChrome>
      <article>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--pc-ink)] sm:text-4xl">
          {WHATS_NEW_COPY.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base font-medium text-[var(--pc-ink)]">
          {WHATS_NEW_COPY.intro} We add new quests on a roughly monthly rhythm, so
          there is always something fresh for bedtime.
        </p>

        <div className="mt-8">
          <ChangelogList />
        </div>

        {/* Quick links, visibly clickable per UI rule 2. */}
        <nav className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/support"
            className="cursor-pointer rounded-2xl border-2 border-[var(--pc-line)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--pc-ink)] shadow-[0_4px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
          >
            Help and Support
          </Link>
          <Link
            href="/"
            className="cursor-pointer rounded-2xl border-2 border-[var(--pc-line)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--pc-ink)] shadow-[0_4px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
          >
            Back to Bedtime Quests
          </Link>
        </nav>
      </article>
    </LegalChrome>
  );
}
