"use client"; // Error boundaries must be Client Components

// app/(app)/error.tsx
// In-shell error boundary for the authenticated app (issue #11). Keeps the
// header and footer while showing a friendly message with a retry and a way
// back to the library.
import { useEffect } from "react";
import Link from "next/link";
import {
  StatusScreen,
  actionPrimaryClass,
  actionSecondaryClass,
} from "@/components/feedback/status-screen";

export default function AppError({
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
  }, [error]);

  return (
    <StatusScreen
      emoji="🌙"
      title="Something went a little sideways"
      description="A hiccup stopped this page from loading. You can try again or head back to the library."
    >
      <button
        type="button"
        onClick={() => (unstable_retry ?? reset)?.()}
        className={actionSecondaryClass}
      >
        Try again
      </button>
      <Link href="/" className={actionPrimaryClass}>
        Back to the library
      </Link>
    </StatusScreen>
  );
}
