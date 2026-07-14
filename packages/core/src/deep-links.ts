// packages/core/src/deep-links.ts
//
// The platform-agnostic model for deep and universal/app links (issue #65).
// Everything here is pure and framework-free (no React Native, no expo-linking,
// no I/O), so the URL-to-screen map is decided ONCE, unit-tested, and reused by
// both the native app (to route a tapped link into the existing navigation) and
// the web app (to build the Apple / Android association files from the same set
// of app-link paths). One source of truth, no drift between the config that
// claims a URL and the code that routes it.
//
// Two kinds of link resolve here:
//   1. Custom scheme (internal deep links): `bedtimequests://...`. For a custom
//      scheme the URL "authority" is really the first path segment, e.g.
//      `bedtimequests://story/starlight-sail` has host `story`, path `slug`.
//   2. Universal (iOS) / App (Android) links: `https://bedtimequests.com/...`.
//      Here the authority is the domain and must be dropped; the path is what
//      matters.
// `parseDeepLink` normalizes both (plus Expo Go's `exp://.../--/path` dev form)
// into the same `DeepLinkTarget`, and falls back to the library for anything
// unknown or malformed so a bad link can never crash the app (requirement 2).

/** The custom URL scheme registered by the native app (app.json `scheme`). */
export const DEEP_LINK_SCHEME = "bedtimequests";

/**
 * The screens a link can open, kept intentionally small: the exact set issue #65
 * calls for. The native navigator maps each of these onto its own Route (and
 * validates that a `reader` slug actually exists, falling back to the library if
 * not). Adding a screen here is a deliberate, testable change in one place.
 */
export type DeepLinkTarget =
  | { screen: "library" }
  | { screen: "reader"; slug: string }
  | { screen: "collection" };

/**
 * The web paths that should open the native app as Universal/App Links, i.e. the
 * REAL web routes under `app/(app)` that have an in-app equivalent. Used by the
 * web app to build the Apple `components` / Android `pathPrefix` entries so the
 * association files and the router agree.
 *
 * Deliberately NOT including the site root `/`: the marketing/landing page and the
 * public legal pages (`/privacy`, `/terms`, `/support`) must stay in the browser,
 * so a plain link to bedtimequests.com is never hijacked into the app. The
 * home/library screen is still reachable as an INTERNAL deep link via the custom
 * scheme (`bedtimequests://` or `bedtimequests://library`), which is what the
 * bedtime-reminder tap (#56) and in-app links use.
 */
export const APP_LINK_PATHS = {
  /** A specific story: `/story/<slug>` -> the reader. `*` is the Apple wildcard. */
  story: "/story/",
  /** The collection / achievements screen. */
  collection: "/collection",
} as const;

/**
 * Strip the scheme (and, for standard web/dev schemes, the authority) from a URL,
 * returning the remaining "path" portion. Our OWN custom scheme is special-cased
 * because its authority is a meaningful path segment, not a host to discard.
 */
function pathPortion(url: string): string {
  const schemePrefix = `${DEEP_LINK_SCHEME}://`;
  if (url.toLowerCase().startsWith(schemePrefix)) {
    // `bedtimequests://story/slug` -> `story/slug` (keep the authority segment).
    return url.slice(schemePrefix.length);
  }
  // Any other `scheme://authority` (https, http, exp, ...): drop scheme + host.
  // `https://bedtimequests.com/story/slug` -> `/story/slug`
  // `exp://127.0.0.1:8081/--/story/slug`   -> `/--/story/slug`
  return url.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]*/i, "");
}

/**
 * Split a URL into decoded, non-empty path segments, dropping the query/fragment
 * and Expo Go's `--` deep-link separator so a dev link routes like a real one.
 */
function segmentsOf(url: string): string[] {
  const path = pathPortion(url).split(/[?#]/)[0]; // strip ?query and #fragment
  const segments = path
    .split("/")
    .filter((s) => s.length > 0)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s; // a malformed %-escape is kept verbatim rather than throwing
      }
    });
  // Expo Go prefixes the real path with `--`, e.g. exp://host/--/story/slug.
  if (segments[0] === "--") segments.shift();
  return segments;
}

/**
 * Resolve any deep or universal/app link URL into a `DeepLinkTarget`. Total by
 * design: an empty, unknown, or malformed URL yields `{ screen: "library" }`, so
 * the caller can route the result unconditionally and a bad link degrades to the
 * home screen instead of crashing (issue #65 requirement 2).
 */
export function parseDeepLink(url: string | null | undefined): DeepLinkTarget {
  if (!url) return { screen: "library" };

  const segments = segmentsOf(url);
  const [first, second] = segments;

  switch (first) {
    // `/story/<slug>` -> the reader for that slug. A missing/empty slug falls
    // back to the library rather than opening a broken reader.
    case "story":
      return second && second.length > 0 ? { screen: "reader", slug: second } : { screen: "library" };
    // Both the web path (`/collection`) and a friendlier internal alias resolve
    // to the same collection/achievements screen.
    case "collection":
    case "achievements":
      return { screen: "collection" };
    // Explicit home aliases for the custom scheme; also the empty-path default.
    case undefined:
    case "library":
    case "home":
      return { screen: "library" };
    // Anything we do not recognize opens the library (graceful fallback).
    default:
      return { screen: "library" };
  }
}
