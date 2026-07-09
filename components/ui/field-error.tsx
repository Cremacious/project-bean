// components/ui/field-error.tsx
import type { ReactNode } from "react";

/**
 * Inline, high-contrast validation message for a single field.
 * Give it an `id` and point the field's `aria-describedby` at it so
 * screen readers announce the message with the field.
 */
export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="text-sm font-semibold text-[var(--pc-poppy-ink)]">
      {children}
    </p>
  );
}
