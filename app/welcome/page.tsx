// app/welcome/page.tsx
//
// The public marketing landing page (issue #68). It explains Bedtime Quests to
// PARENTS and captures launch waitlist signups. It is the acquisition front door:
// signed out visitors to the site root are routed here by proxy.ts, and a signed
// in parent who lands here is sent straight into the app.
//
// Reuses the real product name, subtitle, and slogan from lib/brand.ts and the
// benefit messaging from the store listing (docs/marketing/app-store-copy.md), so
// positioning stays consistent everywhere. All copy is dash free (UI rule 1),
// every clickable element looks clickable with a pointer cursor (UI rule 2), and
// all text is high contrast (UI rule 3). Mobile first and responsive.
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { BrandMark } from "@/components/brand-mark";
import { SiteFooter } from "@/components/site-footer";
import { getParent } from "@/lib/session";
import { WaitlistForm } from "./waitlist-form";

const DESCRIPTION =
  "Interactive bedtime stories for kids. Read aloud together, let your child choose the path, and see their first name woven into every tale. Join the launch list.";

export const metadata: Metadata = {
  // Absolute so this acquisition page keeps a clean, keyword rich title rather
  // than the "%s · Bedtime Quests" template used by in app pages.
  title: { absolute: BRAND.fullName },
  description: DESCRIPTION,
  alternates: { canonical: "/welcome" },
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: BRAND.fullName,
    description: DESCRIPTION,
    url: "/welcome",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.fullName,
    description: DESCRIPTION,
  },
};

const STEPS: ReadonlyArray<{ n: string; title: string; body: string }> = [
  { n: "1", title: "Pick a quest", body: "Choose a story for tonight from a growing library made for winding down." },
  { n: "2", title: "Read the scene aloud", body: "Short, cozy scenes made to be read together at bedtime." },
  { n: "3", title: "Let your child choose", body: "Your little one picks what happens next and taps to see where it leads." },
  { n: "4", title: "Find the happy endings", body: "Discover every gentle ending together and celebrate each one." },
];

const BENEFITS: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: "Starring your child",
    body: "Their first name is woven into every story, so they are the hero of every tale.",
  },
  {
    title: "Safe and COPPA friendly",
    body: "First name only. No chat, no third party ads, and no tracking of your child. Just stories.",
  },
  {
    title: "Reads your way",
    body: "Four text sizes and reading fonts, including a dyslexia friendly option, with a read to me mode and an I can read mode.",
  },
  {
    title: "They choose the path",
    body: "Every choice leads somewhere new, so each quest can be enjoyed again and again.",
  },
  {
    title: "Gentle by design",
    body: "Calm, cozy art and soft, happy endings, made to help little ones drift off.",
  },
  {
    title: "New quests every month",
    body: "The library keeps growing, with fresh stories added every month.",
  },
];

const primaryCta =
  "inline-flex cursor-pointer items-center justify-center rounded-xl bg-[var(--pc-sun)] px-6 py-3 font-display text-base font-extrabold text-[var(--pc-ink)] shadow-[0_5px_0_var(--pc-sun-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-white active:translate-y-0.5";

const secondaryCta =
  "inline-flex cursor-pointer items-center justify-center rounded-xl border-2 border-white/80 bg-transparent px-6 py-3 font-display text-base font-extrabold text-white outline-none transition-transform hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white active:translate-y-0.5";

export default async function WelcomePage() {
  // A signed in parent has no use for the marketing page: route them into the app,
  // exactly as the rest of the app does today.
  const parent = await getParent();
  if (parent) redirect("/");

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--pc-sky)] text-[var(--pc-ink)]">
      {/* Public header: brand on the left, sign in + get started on the right. */}
      <header className="pt-safe px-gutter">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-2.5">
            <BrandMark size="md" />
            <span className="font-display text-lg font-extrabold tracking-tight text-[var(--pc-ink)]">
              {BRAND.name}
            </span>
          </div>
          <nav className="flex items-center gap-2.5 sm:gap-4">
            <Link
              href="/sign-in"
              className="cursor-pointer rounded-full px-2 py-1 text-sm font-bold text-[var(--pc-ink)] underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-[var(--pc-plum)] px-4 py-2 text-sm font-bold text-white shadow-[0_4px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero: a deep navy night sky, echoing the brand mark. */}
        <section className="px-gutter">
          <div className="mx-auto w-full max-w-5xl">
            <div className="relative overflow-hidden rounded-3xl bg-[#16283A] px-6 py-14 text-center sm:px-12 sm:py-20">
              <div className="mx-auto flex max-w-2xl flex-col items-center">
                <BrandMark size="lg" />
                <p className="mt-5 text-sm font-bold uppercase tracking-wide text-[var(--pc-sun)]">
                  {BRAND.subtitle}
                </p>
                <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
                  {BRAND.slogan}
                </h1>
                <p className="mt-4 text-lg font-semibold leading-relaxed text-[#FFF1DC]">
                  Bedtime Quests turns story time into a ritual you build together. You read aloud, your little one chooses what happens next, and their name is woven right into the tale.
                </p>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                  <Link href="/sign-up" className={primaryCta}>
                    Create your free account
                  </Link>
                  <Link href="#waitlist" className={secondaryCta}>
                    Join the waitlist
                  </Link>
                </div>
                <p className="mt-5 text-sm font-semibold text-[#FFF1DC]">
                  Free to start. On the web now, with iOS and Android on the way.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works. */}
        <section className="px-gutter py-14 sm:py-20">
          <div className="mx-auto w-full max-w-5xl">
            <h2 className="text-center font-display text-3xl font-extrabold tracking-tight text-[var(--pc-ink)]">
              How it works
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-base font-semibold text-[var(--pc-sub)]">
              Four simple steps make bedtime a calm ritual you share side by side.
            </p>
            <ol className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step) => (
                <li
                  key={step.n}
                  className="rounded-2xl border-2 border-[var(--pc-line)] bg-white p-5 shadow-[0_5px_0_var(--pc-line)]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pc-plum)] font-display text-lg font-extrabold text-white">
                    {step.n}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-extrabold text-[var(--pc-ink)]">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm font-semibold leading-relaxed text-[var(--pc-sub)]">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Benefits. */}
        <section className="px-gutter pb-14 sm:pb-20">
          <div className="mx-auto w-full max-w-5xl">
            <h2 className="text-center font-display text-3xl font-extrabold tracking-tight text-[var(--pc-ink)]">
              Made for families, built for trust
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFITS.map((benefit) => (
                <div
                  key={benefit.title}
                  className="rounded-2xl border-2 border-[var(--pc-line)] bg-white p-5 shadow-[0_5px_0_var(--pc-line)]"
                >
                  <h3 className="font-display text-lg font-extrabold text-[var(--pc-ink)]">
                    {benefit.title}
                  </h3>
                  <p className="mt-1.5 text-sm font-semibold leading-relaxed text-[var(--pc-sub)]">
                    {benefit.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platforms note. */}
        <section className="px-gutter pb-14 sm:pb-20">
          <div className="mx-auto w-full max-w-3xl">
            <div className="rounded-2xl border-2 border-[var(--pc-leaf)] bg-white p-6 text-center shadow-[0_5px_0_var(--pc-leaf-ink)]">
              <p className="font-display text-lg font-extrabold text-[var(--pc-ink)]">
                Play on the web today
              </p>
              <p className="mt-1.5 text-sm font-semibold text-[var(--pc-sub)]">
                Bedtime Quests runs right in your browser now. Native apps for iOS and Android are on the way, and the waitlist is the first to know.
              </p>
            </div>
          </div>
        </section>

        {/* Waitlist capture. */}
        <section id="waitlist" className="px-gutter scroll-mt-6 pb-16 sm:pb-24">
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border-2 border-[var(--pc-line)] bg-[var(--pc-accent)] p-6 shadow-[0_20px_44px_-18px_rgba(22,40,58,0.4)] sm:p-8">
              <div className="mb-5 text-center">
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--pc-ink)]">
                  Be first through the door
                </h2>
                <p className="mt-2 text-sm font-semibold text-[var(--pc-sub)]">
                  Join the launch list and we will email you the moment new quests and the mobile apps are ready.
                </p>
              </div>
              <WaitlistForm />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter variant="public" />
    </div>
  );
}
