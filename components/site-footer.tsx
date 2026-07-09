// components/site-footer.tsx
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { BrandMark } from "@/components/brand-mark";

// Always-present footer. Two jobs: (1) anchor the bottom of the min-h-dvh shell
// so the screen edge is always UI, never a void; (2) carry the brand + slogan.
// The right-hand <nav> is the slot for legal/support links (Privacy, Terms,
// Support) once those pages exist.
export function SiteFooter({ variant = "app" }: { variant?: "app" | "admin" }) {
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

        <nav className="flex items-center gap-4">
          {/* Legal/support links (Privacy, Terms, Support) go here once those
              pages exist. */}
          {variant === "admin" ? (
            <Link href="/" className={linkClass}>
              Back to the app
            </Link>
          ) : (
            <Link href="/family" className={linkClass}>
              Family
            </Link>
          )}
        </nav>
      </div>
    </footer>
  );
}
