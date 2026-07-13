// app/support/page.tsx
// Public, indexable Support / contact page (issue #49). Deliberately lightweight;
// the fuller Help / FAQ is a later issue (#72). Public route: allowlisted in
// proxy.ts and listed in lib/seo.ts so crawlers reach and index it. The support
// email comes from lib/legal.ts and shows as a placeholder badge until filled.
import type { Metadata } from "next";
import Link from "next/link";
import { LegalChrome } from "@/components/legal/legal-chrome";
import { Email } from "@/components/legal/tokens";
import { LEGAL, isPlaceholder } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with Bedtime Quests. Reach our team, manage your account and subscription, and find our Privacy Policy and Terms.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  const emailReady = !isPlaceholder(LEGAL.supportEmail);

  return (
    <LegalChrome>
      <article>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--pc-ink)] sm:text-4xl">
          Support
        </h1>
        <p className="mt-3 max-w-2xl text-base font-medium text-[var(--pc-ink)]">
          We are happy to help. Whether you have a question about your account, a
          subscription, or your family&apos;s privacy, here is how to reach us.
        </p>

        {/* Contact card */}
        <div className="legal-prose mt-6 rounded-3xl border border-[var(--pc-line)] bg-white p-6 shadow-[0_5px_0_var(--pc-line)] sm:p-8">
          <h2>Email us</h2>
          <p>
            The best way to reach us is by email at{" "}
            <Email address={LEGAL.supportEmail} />. Tell us what is happening and,
            if it helps, the email address on your account, and we will get back
            to you as soon as we can.
          </p>
          {emailReady && (
            <p>
              <a
                href={`mailto:${LEGAL.supportEmail}`}
                className="inline-flex min-h-[48px] items-center rounded-2xl border-2 border-[var(--pc-plum-ink)] bg-[var(--pc-plum)] px-5 py-3 font-display text-base font-bold !text-white !no-underline shadow-[0_5px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
              >
                Email support
              </a>
            </p>
          )}

          <h2>Manage your account</h2>
          <p>
            You can update your details, add or remove a child profile, and delete
            your account from inside the app once you are signed in. Deleting your
            account also removes your child&apos;s first name and story progress.
          </p>

          <h2>Subscriptions and billing</h2>
          <p>
            Subscriptions are handled through your app store account. To change or
            cancel a plan, or to ask about a refund, use your Apple or Google
            account settings. See our <a href="/terms">Terms of Service</a> for how
            billing, renewals, and cancellation work.
          </p>

          <h2>Privacy and your child&apos;s data</h2>
          <p>
            To review or delete your child&apos;s information, or to ask a privacy
            question, email us or read our <a href="/privacy">Privacy Policy</a>.
            We built Bedtime Quests to collect as little about your child as
            possible.
          </p>
        </div>

        {/* Quick links, visibly clickable per UI rule 2 */}
        <nav className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/privacy"
            className="cursor-pointer rounded-2xl border-2 border-[var(--pc-line)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--pc-ink)] shadow-[0_4px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="cursor-pointer rounded-2xl border-2 border-[var(--pc-line)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--pc-ink)] shadow-[0_4px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
          >
            Terms of Service
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
