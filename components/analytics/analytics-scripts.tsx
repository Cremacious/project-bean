// components/analytics/analytics-scripts.tsx
"use client";

// Loads Google Analytics 4 in CHILD-DIRECTED / restricted mode (issue #38), or
// nothing at all. Rendered once from the root layout.
//
// Compliance posture (docs/COMPLIANCE-COPPA.md section 6b): when GA loads, it is
// configured so it does NOT enable advertising features, ad personalization, or
// Google Signals, and IP is anonymized. No personal data is ever sent here (the
// track() helper in lib/analytics.ts sanitizes every event); GA is only the
// transport for the fixed, non-personal event taxonomy.
//
// This component renders NOTHING when analytics is disabled (no measurement id or
// the kill switch is off), so local dev, CI, and any environment without a GA id
// load no analytics code and make no analytics network calls.
//
// Consent (issue #50, planned): where a region requires opt-in consent, we do not
// load until the consent banner grants it. The banner will control this;
// requireConsent === true means "hold until #50 says go". Where consent is not
// required, we load immediately in the strictly non-personal config below.
import Script from "next/script";
import { getAnalyticsConfig } from "@/lib/analytics";

export function AnalyticsScripts() {
  const { enabled, measurementId, requireConsent } = getAnalyticsConfig();

  // Off entirely: nothing rendered, nothing loaded, no network calls.
  if (!enabled || !measurementId) return null;

  // Region requires consent: hold until the consent banner (#50) grants it.
  if (requireConsent) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          // Deny every advertising signal by default; keep only anonymous
          // analytics storage. This is the child-directed baseline.
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'granted'
          });
          gtag('config', '${measurementId}', {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false
          });
        `}
      </Script>
    </>
  );
}
