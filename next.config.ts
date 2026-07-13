import type { NextConfig } from "next";

// Static security response headers (issue #44).
//
// These are constant, request-independent headers, so they live in `headers()`
// (the idiomatic Next place) rather than in `proxy.ts`. The per-request,
// nonce-based Content-Security-Policy is the one header that CANNOT be static,
// so it is set in `proxy.ts` instead. Together they cover the header set called
// for in issue #44.
//
// Applied to every route (`/(.*)`), including static assets, as defense in
// depth. All are safe to send in local dev over http: browsers ignore HSTS on
// insecure origins, and the rest are transport-agnostic.
const securityHeaders = [
  // Force HTTPS for two years, including subdomains. Only takes effect over
  // HTTPS (issue #43 set that up on Vercel); ignored on http://localhost. We do
  // NOT send `preload` by default: joining the browser preload list is a hard to
  // reverse commitment, so it is left as a deliberate opt-in (add `; preload`
  // and submit at hstspreload.org once the apex + all subdomains are HTTPS).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  // Stop browsers guessing (sniffing) a response's content type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send only the origin to other sites, the full path to our own. Keeps a
  // child's story URL from leaking to third parties in the Referer header.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Clickjacking backstop for legacy browsers. The modern equivalent is the
  // CSP `frame-ancestors 'none'` directive set in proxy.ts; both say the same
  // thing: this app is never embedded in a frame. Sign-in/ads use top-level
  // redirects and their own frames, never by framing us, so DENY is safe.
  { key: "X-Frame-Options", value: "DENY" },
  // Disable powerful features the app does not use. `()` means "deny for every
  // origin". We do not use the camera, microphone, or geolocation, do not take
  // payments on the web (RevenueCat is native-only, see lib/revenuecat.ts), and
  // opt out of the Topics advertising API entirely for a child-directed app.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // The shared core (@bedtime-quests/core) ships raw TypeScript from the
  // workspace rather than a prebuilt bundle. Turbopack transpiles workspace
  // packages automatically, but listing it here makes the web build resolve and
  // compile it explicitly under either bundler. See node_modules/next/dist/docs/
  // 01-app/03-api-reference/05-config/01-next-config-js/transpilePackages.md.
  transpilePackages: ["@bedtime-quests/core"],
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
