"use client"; // Error boundaries must be Client Components

// app/admin/error.tsx
// In-shell error boundary for the admin studio (issue #11).
import { useEffect } from "react";
import Link from "next/link";
import {
  StatusScreen,
  actionPrimaryClass,
  actionSecondaryClass,
} from "@/components/feedback/status-screen";
import { captureError } from "@/lib/reporting";

export default function AdminError({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}) {
  useEffect(() => {
    console.error(error);
    captureError(error);
  }, [error]);

  return (
    <StatusScreen
      emoji="🛠️"
      title="Something went wrong in the studio"
      description="A hiccup stopped this page from loading. You can try again or head back to your stories."
    >
      <button
        type="button"
        onClick={() => (unstable_retry ?? reset)?.()}
        className={actionSecondaryClass}
      >
        Try again
      </button>
      <Link href="/admin" className={actionPrimaryClass}>
        Back to stories
      </Link>
    </StatusScreen>
  );
}
