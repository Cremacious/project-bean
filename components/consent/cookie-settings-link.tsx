"use client";

// components/consent/cookie-settings-link.tsx
//
// The persistent, always-reachable way to reopen consent (issue #50, requirement
// 4). Lives in the footer next to Privacy / Terms / Support, so a parent can
// change or fully withdraw their choice at any time, on any page. It just opens
// the shared preferences dialog; the dialog does the rest.
//
// Styled to match the other footer links exactly (same class), and it is a real
// button with a pointer cursor and a focus-visible ring (app-wide UI rule 2).

import { useConsent } from "./consent-provider";

export function CookieSettingsLink({ className }: { className?: string }) {
  const { openManager } = useConsent();
  return (
    <button type="button" onClick={openManager} className={className}>
      Cookie settings
    </button>
  );
}
