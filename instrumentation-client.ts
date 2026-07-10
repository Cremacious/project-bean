// instrumentation-client.ts
//
// Client-side crash reporting for the App Router (issue #39), using Next 16's
// native client instrumentation file (node_modules/next/dist/docs/01-app/
// 03-api-reference/03-file-conventions/instrumentation-client.md). Runs before
// React hydration, so it captures early errors too.
//
// The config is resolved from NEXT_PUBLIC_ env vars, which Next inlines at build
// time. That makes `config.enabled` a build-time constant: a build without a DSN
// (local dev / CI) tree-shakes the Sentry import away entirely, so nothing loads
// and no reporting network calls are made. The kill switch works the same way.
import { buildSentryOptions, getReportingConfig } from "@/lib/reporting";

const config = getReportingConfig();

if (config.enabled) {
  void import("@sentry/nextjs").then((Sentry) => {
    // sendDefaultPii OFF, beforeSend scrubbing ON, no tracing, no Session Replay
    // (replay would record the child's personalized story text on screen).
    Sentry.init(buildSentryOptions(config) as Parameters<typeof Sentry.init>[0]);
  });
}

/** Adds Sentry navigation context so client errors group by route. No-ops when disabled. */
export async function onRouterTransitionStart(
  url: string,
  navigationType: "push" | "replace" | "traverse",
): Promise<void> {
  if (!config.enabled) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRouterTransitionStart(url, navigationType);
}
