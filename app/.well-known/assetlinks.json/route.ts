import { buildAssetLinks } from "@/lib/deep-links";

// Served at /.well-known/assetlinks.json (issue #65).
//
// Android's App Links verifier (Digital Asset Links) fetches this over HTTPS to
// confirm the app signed with the listed cert may auto-open bedtimequests.com
// URLs (`autoVerify` in app.json). It must be public JSON with no redirect, so
// `proxy.ts` allowlists `/.well-known`. Served via a Route Handler for an exact
// Content-Type and to build the fingerprint list from env; the `.json` segment
// keeps the path Google expects.
//
// `force-static` + a short cache: it only changes when the signing-cert env
// changes (a redeploy), so caching is safe.
export const dynamic = "force-static";

export function GET() {
  const body = JSON.stringify(buildAssetLinks());
  return new Response(body, {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=3600",
    },
  });
}
