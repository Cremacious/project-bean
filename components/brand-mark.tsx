// components/brand-mark.tsx
// The Bedtime Quests logo mark (direction B): an open storybook beneath a
// crescent moon on a plum "night" chip. Shared by the navbar, footer, and auth
// screens so the mark stays identical everywhere.
//
// PLACEHOLDER (issue #8): the direction is final, but the art is meant to be
// swapped for the real logo. The same shapes also live in `app/icon.svg` (the
// SVG favicon) and `app/apple-icon.tsx` (the apple-touch-icon); keep those two
// in sync when the real art lands. Colors are literal hex (not CSS vars) so the
// component and the standalone icon assets render byte-identically.

const SIZES = { sm: 18, md: 28, lg: 40 } as const;

export function BrandMark({ size = "md" }: { size?: keyof typeof SIZES }) {
  const px = SIZES[size];
  return (
    <svg
      aria-hidden
      width={px}
      height={px}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-none"
    >
      <rect x="1" y="1" width="46" height="46" rx="13" fill="#6C5CE7" />
      <rect
        x="4.5"
        y="4.5"
        width="39"
        height="39"
        rx="10"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.28"
        strokeWidth="1.5"
      />
      {/* Crescent moon: a sun disc with a plum disc carved out of it. */}
      <circle cx="23" cy="17" r="8.5" fill="#FFC24B" />
      <circle cx="27.5" cy="14" r="7.5" fill="#6C5CE7" />
      {/* Open storybook: two facing pages meeting at an ink spine. */}
      <path d="M24 31 C19 27.5 13 27.5 8.5 30 L8.5 40 C13 37.5 19 37.5 24 40.5 Z" fill="#EAF2FB" />
      <path d="M24 31 C29 27.5 35 27.5 39.5 30 L39.5 40 C35 37.5 29 37.5 24 40.5 Z" fill="#DCEAFB" />
      <rect x="23" y="30.5" width="2" height="10.5" rx="1" fill="#16283A" />
    </svg>
  );
}
