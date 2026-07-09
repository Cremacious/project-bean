// components/ui/empty-state.tsx
// Friendly, on-brand empty state (issue #10). A Paper Cut card with a warm
// headline, a supportive line, and an optional chunky call to action. Used for
// the empty library, an empty collection, and a family with no readers yet.
//
// Copy passed in must follow the app-wide rules: no dashes, high contrast.
import Link from "next/link";

export function EmptyState({
  emoji,
  title,
  description,
  action,
  fill = true,
}: {
  emoji: string;
  title: string;
  description: string;
  action?: { href: string; label: string };
  /** When true, grows to center itself in the page's flex-1 region. When false,
   *  renders as an inline card (e.g. a section inside a longer page). */
  fill?: boolean;
}) {
  const card = (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-[var(--pc-line)] bg-white p-8 text-center shadow-[0_5px_0_var(--pc-line)]">
      <span
        aria-hidden="true"
        className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--accent)] text-3xl"
      >
        {emoji}
      </span>
      <h2 className="font-display text-xl font-extrabold text-[var(--pc-ink)]">{title}</h2>
      <p className="text-base font-semibold text-[var(--pc-sub)]">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-1 inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-2xl bg-[var(--pc-plum)] px-5 py-3 text-base font-bold text-white shadow-[0_4px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--pc-plum-ink)]"
        >
          {action.label}
        </Link>
      )}
    </div>
  );

  if (!fill) return card;
  return <div className="grid flex-1 place-items-center">{card}</div>;
}
