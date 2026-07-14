// components/site-footer.tsx
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { BrandMark } from "@/components/brand-mark";
import { CookieSettingsLink } from "@/components/consent/cookie-settings-link";

// Always-present footer. Two jobs: (1) anchor the bottom of the min-h-dvh shell
// so the screen edge is always UI, never a void; (2) carry the brand + slogan
// and the legal/support links (issue #49). The Privacy, Terms, and Support links
// are public pages, so they show on every variant; a variant-specific link
// (Family in the app, Back to the app in admin) follows. The "public" variant is
// used by the legal/support page chrome, where a Family link would only bounce a
// signed out visitor to /sign-in, so it adds no extra link.
export function SiteFooter({
  variant = "app",
}: {
  variant?: "app" | "admin" | "public";
}) {
  const linkClass =
    "cursor-pointer rounded-full px-1 py-0.5 text-sm font-bold text-white underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-white";

  return (
    <footer className="pb-safe flex-none border-t border-[var(--pc-plum-ink)] bg-[var(--pc-plum)]">
      <div
        className={`px-gutter mx-auto flex w-full ${
          variant === "admin" ? "max-w-4xl" : "max-w-5xl"
        } flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between`}
      >
        <div className="flex items-center gap-2.5">
          <BrandMark size="sm" />
          <div className="leading-tight">
            <p className="font-display text-sm font-extrabold text-white">
              {BRAND.name}
            </p>
            <p className="text-xs font-semibold text-white">{BRAND.slogan}</p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/privacy" className={linkClass}>
            Privacy
          </Link>
          <Link href="/terms" className={linkClass}>
            Terms
          </Link>
          <Link href="/support" className={linkClass}>
            Support
          </Link>
          <Link href="/press" className={linkClass}>
            Press
          </Link>
          {/* Reopens the consent preferences so a parent can change or withdraw
              their choice at any time, from any page (issue #50). */}
          <CookieSettingsLink className={linkClass} />
          {variant === "admin" ? (
            <Link href="/" className={linkClass}>
              Back to the app
            </Link>
          ) : variant === "app" ? (
            <Link href="/family" className={linkClass}>
              Family
            </Link>
          ) : null}
        </nav>
      </div>
    </footer>
  );
}
