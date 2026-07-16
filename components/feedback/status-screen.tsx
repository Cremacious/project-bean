// components/feedback/status-screen.tsx
// Shared, on-brand panel for whole-screen status pages: the custom 404 and the
// error boundaries (issue #11). Presentational and hook-free, so it renders in
// both Server Components (not-found) and Client Components (error boundaries).
//
// The action buttons/links are passed as children so each page supplies its own
// (a Link home, a "Try again" button, etc). The exported class strings keep
// those actions as the canonical chunky Paper Cut affordance: solid bottom edge,
// active press, focus ring, and a pointer cursor.
import { BrandMark } from "@/components/brand-mark";
import { BRAND } from "@/lib/brand";

export const actionPrimaryClass =
  "inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-2xl bg-[var(--pc-plum)] px-5 py-3 text-base font-bold text-white shadow-[0_4px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--pc-plum-ink)] sm:w-auto";

export const actionSecondaryClass =
  "inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-2xl border border-[var(--pc-line)] bg-white px-5 py-3 text-base font-bold text-[var(--pc-ink)] shadow-[0_4px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--pc-line)] sm:w-auto";

export function StatusScreen({
  standalone = false,
  emoji,
  title,
  description,
  children,
}: {
  /** When true, owns the full viewport + sky background (used outside the app
   *  shell). When false, fills the shell's flex-1 region instead. */
  standalone?: boolean;
  emoji: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  const panel = (
    <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-3xl border border-[var(--pc-line)] bg-white p-8 text-center shadow-[0_6px_0_var(--pc-line)] sm:p-10">
      <div className="flex items-center gap-2">
        <BrandMark size="md" />
        <span className="font-display text-[1.75rem] font-extrabold leading-none text-[var(--pc-ink)]">
          {BRAND.name}
        </span>
      </div>
      <span
        aria-hidden="true"
        className="grid h-20 w-20 place-items-center rounded-3xl bg-[var(--accent)] text-4xl"
      >
        {emoji}
      </span>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-[var(--pc-ink)] sm:text-3xl">
        {title}
      </h1>
      <p className="text-base font-semibold text-[var(--pc-sub)]">{description}</p>
      {children && (
        <div className="flex w-full flex-col items-center gap-3 pt-1 sm:flex-row sm:justify-center">
          {children}
        </div>
      )}
    </div>
  );

  if (standalone) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[var(--pc-sky)] px-4 py-10 text-[var(--pc-ink)]">
        {panel}
      </main>
    );
  }
  return <div className="flex flex-1 flex-col items-center justify-center py-10">{panel}</div>;
}
