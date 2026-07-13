// proxy.ts
//
// Next 16 renamed the `middleware` file convention to `proxy` (the old name is
// deprecated and warns at build time). This file does two jobs on every page
// request:
//
//   1. Auth gating (unchanged from the previous middleware.ts): send signed-out
//      visitors to /sign-in for anything that is not explicitly public.
//   2. Content-Security-Policy (issue #44): generate a fresh per-request nonce
//      and emit a scoped CSP. See node_modules/next/dist/docs/01-app/02-guides/
//      content-security-policy.md for the nonce + proxy pattern this follows.
//
// ROLLOUT: the CSP ships in Report-Only mode by default, so it observes and
// reports violations without ever blocking a resource. Nothing (sign-in, ads,
// analytics, Sentry, RevenueCat, normal rendering) can break while it is
// report-only. Flip it to enforcing by setting CSP_MODE=enforce once a run
// across the real pages shows no unexpected violation reports.
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Publicly reachable paths that skip the auth gate below.
//
// Several of these (the SEO/metadata routes) have no image file extension, or a
// .xml/.txt one, so the matcher's extension exclusion does NOT catch them; they
// must be listed here or a signed out crawler would be redirected to /sign-in and
// never see them (issue #46):
//   - /apple-icon        the generated apple-touch-icon route (no extension).
//   - /opengraph-image,  the generated social share cards (no extension); the
//     /twitter-image      meta URLs carry a ?<hash> query, matched by startsWith.
//   - /sitemap.xml,       .xml/.txt are not excluded by the matcher, so the proxy
//     /robots.txt         runs on them; list them so crawlers can fetch them.
//   - /manifest.webmanifest  the web app manifest (issue #47): same as above, the
//     .webmanifest extension is not excluded by the matcher, so a signed out
//     visitor (exactly who installs the app) must be able to fetch it, or the
//     browser sees no manifest and the site is not installable.
const PUBLIC_PATHS = [
  "/sign-in",
  "/sign-up",
  // Legal + support pages (issue #49): public and indexable, so a signed out
  // visitor (or crawler) must reach them instead of being bounced to /sign-in.
  "/privacy",
  "/terms",
  "/support",
  // Deployment health probe (issue #51): the smoke suite and uptime monitors hit
  // this unauthenticated, so it must skip the auth gate like the auth routes do.
  "/api/health",
  "/api/auth",
  "/apple-icon",
  "/opengraph-image",
  "/twitter-image",
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.webmanifest",
];

const isDev = process.env.NODE_ENV === "development";

/**
 * Build the CSP header value for one request, embedding a fresh `nonce`.
 *
 * The allowlist is derived from the app's ACTUAL integrations, nothing more:
 *  - scripts: our own bundles (via the nonce + 'strict-dynamic', which lets a
 *    trusted script load the chunks it needs, e.g. the Sentry SDK's dynamic
 *    import); plus Google Analytics' gtag loader for browsers that predate
 *    'strict-dynamic' (issue #38, only ever loaded when a GA id is configured).
 *  - connect: Google Analytics collection endpoints and the Sentry ingest host
 *    (both env-gated; listing the domains here is harmless when they are unused,
 *    since CSP only ever blocks, never forces, a request).
 *  - frames: the Google and Apple sign-in origins, in case a provider uses an
 *    embedded frame in some flow; frame-ancestors 'none' still forbids anyone
 *    from framing US (clickjacking).
 *  - styles: 'unsafe-inline' is required because Tailwind/React emit inline
 *    style attributes that cannot carry a nonce. Style injection is far lower
 *    risk than script injection, which stays strictly nonce-gated.
 *
 * Listing a domain that a given environment never contacts (no GA id locally,
 * no Sentry DSN in CI) does not break anything, so the policy is a single static
 * allowlist rather than env-conditional strings.
 *
 * NOT YET INCLUDED (inert today, add when switched on):
 *  - A real ad network (SuperAwesome / Google Ad Manager, lib/ads.ts): only
 *    house ads render today. Enabling one needs its script/frame/img/connect
 *    domains added here.
 *  - RevenueCat web billing: no browser SDK loads today (webhook is server side,
 *    lib/revenuecat.ts); add its domains if/when web billing ships (M6).
 */
function buildCsp(nonce: string, enforce: boolean): string {
  const directives = [
    `default-src 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    // 'unsafe-eval' only in dev: React/Turbopack use eval for the dev overlay
    // and HMR. It is never emitted in production.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com https://*.google-analytics.com${
      isDev ? " 'unsafe-eval'" : ""
    }`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://www.googletagmanager.com https://*.google-analytics.com`,
    `font-src 'self'`,
    `connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://*.sentry.io`,
    `frame-src 'self' https://accounts.google.com https://appleid.apple.com`,
    `worker-src 'self' blob:`,
  ];
  // upgrade-insecure-requests only takes effect in an ENFORCING policy served over
  // HTTPS. Emitting it while the policy is Report-Only (the default rollout mode)
  // does nothing except make the browser log a console warning ("ignored when
  // delivered in a report-only policy"), which also trips Lighthouse's no-console-
  // errors Best Practices audit (issue #48). On http://localhost it would also try
  // to upgrade dev resources. So add it only when the policy is actually enforced
  // and we are not in dev.
  if (enforce && !isDev) directives.push(`upgrade-insecure-requests`);
  return directives.join("; ");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // One fresh nonce per request. Proxy runs on the Node.js runtime in Next 16,
  // so the Web Crypto `crypto` global is available.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const enforce = process.env.CSP_MODE === "enforce";
  const csp = buildCsp(nonce, enforce);

  // Response header name toggles enforce vs observe; the REQUEST header is always
  // the real `Content-Security-Policy` name because that is what Next parses to
  // extract the nonce and inject it into the framework/page scripts it renders.
  const responseCspHeader = enforce
    ? "Content-Security-Policy"
    : "Content-Security-Policy-Report-Only";

  // Auth gate (behaviour preserved exactly from the previous middleware.ts).
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (!isPublic && !getSessionCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    const redirect = NextResponse.redirect(url);
    redirect.headers.set(responseCspHeader, csp);
    return redirect;
  }

  // Expose the nonce to the renderer (Next reads the request CSP header), and set
  // the CSP on the outgoing response.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(responseCspHeader, csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
