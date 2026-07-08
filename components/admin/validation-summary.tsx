// components/admin/validation-summary.tsx

/** Presentational: lists validateStory() errors as a Paper Cut warning card. Renders nothing when empty. */
export function ValidationSummary({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--pc-poppy-ink)] bg-[#FDECEC] px-4 py-3 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      <p className="font-display text-sm font-extrabold text-[var(--pc-poppy-ink)]">Fix these before publishing</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-[var(--pc-ink)]">
        {errors.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
    </div>
  );
}
