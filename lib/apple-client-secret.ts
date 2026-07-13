// lib/apple-client-secret.ts
//
// Apple "Sign in with Apple" does not use a static client secret. Instead the
// client secret is a short-lived JWT that you sign yourself with the private
// key (.p8) you download from the Apple Developer portal. BetterAuth's Apple
// provider expects `clientSecret` to already be that signed JWT (it does not
// generate it), so we build it here and hand it in from lib/auth.ts.
//
// Apple's requirements for the token (see Apple's "Generate and validate
// tokens" docs):
//   header: { alg: "ES256", kid: <Key ID> }
//   claims: { iss: <Team ID>, iat, exp, aud: "https://appleid.apple.com",
//             sub: <Services ID / client_id> }
// Apple caps the lifetime at 6 months (15777000 seconds).
import crypto from "node:crypto";

const APPLE_AUDIENCE = "https://appleid.apple.com";

// Apple rejects secrets whose exp is more than 6 months out. We use ~150 days
// so a long-lived server process re-signs (on next boot) comfortably before
// Apple would start refusing the token.
const CLIENT_SECRET_LIFETIME_SECONDS = 60 * 60 * 24 * 150;

export interface AppleClientSecretParams {
  /** The Services ID (e.g. "app.bedtimequests.web"); becomes the `sub` claim. */
  clientId: string;
  /** The 10-character Apple Developer Team ID; becomes the `iss` claim. */
  teamId: string;
  /** The 10-character Key ID for the .p8 key; becomes the JWT header `kid`. */
  keyId: string;
  /** Contents of the AuthKey_XXXXXXXXXX.p8 file (PKCS#8 PEM). */
  privateKey: string;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

// .env files cannot hold real newlines, so a PEM is commonly pasted with the
// line breaks escaped as literal "\n". Restore them before parsing. An already
// multi-line PEM passes through unchanged.
function normalizePem(pem: string): string {
  return pem.includes("\\n") ? pem.replace(/\\n/g, "\n") : pem;
}

/**
 * Builds the signed ES256 JWT that Apple accepts as an OAuth client secret.
 * Signing is synchronous so this can run at BetterAuth config time.
 */
export function generateAppleClientSecret({
  clientId,
  teamId,
  keyId,
  privateKey,
}: AppleClientSecretParams): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: keyId, typ: "JWT" };
  const payload = {
    iss: teamId,
    iat: now,
    exp: now + CLIENT_SECRET_LIFETIME_SECONDS,
    aud: APPLE_AUDIENCE,
    sub: clientId,
  };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(
    JSON.stringify(payload),
  )}`;

  // Apple keys are EC P-256. A JWS ES256 signature is the raw R||S pair
  // (IEEE-P1363), not the DER encoding Node emits by default, so we ask for
  // ieee-p1363 explicitly.
  const key = crypto.createPrivateKey(normalizePem(privateKey));
  const signature = crypto.sign("sha256", Buffer.from(signingInput), {
    key,
    dsaEncoding: "ieee-p1363",
  });

  return `${signingInput}.${base64url(signature)}`;
}
