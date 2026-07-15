// components/auth/password-feedback.tsx
import { passwordStrength, passwordsMatch } from "@bedtime-quests/core/validation";

// One colour per strength band. Bars use the bright token; the label uses the
// darker -ink token so the text stays high-contrast on white (WCAG AA).
const BAND: Record<number, { bar: string; text: string }> = {
  1: { bar: "var(--pc-poppy)", text: "var(--pc-poppy-ink)" },
  2: { bar: "var(--pc-sun)", text: "var(--pc-sun-ink)" },
  3: { bar: "var(--pc-leaf)", text: "var(--pc-leaf-ink)" },
  4: { bar: "var(--pc-leaf)", text: "var(--pc-leaf-ink)" },
};

/**
 * A four-segment strength meter with a warm label. Purely an indicator: it never
 * blocks submission. Renders nothing until the parent has typed something.
 */
export function PasswordStrengthMeter({ value, id }: { value: string; id?: string }) {
  if (!value) return null;
  const { score, label } = passwordStrength(value);
  const band = BAND[score];

  return (
    <div id={id} className="space-y-1" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((seg) => (
          <span
            key={seg}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{ background: seg <= score && band ? band.bar : "var(--pc-line)" }}
          />
        ))}
      </div>
      <p className="text-xs font-semibold" style={{ color: band ? band.text : "var(--pc-sub)" }}>
        Password strength: {label}
      </p>
    </div>
  );
}

/**
 * Live "passwords match" read-out for a confirm field. Shows a positive note when
 * they match and a gentle mismatch note once the confirm field has any text.
 */
export function PasswordMatch({
  password,
  confirm,
  id,
}: {
  password: string;
  confirm: string;
  id?: string;
}) {
  if (!confirm) return null;
  const matches = passwordsMatch(password, confirm);
  return (
    <p
      id={id}
      role="status"
      aria-live="polite"
      className="text-xs font-semibold"
      style={{ color: matches ? "var(--pc-leaf-ink)" : "var(--pc-poppy-ink)" }}
    >
      {matches ? "Passwords match." : "Passwords do not match yet."}
    </p>
  );
}
