import { buildAppleAppSiteAssociation } from "@/lib/deep-links";

// Served at /.well-known/apple-app-site-association (issue #65).
//
// iOS' Universal Links verifier fetches this exact path over HTTPS to confirm the
// app may open bedtimequests.com URLs. Requirements it enforces, all handled here:
//   - NO file extension on the path (this route segment has none) and
//   - Content-Type application/json, and
//   - the raw JSON body (no redirect, no auth wall). `proxy.ts` allowlists
//     `/.well-known` so the auth gate does not 302 the verifier to /sign-in, and
//     the file is plain JSON so the CSP (#44) is irrelevant to the OS fetch.
//
// A Route Handler (not a static file in public/) is used deliberately: it lets us
// set the exact Content-Type on an extensionless resource and build the appID from
// env, per the current Next idiom for `.well-known` endpoints (see
// node_modules/next/dist/docs/01-app/02-guides/backend-for-frontend.md).
//
// `force-static` + a short cache: the document only changes when the Team ID env
// changes, which requires a redeploy anyway, so it is safe (and fast) to cache.
export const dynamic = "force-static";

export function GET() {
  const body = JSON.stringify(buildAppleAppSiteAssociation());
  return new Response(body, {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=3600",
    },
  });
}
