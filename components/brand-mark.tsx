// components/brand-mark.tsx
// The Bedtime Quests logo mark: a paper boat sailing a sea of stars toward a
// crescent moon (quest + choice + bedtime). Shared by the navbar, footer, and
// auth screens so the mark stays identical everywhere, and kept byte-identical
// with the app icons: `app/icon.svg` (SVG favicon), `app/apple-icon.png`, and
// `public/brand/*` (store assets). Regenerate all of them together from
// `public/brand/icon-square.svg`. Colors are literal hex (not CSS vars) so the
// component and the standalone icon assets render the same everywhere.

const SIZES = { sm: 18, md: 28, lg: 40 } as const;

export function BrandMark({ size = "md" }: { size?: keyof typeof SIZES }) {
  const px = SIZES[size];
  return (
    <svg
      aria-hidden
      width={px}
      height={px}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-none"
    >
      <rect width="100" height="100" rx="22" fill="#16283A" />
      {/* Crescent moon: a cream disc with a navy disc carved out of it. */}
      <circle cx="73" cy="27" r="13" fill="#FFF1DC" />
      <circle cx="79" cy="23" r="10.5" fill="#16283A" />
      {/* Night sky. */}
      <circle cx="24" cy="25" r="2" fill="#FFC24B" />
      <circle cx="49" cy="18" r="1.4" fill="#FFF1DC" />
      <circle cx="33" cy="45" r="1.3" fill="#FFC24B" />
      <circle cx="88" cy="55" r="1.6" fill="#2FB98A" />
      {/* Paper boat hull. */}
      <path d="M27 61 L73 61 L64 74 L36 74 Z" fill="#FFF1DC" />
      {/* Sea of stars. */}
      <path
        d="M8 78 Q24 72 40 78 T72 78 T96 78"
        fill="none"
        stroke="#2FB98A"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <circle cx="22" cy="82" r="1.4" fill="#FFC24B" />
      <circle cx="80" cy="82" r="1.4" fill="#FFF1DC" />
      {/* Sail, mast fold, and the adventurer's flag. */}
      <path d="M40 61 L51 46 L61 61 Z" fill="#FFF1DC" />
      <path d="M51 46 L51 61" stroke="#E14A2B" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <rect x="50.1" y="38.5" width="1.8" height="9" rx="0.9" fill="#FFF1DC" />
      <path d="M51.9 39 L60 42 L51.9 45 Z" fill="#FF6B4A" />
    </svg>
  );
}
