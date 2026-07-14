// lib/deep-links.ts
//
// Builders for the two well-known association files that let a bedtimequests.com
// URL open the native app (issue #65): Apple's `apple-app-site-association` (iOS
// Universal Links) and Android's `assetlinks.json` (App Links / Digital Asset
// Links). They are served by the route handlers under `app/.well-known/**` and
// must be PUBLIC, so `proxy.ts` allowlists `/.well-known` (otherwise the auth gate
// would 302 the OS verifier to /sign-in and links would never verify).
//
// The set of paths that open the app comes from `@bedtime-quests/core`
// (`APP_LINK_PATHS`), the SAME source the native router uses, so the file that
// CLAIMS a URL and the code that ROUTES it can never drift.
//
// Identifiers vs secrets: the bundle id / package name are public and fixed
// (docs/STORE-ACCOUNTS.md #58). The Apple Team ID and the Android signing-cert
// SHA-256 come from the Apple/Play signing setup (#58/#59) and are NOT known until
// enrollment, so they are read from (non-secret) env vars with a clearly marked
// placeholder fallback. No secret is ever embedded and `.env.local` is never read
// here (these are plain public identifiers). See docs/DEEP-LINKS.md to fill them.
import { APP_LINK_PATHS } from "@bedtime-quests/core/deep-links";

/** iOS bundle identifier / Android package name, locked in #58 (app.json). */
export const IOS_BUNDLE_ID = "com.bedtimequests.app";
export const ANDROID_PACKAGE = "com.bedtimequests.app";

// Obvious, invalid-on-purpose placeholders so a not-yet-configured deploy serves
// syntactically valid JSON that simply will not verify (no security risk), and so
// the value screams "replace me" if anyone reads the live file before it is set.
const TEAM_ID_PLACEHOLDER = "TEAMID_REPLACE_AFTER_APPLE_ENROLLMENT";
const SHA256_PLACEHOLDER = "REPLACE_WITH_ANDROID_SHA256_CERT_FINGERPRINT";

/**
 * The 10-character Apple Team ID (developer.apple.com -> Membership), the same
 * value that goes into `eas.json` `appleTeamId`. Set `APPLE_TEAM_ID` in the Vercel
 * project env once enrollment (#58) is done; until then the placeholder is served.
 */
export function appleTeamId(): string {
  return process.env.APPLE_TEAM_ID?.trim() || TEAM_ID_PLACEHOLDER;
}

/**
 * The Android signing-cert SHA-256 fingerprint(s) (uppercase, colon-separated
 * hex). This comes from the key that SIGNS the installed app: with Play App
 * Signing that is the Play "app signing key" fingerprint (Play Console -> Setup ->
 * App integrity), and you typically ALSO list the EAS/upload key so internal-track
 * builds verify too (#59). Set `ANDROID_SHA256_CERT_FINGERPRINTS` (comma-separated
 * for more than one) in Vercel env; until then the placeholder is served.
 */
export function androidCertFingerprints(): string[] {
  const raw = process.env.ANDROID_SHA256_CERT_FINGERPRINTS?.trim();
  if (!raw) return [SHA256_PLACEHOLDER];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** True while either association file is still serving a placeholder identifier. */
export function hasPlaceholderCredentials(): boolean {
  return (
    appleTeamId() === TEAM_ID_PLACEHOLDER ||
    androidCertFingerprints().some((f) => f === SHA256_PLACEHOLDER)
  );
}

/**
 * The `apple-app-site-association` document. Uses the modern `appIDs` + `components`
 * form (iOS 13+) and ALSO emits the legacy `appID` + `paths` form for maximum
 * device compatibility; Apple ignores keys it does not use. `components` covers a
 * specific story (`/story/*`) and the collection screen only, so the marketing and
 * legal pages stay in Safari.
 */
export function buildAppleAppSiteAssociation() {
  const appID = `${appleTeamId()}.${IOS_BUNDLE_ID}`;
  const storyWildcard = `${APP_LINK_PATHS.story}*`; // "/story/*"
  const paths = [storyWildcard, APP_LINK_PATHS.collection];
  return {
    applinks: {
      apps: [],
      details: [
        {
          appID,
          appIDs: [appID],
          paths,
          components: paths.map((p) => ({ "/": p })),
        },
      ],
    },
  };
}

/**
 * The `assetlinks.json` document: grant the app the ability to handle all its App
 * Link URLs, keyed to the package name and the signing-cert fingerprint(s).
 */
export function buildAssetLinks() {
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: ANDROID_PACKAGE,
        sha256_cert_fingerprints: androidCertFingerprints(),
      },
    },
  ];
}
