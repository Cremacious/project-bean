// components/analytics/analytics-scripts.tsx
"use client";

// Loads Google Analytics 4 in CHILD-DIRECTED / restricted mode (issue #38), or
// nothing at all. Rendered once from the root layout, inside ConsentProvider.
//
// Compliance posture (docs/COMPLIANCE-COPPA.md section 6b): when GA loads, it is
// configured so it does NOT enable advertising features, ad personalization, or
// Google Signals, and IP is anonymized. No personal data is ever sent here (the
// track() helper in lib/analytics.ts sanitizes every event); GA is only the
// transport for the fixed, non-personal event taxonomy.
//
// Consent gate (issue #50): GA does not load, set a cookie, or make any network
// call until the parent grants the ANALYTICS category through the consent banner.
// We read that grant from the ONE shared consent state (useConsent), so this is
// the same signal ads read and the same choice the footer link can withdraw. On
// withdrawal the provider clears GA's cookies and denies its consent signal.
//
// This component renders NOTHING when analytics is disabled (no measurement id or
// the kill switch is off) or when analytics consent has not been granted, so local
// dev, CI, and any not-yet-consented visitor load no analytics code and make no
// analytics network calls.
import Script from "next/script";
import { getAnalyticsConfig } from "@/lib/analytics";
import { useConsent } from "@/components/consent/consent-provider";
import { isCategoryGranted } from "@bedtime-quests/core/consent";

export function AnalyticsScripts() {
  const { state, ready } = useConsent();
  const { enabled, measurementId } = getAnalyticsConfig();

  // Off entirely: nothing rendered, nothing loaded, no network calls.
  if (!enabled || !measurementId) return null;

  // Hold until the client has read the recorded choice and the parent has granted
  // analytics. Until then GA never mounts, so no gtag script and no _ga cookie.
  if (!ready || !isCategoryGranted(state, "analytics")) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="lazyOnload"
      />
      <Script id="ga-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          // The parent granted analytics; grant only anonymous analytics storage
          // and keep every advertising signal denied. This is the child-directed
          // baseline (ad_* stay denied regardless of the advertising category,
          // because ads here are contextual and never use GA's ad signals).
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
