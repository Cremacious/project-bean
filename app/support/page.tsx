// app/support/page.tsx
// Public, indexable Help / FAQ and contact page (issues #49 and #72). It answers
// the common parent questions (content shared with the native app via
// packages/core faq.ts, so the two never drift) and gives a clear, working way to
// reach us: the support email plus a contact form that emails our inbox through
// lib/email (a safe no-op when no inbox is configured yet).
//
// Public route: allowlisted in proxy.ts and listed in lib/seo.ts so crawlers reach
// and index it. The support email comes from lib/legal.ts and shows as a
// placeholder badge until filled.
import type { Metadata } from "next";
import Link from "next/link";
import { FAQ_SECTIONS } from "@bedtime-quests/core/faq";
import { LegalChrome } from "@/components/legal/legal-chrome";
import { Email } from "@/components/legal/tokens";
import { FaqAccordion } from "@/components/support/faq-accordion";
import { ContactForm } from "@/components/support/contact-form";
import { LEGAL, isPlaceholder } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Help and Support",
  description:
    "Help and answers for Bedtime Quests. Learn how personalization, reading modes, subscriptions, and privacy work, and reach our team for support.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  const emailReady = !isPlaceholder(LEGAL.supportEmail);

  return (
    <LegalChrome>
      <article>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--pc-ink)] sm:text-4xl">
          Help and Support
        </h1>
        <p className="mt-3 max-w-2xl text-base font-medium text-[var(--pc-ink)]">
          Find answers to the questions parents ask us most, from how your child&apos;s
          name is used to managing a subscription. Cannot find what you need? Reach our
          team below.
        </p>

        {/* On this page: quick jumps to each section and to contact. Visibly
            clickable per UI rule 2. */}
        <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-2.5">
          {FAQ_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="cursor-pointer rounded-full border-2 border-[var(--pc-line)] bg-white px-4 py-2 text-sm font-bold text-[var(--pc-ink)] shadow-[0_3px_0_var(--pc-line)] outline-none transition-transform hover:translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
            >
              {section.title}
            </a>
          ))}
          <a
            href="#contact"
            className="cursor-pointer rounded-full border-2 border-[var(--pc-plum-ink)] bg-[var(--pc-plum)] px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_var(--pc-plum-ink)] outline-none transition-transform hover:translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
          >
            Contact us
          </a>
        </nav>

        {/* The shared FAQ, rendered as accessible accordions. */}
        <div className="mt-10">
          <FaqAccordion />
        </div>

        {/* Contact. Anchor id lets the native app deep link straight here. */}
        <section id="contact" aria-labelledby="contact-heading" className="mt-12">
          <h2
            id="contact-heading"
            className="font-display text-2xl font-extrabold tracking-tight text-[var(--pc-ink)]"
          >
            Contact us
          </h2>
          <p className="mt-1 text-sm font-semibold text-[var(--pc-sub)]">
            We are a small team and we read every message.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* Email + account guidance card */}
            <div className="legal-prose rounded-3xl border border-[var(--pc-line)] bg-white p-6 shadow-[0_5px_0_var(--pc-line)]">
              <h3>Email us</h3>
              <p>
                The best way to reach us is by email at <Email address={LEGAL.supportEmail} />.
                Tell us what is happening and, if it helps, the email on your account, and we
                will get back to you as soon as we can.
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

              <h3>Account and privacy</h3>
              <p>
                You can update your details, add or remove a child profile, and delete your
                account from inside the app once you are signed in. To read or delete your
                child&apos;s information, email us or see our{" "}
                <a href="/privacy">Privacy Policy</a>.
              </p>
            </div>

            {/* Contact form card */}
            <div className="rounded-3xl border border-[var(--pc-line)] bg-white p-6 shadow-[0_5px_0_var(--pc-line)]">
              <h3 className="font-display text-lg font-extrabold text-[var(--pc-ink)]">
                Send us a message
              </h3>
              <p className="mt-1 mb-4 text-sm font-medium text-[var(--pc-ink)]">
                Prefer a form? Write to us here and we will reply by email.
              </p>
              <ContactForm />
            </div>
          </div>
        </section>

        {/* Quick links, visibly clickable per UI rule 2. */}
        <nav className="mt-10 flex flex-wrap gap-3">
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
