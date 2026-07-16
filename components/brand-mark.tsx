"use client";

// components/brand-mark.tsx
// The Bedtime Quests logo mark (variant A2f): an origami paper boat with a
// pennant flag, sailing a green "sea of stars" toward a crescent moon on a
// deep-navy night sky. Shared by the navbar, footer, and auth screens so the
// mark stays identical everywhere, and kept byte-identical with the generated
// icons: `app/icon.svg`, `app/apple-icon.png`, and `public/brand/*`. This is the
// canonical source; edit `FOREGROUND`/`WAVE` in `scripts/gen-icons.ts` and this
// component together, then rerun `npm run gen:icons`. Colors are literal hex
// (not CSS vars) so the component and the standalone icon assets render the same.
//
// This is a Client Component because the crescent mask and the wave clipPath
// need per-instance ids: the header and footer both render <BrandMark> on one
// page, and shared static ids would cross-wire the mask/clip between instances.
// `useId` gives each instance a stable, collision-free id.

import { useId } from "react";

const SIZES = { sm: 18, md: 28, lg: 40 } as const;

// `size` accepts a named step (sm/md/lg) or an exact pixel number for per-instance
// tuning (e.g. the footer uses a custom 36px). Named steps keep the common sizes
// consistent across the app; numbers cover the one-off placements.
export function BrandMark({ size = "md" }: { size?: keyof typeof SIZES | number }) {
  const px = typeof size === "number" ? size : SIZES[size];
  // Strip colons so the id is safe inside an SVG url(#...) reference.
  const uid = useId().replace(/:/g, "");
  const moonId = `mF-${uid}`;
  const tileId = `tileF-${uid}`;
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
      <clipPath id={tileId}>
        <rect width="100" height="100" rx="22" />
      </clipPath>
      {/* Crescent moon: a sun-yellow disc with a navy disc carved out via a mask. */}
      <mask id={moonId}>
        <rect width="100" height="100" fill="#FFFFFF" />
        <circle cx="72" cy="24" r="10.5" fill="#000000" />
      </mask>
      <circle cx="77" cy="24" r="12" fill="#FFC24B" mask={`url(#${moonId})`} />
      {/* A single cream star. */}
      <path d="M21 25 L24 32 L31 35 L24 38 L21 45 L18 38 L11 35 L18 32 Z" fill="#FFF1DC" />
      {/* Origami boat: cream mast, poppy sail, two cream folds, deep-poppy hull. */}
      <path d="M50 28 L50 62" stroke="#FFF1DC" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M50 28 L68 35 L50 42 Z" fill="#FF6B4A" />
      <path d="M50 42 L50 62 L30 62 Z" fill="#FFF1DC" />
      <path d="M50 42 L70 62 L50 62 Z" fill="#FFF1DC" />
      <path d="M22 62 L78 62 L67 78 L33 78 Z" fill="#E14A2B" />
      {/* The sea, clipped to the rounded tile so it follows the corners. */}
      <g clipPath={`url(#${tileId})`}>
        <path d="M0 76 Q25 70 50 73 Q75 76 100 71 L100 100 L0 100 Z" fill="#2FB98A" />
      </g>
    </svg>
  );
}
