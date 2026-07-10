// instrumentation.ts
//
// Server + edge crash reporting hooks for the App Router (issue #39), using
// Next 16's native instrumentation file (node_modules/next/dist/docs/01-app/
// 03-api-reference/03-file-conventions/instrumentation.md). We wire Sentry here
// manually rather than through withSentryConfig: on this Next version that keeps
// the build plugin out of the way, and error capture does not need source-map
// upload (release wiring is intentionally deferred, issue #39 req 5).
//
// Everything is gated on isReportingEnabled(): with no DSN (local dev / CI) or
// the kill switch off, register() initializes nothing and onRequestError no-ops,
// so the app runs clean with no reporting and no network calls.
import type { Instrumentation } from "next";
import { buildSentryOptions, getReportingConfig, isReportingEnabled } from "@/lib/reporting";

/** Runs once per server instance, before any request is handled. */
export async function register(): Promise<void> {
  if (!isReportingEnabled()) return;
  const Sentry = await import("@sentry/nextjs");
  // Same options for the Node and Edge runtimes: PII off, scrubbing on, no
  // tracing, no replay (see buildSentryOptions).
  Sentry.init(buildSentryOptions(getReportingConfig()) as Parameters<typeof Sentry.init>[0]);
}

/** Reports server-side errors (Server Components, Route Handlers, Actions). */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (!isReportingEnabled()) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request, context);
};
