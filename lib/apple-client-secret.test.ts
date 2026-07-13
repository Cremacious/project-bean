import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { generateAppleClientSecret } from "./apple-client-secret";

// A throwaway EC P-256 key pair, generated fresh per run, standing in for the
// Apple .p8. We sign with the private key and verify with the public key.
function makeKeyPair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "P-256",
  });
  return {
    privatePem: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    publicKey,
  };
}

function decodeSegment(segment: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
}

describe("generateAppleClientSecret", () => {
  it("produces a three-part JWT with the Apple header and claims", () => {
    const { privatePem } = makeKeyPair();
    const token = generateAppleClientSecret({
      clientId: "app.bedtimequests.web",
      teamId: "TEAM123456",
      keyId: "KEY1234567",
      privateKey: privatePem,
    });

    const parts = token.split(".");
    expect(parts).toHaveLength(3);

    const header = decodeSegment(parts[0]);
    expect(header).toMatchObject({ alg: "ES256", kid: "KEY1234567" });

    const payload = decodeSegment(parts[1]) as Record<string, number | string>;
    expect(payload.iss).toBe("TEAM123456");
    expect(payload.sub).toBe("app.bedtimequests.web");
    expect(payload.aud).toBe("https://appleid.apple.com");
    // exp must be in the future and within Apple's 6-month ceiling.
    const now = Math.floor(Date.now() / 1000);
    expect(payload.exp as number).toBeGreaterThan(now);
    expect((payload.exp as number) - now).toBeLessThanOrEqual(60 * 60 * 24 * 180);
  });

  it("signs with ES256 so Apple's public key can verify it", () => {
    const { privatePem, publicKey } = makeKeyPair();
    const token = generateAppleClientSecret({
      clientId: "app.bedtimequests.web",
      teamId: "TEAM123456",
      keyId: "KEY1234567",
      privateKey: privatePem,
    });

    const [h, p, sig] = token.split(".");
    const valid = crypto.verify(
      "sha256",
      Buffer.from(`${h}.${p}`),
      { key: publicKey, dsaEncoding: "ieee-p1363" },
      Buffer.from(sig, "base64url"),
    );
    expect(valid).toBe(true);
  });

  it("accepts a PEM whose newlines were escaped for .env storage", () => {
    const { privatePem, publicKey } = makeKeyPair();
    const escaped = privatePem.replace(/\n/g, "\\n");
    const token = generateAppleClientSecret({
      clientId: "app.bedtimequests.web",
      teamId: "TEAM123456",
      keyId: "KEY1234567",
      privateKey: escaped,
    });

    const [h, p, sig] = token.split(".");
    const valid = crypto.verify(
      "sha256",
      Buffer.from(`${h}.${p}`),
      { key: publicKey, dsaEncoding: "ieee-p1363" },
      Buffer.from(sig, "base64url"),
    );
    expect(valid).toBe(true);
  });
});
