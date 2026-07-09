// components/site-footer.tsx
import Link from "next/link";

// Minimal footer. Its job is to anchor the bottom of the min-h-dvh shell so the
// bottom edge of the screen is always UI, never a void. Kept to one low line.
export function SiteFooter({ variant = "app" }: { variant?: "app" | "admin" }) {
  return (
    <footer className="flex-none border-t border-[var(--pc-line)] bg-white">
      <div
        className={`mx-auto flex w-full ${
          variant === "admin" ? "max-w-4xl" : "max-w-5xl"
        } items-center justify-between gap-3 px-4 py-4 sm:px-6`}
      >
        <span className="flex items-center gap-2 font-display text-sm font-extrabold text-[var(--pc-ink)]">
          <span className="relative h-4 w-4 -rotate-6 rounded" style={{ background: "var(--pc-poppy)" }}>
            <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full" style={{ background: "var(--pc-sun)" }} />
          </span>
          Storytime
        </span>

        {variant === "admin" ? (
          <Link
            href="/"
            className="rounded-full px-2 py-1 text-sm font-bold text-[var(--pc-plum-ink)] underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            Back to the app
          </Link>
        ) : (
          <Link
            href="/family"
            className="rounded-full px-2 py-1 text-sm font-bold text-[var(--pc-plum-ink)] underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            Family
          </Link>
        )}
      </div>
    </footer>
  );
}
