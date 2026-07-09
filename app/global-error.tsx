"use client"; // Error boundaries must be Client Components

// app/global-error.tsx
// Last-resort boundary for errors thrown by the root layout itself (issue #11).
// It replaces the root layout, so it must render its own <html>/<body> and can
// not rely on the app's fonts or shell. Styles are inline so the page stays
// on brand even if stylesheets fail to load.
import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body style={{ margin: 0 }}>
        <title>Something went wrong</title>
        <main
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            padding: 24,
            textAlign: "center",
            background: "#EAF2FB",
            color: "#16283A",
            fontFamily:
              "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              maxWidth: 420,
              width: "100%",
              padding: 32,
              borderRadius: 24,
              border: "1px solid #D4E3F2",
              background: "#FFFFFF",
              boxShadow: "0 6px 0 #D4E3F2",
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 44 }}>
              🌙
            </span>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>Something went wrong</h1>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#5A7089" }}>
              An unexpected problem stopped the app from loading. Please try again.
            </p>
            <button
              type="button"
              onClick={() => (unstable_retry ?? reset)?.()}
              style={{
                cursor: "pointer",
                minHeight: 44,
                marginTop: 4,
                padding: "12px 20px",
                borderRadius: 16,
                border: "none",
                background: "#574BC0",
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: 700,
                boxShadow: "0 4px 0 #3f3690",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
