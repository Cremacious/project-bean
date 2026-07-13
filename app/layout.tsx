import type { Metadata, Viewport } from "next";
import "@fontsource/opendyslexic/400.css";
import "@fontsource/opendyslexic/700.css";
import "./globals.css";
import { baloo, nunito, atkinson } from "./fonts";
import { BRAND } from "@/lib/brand";
import { ParentalGateProvider } from "@/components/parental-gate/parental-gate-provider";
import { AnalyticsScripts } from "@/components/analytics/analytics-scripts";
import { SignupBeacon } from "@/components/analytics/signup-beacon";

// Force dynamic rendering app-wide so the per-request CSP nonce set in proxy.ts
// is injected into every page's framework and app scripts (issue #44). A
// nonce-based CSP REQUIRES dynamic rendering: a statically prerendered page has
// no request-time nonce, so under an enforced policy its own scripts would be
// blocked. This app is almost entirely personalized and auth-gated (already
// dynamic); only the sign-in / sign-up / forgot-password / 404 pages were static,
// and rendering those per request is a negligible cost here (auth pages are not
// meant to be CDN-cached anyway). Static assets and JS/CSS chunks are unaffected
// and still cached. See node_modules/next/dist/docs/01-app/02-guides/
// content-security-policy.md ("all pages must be dynamically rendered").
export const dynamic = "force-dynamic";

// One description string reused across the page title tag, OpenGraph, and
// Twitter so the message stays consistent. No dashes (app-wide UI rule).
const DESCRIPTION = `${BRAND.slogan} Interactive bedtime stories for kids, where every choice leads somewhere new.`;

// Canonical origin for OpenGraph/canonical URL resolution. Driven by the same
// env var as the auth client (lib/auth-client.ts) so every absolute URL agrees
// with the origin the browser is actually on. In Production this is the custom
// domain (https://bedtimequests.com); the localhost fallback is dev-only and is
// never used on Vercel, where NEXT_PUBLIC_APP_URL is always set.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  // Lets relative OpenGraph/canonical URLs resolve to the production origin.
  metadataBase: new URL(APP_URL),
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
      <body>
        <ParentalGateProvider>{children}</ParentalGateProvider>
        <SignupBeacon />
        <AnalyticsScripts />
      </body>
    </html>
  );
}
