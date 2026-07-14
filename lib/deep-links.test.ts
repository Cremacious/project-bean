// lib/deep-links.test.ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ANDROID_PACKAGE,
  IOS_BUNDLE_ID,
  androidCertFingerprints,
  appleTeamId,
  buildAppleAppSiteAssociation,
  buildAssetLinks,
  hasPlaceholderCredentials,
} from "./deep-links";

// These builders read process.env; save and restore around each test so cases
// don't leak into one another.
const SAVED = { team: process.env.APPLE_TEAM_ID, sha: process.env.ANDROID_SHA256_CERT_FINGERPRINTS };

beforeEach(() => {
  delete process.env.APPLE_TEAM_ID;
  delete process.env.ANDROID_SHA256_CERT_FINGERPRINTS;
});
afterEach(() => {
  if (SAVED.team === undefined) delete process.env.APPLE_TEAM_ID;
  else process.env.APPLE_TEAM_ID = SAVED.team;
  if (SAVED.sha === undefined) delete process.env.ANDROID_SHA256_CERT_FINGERPRINTS;
  else process.env.ANDROID_SHA256_CERT_FINGERPRINTS = SAVED.sha;
});

describe("apple-app-site-association", () => {
  it("uses TeamID.bundleId as the appID once the Team ID is set", () => {
    process.env.APPLE_TEAM_ID = "A1BCDE2FG3";
    const aasa = buildAppleAppSiteAssociation();
    const detail = aasa.applinks.details[0];
    expect(detail.appID).toBe(`A1BCDE2FG3.${IOS_BUNDLE_ID}`);
    expect(detail.appIDs).toEqual([`A1BCDE2FG3.${IOS_BUNDLE_ID}`]);
  });

  it("scopes links to /story/* and /collection only (marketing/legal stay in browser)", () => {
    const detail = buildAppleAppSiteAssociation().applinks.details[0];
    expect(detail.paths).toEqual(["/story/*", "/collection"]);
    expect(detail.components).toEqual([{ "/": "/story/*" }, { "/": "/collection" }]);
    expect(detail.paths).not.toContain("/");
    expect(detail.paths).not.toContain("/privacy");
  });

  it("is valid, serializable JSON", () => {
    expect(() => JSON.stringify(buildAppleAppSiteAssociation())).not.toThrow();
  });

  it("serves a clearly marked placeholder appID until the Team ID is configured", () => {
    expect(buildAppleAppSiteAssociation().applinks.details[0].appID).toMatch(/^TEAMID_REPLACE/);
    expect(hasPlaceholderCredentials()).toBe(true);
  });
});

describe("assetlinks.json", () => {
  it("delegates URL handling to the app package with the configured fingerprint(s)", () => {
    process.env.ANDROID_SHA256_CERT_FINGERPRINTS = "AA:BB:CC, DD:EE:FF";
    const [entry] = buildAssetLinks();
    expect(entry.relation).toEqual(["delegate_permission/common.handle_all_urls"]);
    expect(entry.target.namespace).toBe("android_app");
    expect(entry.target.package_name).toBe(ANDROID_PACKAGE);
    expect(entry.target.sha256_cert_fingerprints).toEqual(["AA:BB:CC", "DD:EE:FF"]);
  });

  it("serves a clearly marked placeholder fingerprint until one is configured", () => {
    expect(androidCertFingerprints()).toEqual(["REPLACE_WITH_ANDROID_SHA256_CERT_FINGERPRINT"]);
    expect(hasPlaceholderCredentials()).toBe(true);
  });

  it("is valid, serializable JSON", () => {
    expect(() => JSON.stringify(buildAssetLinks())).not.toThrow();
  });
});

describe("configured state", () => {
  it("reports no placeholders once both identifiers are set", () => {
    process.env.APPLE_TEAM_ID = "A1BCDE2FG3";
    process.env.ANDROID_SHA256_CERT_FINGERPRINTS = "AA:BB:CC:DD";
    expect(appleTeamId()).toBe("A1BCDE2FG3");
    expect(hasPlaceholderCredentials()).toBe(false);
  });
});
