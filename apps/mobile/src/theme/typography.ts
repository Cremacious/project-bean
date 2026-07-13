// apps/mobile/src/theme/typography.ts
//
// Typography tokens for the native app.
//
// The web app uses Baloo 2 (display) and Nunito Sans (body), plus three reading
// fonts (Nunito "rounded", Atkinson Hyperlegible, OpenDyslexic). This build is
// intentionally dependency-light and ships NO font binaries, so it maps those
// roles onto the platform system font with weight and spacing that echo the
// brand: heavy, rounded-feeling display type and a highly legible body. Every
// role still exists as a token, so screens never hardcode a family.
//
// SEAM — real font loading (deferred): to ship the exact brand fonts later, add
// `expo-font` (already available) + `@expo-google-fonts/baloo-2`,
// `@expo-google-fonts/nunito-sans`, `@expo-google-fonts/atkinson-hyperlegible`,
// and an OpenDyslexic .otf asset, load them with `useFonts` at the top of
// App.tsx, and swap the `fontFamily` values below for the loaded family names.
// The `readingFontFamily()` switch is the single place the reader picks a family.
import type { ReadingFontId } from "@bedtime-quests/core/reading-prefs";

// `undefined` fontFamily resolves to the platform system font (San Francisco on
// iOS, Roboto on Android), which is what we want as the neutral base today.
const SYSTEM: undefined = undefined;

export const type = {
  // Display / headings: system font at its heaviest weight, faux Baloo warmth.
  display: { fontFamily: SYSTEM, fontWeight: "800" as const },
  displayBold: { fontFamily: SYSTEM, fontWeight: "700" as const },
  // Body copy.
  body: { fontFamily: SYSTEM, fontWeight: "600" as const },
  bodyRegular: { fontFamily: SYSTEM, fontWeight: "500" as const },
} as const;

// Type sizes used across the app.
export const size = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  huge: 34,
} as const;

/**
 * The font family for a chosen reading font. All three map to the system font
 * today (see SEAM above); the toggle still drives real state and persistence so
 * wiring the true families in later is a one-line change per case.
 */
export function readingFontFamily(_id: ReadingFontId): string | undefined {
  return SYSTEM;
}
