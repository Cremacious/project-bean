// app/apple-icon.tsx
// Apple touch icon (home-screen / bookmark icon on iOS and Safari), rendered as
// a 180x180 PNG from the Bedtime Quests mark (direction B).
//
// PLACEHOLDER (issue #8): kept in sync with `components/brand-mark.tsx` and
// `app/icon.svg`. A static apple-icon must be a raster (.png/.jpg), so this
// generates one from the same vector art via `next/og`. To use a final asset,
// drop an `app/apple-icon.png` in and delete this file.
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <svg width="180" height="180" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="48" height="48" rx="12" fill="#6C5CE7" />
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
          <circle cx="23" cy="17" r="8.5" fill="#FFC24B" />
          <circle cx="27.5" cy="14" r="7.5" fill="#6C5CE7" />
          <path d="M24 31 C19 27.5 13 27.5 8.5 30 L8.5 40 C13 37.5 19 37.5 24 40.5 Z" fill="#EAF2FB" />
          <path d="M24 31 C29 27.5 35 27.5 39.5 30 L39.5 40 C35 37.5 29 37.5 24 40.5 Z" fill="#DCEAFB" />
          <rect x="23" y="30.5" width="2" height="10.5" rx="1" fill="#16283A" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
