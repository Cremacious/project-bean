import type { Metadata, Viewport } from "next";
import "./globals.css";
import { baloo, nunito, atkinson, dyslexic } from "./fonts";
import { BRAND } from "@/lib/brand";
import { SITE_URL } from "@/lib/site-url";
import { ParentalGateProvider } from "@/components/parental-gate/parental-gate-provider";
import { AnalyticsScripts } from "@/components/analytics/analytics-scripts";
import { SignupBeacon } from "@/components/analytics/signup-beacon";
import { ConsentProvider } from "@/components/consent/consent-provider";
import { ConsentBanner } from "@/components/consent/consent-banner";
import { ConsentManager } from "@/components/consent/consent-manager";

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

// WebSite structured data (JSON-LD) so search engines can render a richer result
// for the brand. Kept minimal and reusing the same copy as the tags above; no
// dashes in any human-facing value (app-wide UI rule 1). It is a data block
// (type application/ld+json is not executable), so it is exempt from the script
// nonce CSP set in proxy.ts. The logo points at a real static asset in public.
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: BRAND.fullName,
  alternateName: BRAND.name,
  url: SITE_URL,
  description: DESCRIPTION,
  inLanguage: "en-US",
  publisher: {
    "@type": "Organization",
    name: BRAND.name,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/icon-rounded-512.png`,
  },
};

export const metadata: Metadata = {
  // Lets relative OpenGraph/canonical/sitemap URLs resolve to the production
  // origin (the custom domain from issue #43). SITE_URL is env driven, so it is
  // never a hardcoded or localhost value in Production. See lib/site-url.ts.
  metadataBase: new URL(SITE_URL),
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
    // summary_large_image because we ship a 1200x630 card (app/twitter-image.tsx).
    card: "summary_large_image",
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
    <html lang="en" className={`${baloo.variable} ${nunito.variable} ${atkinson.variable} ${dyslexic.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        {/* One shared consent state (issue #50) wraps the app: analytics and ads
            gate on it, the banner and preferences dialog read and write it. */}
        <ConsentProvider>
          <ParentalGateProvider>{children}</ParentalGateProvider>
          <SignupBeacon />
          <AnalyticsScripts />
          <ConsentBanner />
          <ConsentManager />
        </ConsentProvider>
      </body>
    </html>
  );
}
