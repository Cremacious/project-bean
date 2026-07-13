// components/legal/legal-page.tsx
// Shared layout for a single long-form legal document (Privacy, Terms). Renders
// the title, the visible Effective / Last updated dates (issue #49 requirement),
// and a Paper Cut card whose body uses the .legal-prose typography from
// globals.css. The document body is passed as children as semantic HTML
// (<h2>/<p>/<ul>), which .legal-prose styles for readable, high contrast
// long-form reading (UI rule 3).
import { Ph } from "@/components/legal/tokens";

export function LegalPage({
  title,
  effectiveDate,
  lastUpdated,
  children,
}: {
  title: string;
  effectiveDate: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <article>
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--pc-ink)] sm:text-4xl">
        {title}
      </h1>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold text-[var(--pc-ink)]">
        <span>
          Effective date: <Ph>{effectiveDate}</Ph>
        </span>
        <span>
          Last updated: <Ph>{lastUpdated}</Ph>
        </span>
      </div>

      <div className="legal-prose mt-6 rounded-3xl border border-[var(--pc-line)] bg-white p-6 shadow-[0_5px_0_var(--pc-line)] sm:p-8">
        {children}
      </div>
    </article>
  );
}
