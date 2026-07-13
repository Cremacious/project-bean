// lib/legal.ts
// Single source of truth for the published legal + support pages (issue #49).
//
// The canonical, published prose lives in the page components (app/privacy,
// app/terms, app/support). The values that still need real, lawyer approved
// input live here as clearly marked [BRACKET] tokens so they render as visible
// "fill me" badges (see components/legal/tokens.tsx) and can be replaced in ONE
// place once counsel signs off.
//
// The source drafts are docs/legal/privacy-policy.md and
// docs/legal/terms-of-service.md; keep those in sync when this copy changes.
export const LEGAL = {
  /** The app's public web address. Established brand domain, not a legal unknown. */
  website: "bedtimequests.com",

  // --- Values still to be supplied before the pages are legally live ---
  // Every entry below is surfaced in the issue #49 summary. Replace the bracket
  // token with the real value; the badge styling disappears automatically once
  // the value is no longer wrapped in [brackets].
  companyName: "[COMPANY NAME]",
  companyAddress: "[COMPANY ADDRESS]",
  supportEmail: "[SUPPORT EMAIL]",
  effectiveDate: "[EFFECTIVE DATE]",
  lastUpdated: "[LAST UPDATED DATE]",
  governingLawRegion: "[GOVERNING LAW REGION]",
  courtsLocation: "[COURTS LOCATION]",
  adNetwork: "[AD NETWORK NAME]",
  analyticsProvider: "[ANALYTICS PROVIDER]",
} as const;

/** True while a value is still an unfilled [BRACKET] placeholder token. */
export function isPlaceholder(value: string): boolean {
  return /^\[.*\]$/.test(value.trim());
}
