// app/fonts.ts
import { Baloo_2, Nunito_Sans, Atkinson_Hyperlegible } from "next/font/google";
import localFont from "next/font/local";

// App-wide fonts. Baloo (display/headings) and Nunito (body + the default
// "rounded" reading font) are used on every screen, so they stay preloaded.
export const baloo = Baloo_2({
  subsets: ["latin"], weight: ["600", "700", "800"],
  variable: "--font-baloo", display: "swap",
});
export const nunito = Nunito_Sans({
  subsets: ["latin"], weight: ["400", "600", "700"],
  variable: "--font-nunito", display: "swap",
});

// Reading fonts (issue #48). These only ever style story prose, and only when a
// reader has actively chosen them in the story reader. So `preload: false`: their
// @font-face rules still ship, but the browser downloads the woff2 only when an
// element actually uses the family (i.e. inside the reader), never blocking first
// paint on the home, library, sign-in, or paywall screens.
// See node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md
// (`preload`).
export const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"], weight: ["400", "700"],
  variable: "--font-atkinson", display: "swap", preload: false,
});

// OpenDyslexic is not on Google Fonts, so it is self-hosted via next/font/local
// (the woff2 live in app/fonts/, copied from the @fontsource package which is
// still used by lib/og-image.tsx). next/font gives it a size-adjusted fallback so
// swapping it in inside the reader causes no layout shift. Also `preload: false`
// for the same reason as Atkinson; the file is ~115KB per weight and must never
// sit on the critical path of a page that is not the reader.
export const dyslexic = localFont({
  src: [
    { path: "./fonts/OpenDyslexic-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/OpenDyslexic-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-dyslexic", display: "swap", preload: false, fallback: ["sans-serif"],
});
