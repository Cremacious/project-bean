import type { Metadata, Viewport } from "next";
import "@fontsource/opendyslexic/400.css";
import "@fontsource/opendyslexic/700.css";
import "./globals.css";
import { baloo, nunito, atkinson } from "./fonts";
import { BRAND } from "@/lib/brand";

// One description string reused across the page title tag, OpenGraph, and
// Twitter so the message stays consistent. No dashes (app-wide UI rule).
const DESCRIPTION = `${BRAND.slogan} Interactive bedtime stories for kids, where every choice leads somewhere new.`;

export const metadata: Metadata = {
  // Lets relative OpenGraph/canonical URLs resolve to the production origin.
  metadataBase: new URL("https://bedtimequests.com"),
  applicationName: BRAND.name,
  title: {
    default: BRAND.fullName,
    template: `%s · ${BRAND.name}`,
  },
  description: DESCRIPTION,
  keywords: [
    "bedtime stories",
    "interactive stories",
    "kids stories",
    "children's books",
    "choose your own adventure",
    "read aloud",
  ],
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: BRAND.fullName,
    description: DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: BRAND.fullName,
    description: DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    title: BRAND.name,
    statusBarStyle: "default",
  },
  // favicon + apple-touch-icon come from app/icon.svg and app/apple-icon.tsx
  // (file-based metadata), so no `icons` field is needed here.
};

// theme-color must live in the viewport export (deprecated in `metadata` as of
// Next 14). Matches the plum navbar/footer so mobile browser chrome blends in.
export const viewport: Viewport = {
  themeColor: "#6C5CE7",
  // Draw under the notch / home indicator so our sticky header and footer can
  // fill behind them; the safe-area padding (see globals.css .pt-safe/.pb-safe/
  // .px-gutter) then keeps content clear of those cutouts (issue #14).
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${baloo.variable} ${nunito.variable} ${atkinson.variable}`}>
      <body>{children}</body>
    </html>
  );
}
