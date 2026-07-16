import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

// Web app manifest (issue #47) so Bedtime Quests is installable ("add to home
// screen") with the right name, colors, and brand icons. Next serves this at
// /manifest.webmanifest and automatically injects the <link rel="manifest"> tag
// into the document head, so nothing is added by hand there (the Metadata API
// owns the head; theme-color lives in the `viewport` export in app/layout.tsx).
//
// Scope is installability metadata ONLY: no service worker or offline caching
// here. Native offline is handled later in M6.
//
// Colors stay consistent with the rest of the app's chrome:
//   - theme_color matches the viewport themeColor in app/layout.tsx (#6C5CE7,
//     the plum used by the navbar/footer and browser chrome).
//   - background_color matches the app's --background token in globals.css
//     (#BCCAE2, the Dusk Blue canvas) so the launch splash blends into the page.
// Both are literal Paper Cut brand values, kept in sync with #46's metadata.
//
// Icons reuse the existing generated brand assets in public/brand/*; only the
// 192 "any" size was genuinely missing and is emitted by scripts/gen-icons.ts
// (do not hand-edit generated icons). The full-bleed, no-alpha google-play-512
// fills a maskable safe area cleanly, so it serves the "maskable" purpose.
//
// No dashes in any displayed text (name/short_name/description), per UI rule 1.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.name,
    description: `${BRAND.subtitle}. ${BRAND.slogan}`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#BCCAE2",
    theme_color: "#6C5CE7",
    icons: [
      {
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-rounded-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/google-play-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
