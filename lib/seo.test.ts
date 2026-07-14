import { describe, it, expect } from "vitest";
import {
  PUBLIC_ROUTES,
  DISALLOWED_PATHS,
  buildSitemap,
  buildRobots,
} from "./seo";

const BASE = "https://bedtimequests.com";
const NOW = new Date("2026-07-13T00:00:00.000Z");

describe("buildSitemap", () => {
  it("lists every public route as an absolute URL on the given origin", () => {
    const entries = buildSitemap(BASE, NOW);
    expect(entries.map((e) => e.url)).toEqual([
      "https://bedtimequests.com/",
      "https://bedtimequests.com/welcome",
      "https://bedtimequests.com/sign-up",
      "https://bedtimequests.com/sign-in",
      "https://bedtimequests.com/privacy",
      "https://bedtimequests.com/terms",
      "https://bedtimequests.com/support",
    ]);
    for (const entry of entries) {
      expect(entry.url.startsWith(BASE)).toBe(true);
      expect(entry.lastModified).toBe(NOW);
    }
  });

  it("never leaks an authed, admin, api, or child data route", () => {
    const urls = buildSitemap(BASE, NOW).map((e) => e.url);
    for (const authed of ["/account", "/collection", "/family", "/subscribe", "/story", "/admin", "/api"]) {
      expect(urls.some((u) => u.includes(authed))).toBe(false);
    }
  });

  it("gives the home page the top priority", () => {
    const home = buildSitemap(BASE, NOW).find((e) => e.url === `${BASE}/`);
    expect(home?.priority).toBe(1);
  });
});

describe("buildRobots", () => {
  it("allows crawling and disallows every authed area", () => {
    const robots = buildRobots(BASE);
    const rule = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;
    expect(rule.userAgent).toBe("*");
    expect(rule.allow).toBe("/");
    expect(rule.disallow).toEqual([...DISALLOWED_PATHS]);
  });

  it("disallows the admin tools and the whole authed app", () => {
    const robots = buildRobots(BASE);
    const rule = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;
    const disallow = rule.disallow as string[];
    expect(disallow).toContain("/admin");
    expect(disallow).toContain("/api/");
    for (const authed of ["/account", "/collection", "/family", "/subscribe", "/story"]) {
      expect(disallow).toContain(authed);
    }
  });

  it("does not disallow any of the public routes it advertises", () => {
    const robots = buildRobots(BASE);
    const rule = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;
    const disallow = rule.disallow as string[];
    for (const route of PUBLIC_ROUTES) {
      expect(disallow).not.toContain(route.path);
    }
  });

  it("references the sitemap and host on the given origin", () => {
    const robots = buildRobots(BASE);
    expect(robots.sitemap).toBe(`${BASE}/sitemap.xml`);
    expect(robots.host).toBe(BASE);
  });
});
