// components/auth/auth-shell.tsx
//
// Shared chrome for the sign in and sign up pages, matching the public homepage
// (app/welcome). It is a two panel split: a plum brand panel (the paper boat
// mark, the name, the slogan, and a supporting line, all centered) beside a calm
// sky-canvas column that holds the form. On phones the panel collapses to a
// compact topper and the form sits below it.
//
// The panel content is identical on both pages; each page supplies only its own
// heading, subheading, and form body via props/children, so all form logic stays
// in the page. Colors come from the Paper Cut --pc-* tokens, every clickable
// element keeps a pointer cursor and a focus ring, and all text is high contrast
// (app-wide UI rules 1 to 3).

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { BrandMark } from "@/components/brand-mark";

export function AuthShell({
  heading,
  subheading,
  children,
}: {
  heading: string;
  subheading: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh lg:grid lg:grid-cols-2">
      {/* Brand panel: the plum night sky. */}
      <aside className="pt-safe px-gutter relative overflow-hidden bg-[var(--pc-plum)] py-12 lg:flex lg:min-h-dvh lg:flex-col lg:justify-center lg:px-14 lg:py-16">
        {/* Back to the public homepage. */}
        <Link
          href="/welcome"
          className="relative z-10 mx-auto inline-flex w-fit items-center gap-1.5 rounded-full text-sm font-bold text-[var(--pc-cream)] underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-white lg:absolute lg:left-14 lg:top-12 lg:mx-0"
        >
          <span aria-hidden>{"←"}</span> Back to home
        </Link>

        {/* Brand lockup + slogan, centered. */}
        <div className="relative z-10 mx-auto mt-8 max-w-md text-center lg:mt-0">
          <div className="flex items-center justify-center gap-3">
            <BrandMark size={52} />
            <span className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {BRAND.name}
            </span>
          </div>
          <p className="mt-6 font-display text-3xl font-extrabold leading-tight text-[var(--pc-sun)] sm:text-4xl">
            {BRAND.slogan}
          </p>
          <p className="mt-4 text-lg font-bold leading-relaxed text-[var(--pc-cream)]">
            A choose your own adventure bedtime story you read aloud together, starring your child by name.
          </p>
        </div>
      </aside>

      {/* Form column: the calm sky canvas. */}
      <section className="px-gutter flex items-center justify-center bg-[var(--pc-sky)] py-12 lg:py-16">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center lg:text-left">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--pc-ink)]">
              {heading}
            </h1>
            <p className="mt-1.5 text-base font-bold text-[var(--pc-sub)]">{subheading}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}

// Shared class for the primary submit button on both auth pages: a chunky, sun
// yellow Paper Cut button that echoes the homepage's main call to action (the one
// a parent taps to arrive here). Dark ink text on sun yellow clears WCAG AA.
export const authSubmitClass =
  "w-full cursor-pointer rounded-xl bg-[var(--pc-sun)] py-3 font-display text-base font-extrabold text-[#3A2D00] shadow-[0_5px_0_var(--pc-sun-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60";
