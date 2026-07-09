// components/brand-mark.tsx
// The Paper Cut brand chip: a tilted poppy square with a sun dot. Shared by the
// navbar, footer, and auth screens so the mark stays identical everywhere.
// (Issue #8 swaps this for the real logo asset; keeping it in one component
// means that change lands in a single place.)

const SIZES = {
  sm: { box: "h-4 w-4 rounded", dot: "right-0.5 top-0.5 h-1.5 w-1.5" },
  md: { box: "h-6 w-6 rounded-lg", dot: "right-1 top-1 h-2 w-2" },
  lg: { box: "h-9 w-9 rounded-xl", dot: "right-1.5 top-1.5 h-2.5 w-2.5" },
} as const;

export function BrandMark({ size = "md" }: { size?: keyof typeof SIZES }) {
  const s = SIZES[size];
  return (
    <span
      aria-hidden
      className={`relative -rotate-6 ${s.box}`}
      style={{ background: "var(--pc-poppy)" }}
    >
      <span
        className={`absolute rounded-full ${s.dot}`}
        style={{ background: "var(--pc-sun)" }}
      />
    </span>
  );
}
