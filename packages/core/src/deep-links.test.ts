// packages/core/src/deep-links.test.ts
import { describe, expect, it } from "vitest";
import { DEEP_LINK_SCHEME, APP_LINK_PATHS, parseDeepLink } from "./deep-links";

describe("parseDeepLink — custom scheme (internal deep links)", () => {
  it("opens the library for the bare scheme", () => {
    expect(parseDeepLink("bedtimequests://")).toEqual({ screen: "library" });
    expect(parseDeepLink("bedtimequests:///")).toEqual({ screen: "library" });
  });

  it("opens the library for explicit home aliases", () => {
    expect(parseDeepLink("bedtimequests://library")).toEqual({ screen: "library" });
    expect(parseDeepLink("bedtimequests://home")).toEqual({ screen: "library" });
  });

  it("opens the reader for a story link (authority is the path segment)", () => {
    expect(parseDeepLink("bedtimequests://story/starlight-sail")).toEqual({
      screen: "reader",
      slug: "starlight-sail",
    });
  });

  it("opens the collection screen", () => {
    expect(parseDeepLink("bedtimequests://collection")).toEqual({ screen: "collection" });
    expect(parseDeepLink("bedtimequests://achievements")).toEqual({ screen: "collection" });
  });
});

describe("parseDeepLink — universal / app links (https)", () => {
  it("opens the reader for /story/<slug> on the canonical domain", () => {
    expect(parseDeepLink("https://bedtimequests.com/story/starlight-sail")).toEqual({
      screen: "reader",
      slug: "starlight-sail",
    });
  });

  it("opens the collection for /collection", () => {
    expect(parseDeepLink("https://bedtimequests.com/collection")).toEqual({ screen: "collection" });
  });

  it("is host-agnostic (www or apex both route the same)", () => {
    expect(parseDeepLink("https://www.bedtimequests.com/story/dot-the-tugboat")).toEqual({
      screen: "reader",
      slug: "dot-the-tugboat",
    });
  });

  it("ignores query strings and fragments", () => {
    expect(parseDeepLink("https://bedtimequests.com/story/pearl-tide-pools?utm=email#top")).toEqual({
      screen: "reader",
      slug: "pearl-tide-pools",
    });
  });

  it("decodes percent-encoded slugs", () => {
    expect(parseDeepLink("https://bedtimequests.com/story/owl%2Dwho%2Dcounted%2Dstars")).toEqual({
      screen: "reader",
      slug: "owl-who-counted-stars",
    });
  });
});

describe("parseDeepLink — Expo Go dev form", () => {
  it("drops the `--` separator so dev links route like real ones", () => {
    expect(parseDeepLink("exp://127.0.0.1:8081/--/story/fern-lantern-woods")).toEqual({
      screen: "reader",
      slug: "fern-lantern-woods",
    });
    expect(parseDeepLink("bedtimequests://--/collection")).toEqual({ screen: "collection" });
  });
});

describe("parseDeepLink — graceful fallback (never crashes)", () => {
  it("falls back to the library for null / empty input", () => {
    expect(parseDeepLink(null)).toEqual({ screen: "library" });
    expect(parseDeepLink(undefined)).toEqual({ screen: "library" });
    expect(parseDeepLink("")).toEqual({ screen: "library" });
  });

  it("falls back to the library for a story link with no slug", () => {
    expect(parseDeepLink("bedtimequests://story")).toEqual({ screen: "library" });
    expect(parseDeepLink("https://bedtimequests.com/story/")).toEqual({ screen: "library" });
  });

  it("falls back to the library for unknown paths (e.g. marketing/legal)", () => {
    expect(parseDeepLink("https://bedtimequests.com/privacy")).toEqual({ screen: "library" });
    expect(parseDeepLink("bedtimequests://totally/unknown/route")).toEqual({ screen: "library" });
  });

  it("does not throw on garbage input", () => {
    expect(() => parseDeepLink("not a url at all")).not.toThrow();
    expect(() => parseDeepLink("://///")).not.toThrow();
    expect(parseDeepLink("not a url at all")).toEqual({ screen: "library" });
  });
});

describe("shared constants", () => {
  it("exposes the scheme used by the native app config", () => {
    expect(DEEP_LINK_SCHEME).toBe("bedtimequests");
  });

  it("the app-link paths route to their screens (config and router agree)", () => {
    expect(parseDeepLink(`https://bedtimequests.com${APP_LINK_PATHS.story}some-slug`)).toEqual({
      screen: "reader",
      slug: "some-slug",
    });
    expect(parseDeepLink(`https://bedtimequests.com${APP_LINK_PATHS.collection}`)).toEqual({
      screen: "collection",
    });
  });
});
