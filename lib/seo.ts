// lib/seo.ts
// The shared source of truth for what search engines may see. Kept out of the
// app/sitemap.ts and app/robots.ts route files so the rules are plain data that
// can be unit tested (see lib/seo.test.ts).
//
// This app is almost entirely behind auth: the home page, library, story reader,
// family/child management, account, and subscribe screens all live in the
// app/(app) route group and redirect signed out visitors to /sign-in. Admin
// tooling lives under /admin. None of that, and nothing child specific, may ever
// be indexed (issue #46). Only the always public acquisition pages are listed
// for crawlers.
import type { MetadataRoute } from "next";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

// The public, indexable routes. These are the only pages a signed out visitor
// (and therefore any crawler) can actually reach without being redirected.
export const PUBLIC_ROUTES: ReadonlyArray<{
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  // Marketing landing page (issue #68). Public and indexable; the acquisition
  // page anonymous visitors to the root are routed to, so it ranks just below the
  // bare origin.
  { path: "/welcome", changeFrequency: "weekly", priority: 0.9 },
  { path: "/sign-up", changeFrequency: "monthly", priority: 0.8 },
  { path: "/sign-in", changeFrequency: "monthly", priority: 0.5 },
  // Legal + support pages (issue #49). Public and indexable; they change rarely.
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/support", changeFrequency: "yearly", priority: 0.3 },
];

// Path prefixes crawlers must never index: the whole authed app, the admin
// tools, the auth and webhook APIs, and the single use, token bearing password
// reset page. Child data lives entirely under these authed routes, so
// disallowing them keeps anything child specific out of search results. Matching
// is by leading segment, exactly how a robots.txt Disallow line behaves.
export const DISALLOWED_PATHS: readonly string[] = [
  "/api/",
  "/admin",
  "/account",
  "/collection",
  "/family",
  "/subscribe",
  "/story",
  "/reset-password",
];

/** Build the sitemap entries for every public route, resolved against `baseUrl`. */
export function buildSitemap(baseUrl: string, lastModified: Date): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    // Keep the home entry as a bare origin with a trailing slash; append the path
    // for the rest.
    url: route.path === "/" ? `${baseUrl}/` : `${baseUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

/** Build the robots rules: allow everything public, disallow the authed areas. */
export function buildRobots(baseUrl: string): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...DISALLOWED_PATHS],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
