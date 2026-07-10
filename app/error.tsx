"use client"; // Error boundaries must be Client Components

// app/error.tsx
// Root error boundary (issue #11). Catches uncaught errors that escape the app
// and admin shells (including their layouts). Renders standalone with a friendly
// message, a retry, and a way home.
import { useEffect } from "react";
import Link from "next/link";
import {
  StatusScreen,
  actionPrimaryClass,
  actionSecondaryClass,
} from "@/components/feedback/status-screen";
import { captureError } from "@/lib/reporting";

export default function RootError({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  // reset is the long-standing prop; unstable_retry (Next 16.2+) re-fetches the
  // segment as well. Prefer retry, fall back to reset.
  reset?: () => void;
  unstable_retry?: () => void;
}) {
  useEffect(() => {
    console.error(error);
    // Report to crash reporting (no-ops when disabled). Errors caught by a Next
    // error boundary never reach the global handler, so we capture explicitly.
    captureError(error);
  }, [error]);

  return (
    <StatusScreen
      standalone
      emoji="🌙"
      title="Something went a little sideways"
      description="A hiccup stopped this page from loading. You can try again or head back to the stories."
    >
      <button
        type="button"
        onClick={() => (unstable_retry ?? reset)?.()}
        className={actionSecondaryClass}
      >
        Try again
      </button>
      <Link href="/" className={actionPrimaryClass}>
        Back to the stories
      </Link>
    </StatusScreen>
  );
}
