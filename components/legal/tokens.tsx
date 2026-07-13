// components/legal/tokens.tsx
// Two tiny building blocks for the legal + support pages (issue #49). They keep
// still unfilled values from the source drafts visible and clearly marked, and
// they render as normal high contrast copy the moment a real value is supplied
// in lib/legal.ts (so there is nothing to un-style later).
import { isPlaceholder } from "@/lib/legal";

/**
 * A value that may still be a [BRACKET] placeholder. While unfilled it renders
 * as a highlighted badge (sun fill, ink text: high contrast, obviously "fill
 * me"); once the value in lib/legal.ts is a real string it renders as plain
 * copy.
 */
export function Ph({ children }: { children: string }) {
  if (!isPlaceholder(children)) return <>{children}</>;
  return (
    <mark className="rounded bg-[var(--pc-sun)] px-1 py-0.5 font-bold text-[var(--pc-ink)]">
      {children}
    </mark>
  );
}

/**
 * A support/contact email that may still be a placeholder. Real addresses become
 * a mailto link; an unfilled [SUPPORT EMAIL] token stays a badge (never a broken
 * mailto:[SUPPORT EMAIL] link).
 */
export function Email({ address }: { address: string }) {
  if (isPlaceholder(address)) return <Ph>{address}</Ph>;
  return <a href={`mailto:${address}`}>{address}</a>;
}
