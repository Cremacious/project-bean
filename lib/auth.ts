// lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { sendEmail, resetPasswordEmail } from "@/lib/email";
import { generateAppleClientSecret } from "@/lib/apple-client-secret";

// Social providers are wired conditionally: a provider only activates when its
// credentials are present in the environment, so local dev and CI (which have
// none) never crash and never surface a broken button.
type Social = NonNullable<Parameters<typeof betterAuth>[0]["socialProviders"]>;
const socialProviders: Social = {};

// Google (issue #15): a standard OAuth 2.0 Web-application client. Redirect URI
// registered in Google Cloud must be <BETTER_AUTH_URL>/api/auth/callback/google.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

// Apple (issue #16): Apple uses a short-lived signed JWT as the OAuth client
// secret, not a static string, and BetterAuth does not generate it. So we build
// the secret from the Services ID + Team ID + Key ID + .p8 private key (see
// lib/apple-client-secret.ts). A pre-generated APPLE_CLIENT_SECRET is honoured
// if provided (e.g. built in a deploy pipeline). Apple's return URL must be
// HTTPS, so the registered redirect URI is
// <BETTER_AUTH_URL>/api/auth/callback/apple on a real domain.
const appleClientId = process.env.APPLE_CLIENT_ID;
if (appleClientId) {
  let appleClientSecret = process.env.APPLE_CLIENT_SECRET;
  if (
    !appleClientSecret &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_KEY_ID &&
    process.env.APPLE_PRIVATE_KEY
  ) {
    try {
      appleClientSecret = generateAppleClientSecret({
        clientId: appleClientId,
        teamId: process.env.APPLE_TEAM_ID,
        keyId: process.env.APPLE_KEY_ID,
        privateKey: process.env.APPLE_PRIVATE_KEY,
      });
    } catch (error) {
      // A malformed key must not take down the whole auth route: log and leave
      // Apple disabled rather than throwing at module load.
      console.error("Failed to generate the Apple client secret; Apple sign-in is disabled.", error);
    }
  }
  if (appleClientSecret) {
    socialProviders.apple = {
      clientId: appleClientId,
      clientSecret: appleClientSecret,
    };
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // Password reset (issues #17 and #18). BetterAuth builds the tokenised URL
    // and calls this hook; we render the on-brand email and hand it to the
    // provider. The link is valid for one hour.
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      const email = resetPasswordEmail({ name: user.name, url });
      await sendEmail({
        to: user.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });
    },
    // Email verification decision (issue #19): we deliberately do NOT require or
    // send verification emails. The audience is parents opening the app at
    // bedtime, so we avoid any sign-up friction or risk of lock-out from a slow
    // or spam-filtered message. Transactional email is reserved for password
    // reset. To add a verified-email gate later (e.g. before paid features),
    // set requireEmailVerification here and add an emailVerification block with
    // its own sendVerificationEmail hook.
  },
  socialProviders,
  // Session lifetime and refresh (issue #22). A bedtime app is opened nightly,
  // so we favour a long-lived, rolling session over frequent re-logins:
  //  - expiresIn: a session is valid for 30 days of inactivity.
  //  - updateAge: each day the session is used, its expiry rolls forward, so
  //    an active family effectively stays signed in.
  // Cookie caching is deliberately left OFF: every request re-reads the session
  // from the database, so "Sign out of all other devices" (revokeOtherSessions)
  // and account deletion take effect immediately instead of lingering until a
  // cached cookie expires.
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh at most once per day
  },
  // Brute-force and abuse protection on the auth endpoints (issue #23).
  // enabled: true turns limiting on in every environment (BetterAuth only
  // enables it in production by default). Storage is in-memory, which protects
  // a single long-lived server; a shared store (database or secondary storage)
  // is the upgrade path if this is ever deployed across multiple instances.
  // BetterAuth already ships strict defaults for these paths; customRules make
  // the sign-in/sign-up limits explicit: at most 5 attempts per minute per IP.
  rateLimit: {
    enabled: true,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
      "/change-password": { window: 60, max: 5 },
    },
  },
  // Self-serve account deletion (issue #21). No verification email is wired
  // (that is issue #17), so deletion happens immediately once the parent
  // re-enters their password. Deleting the `user` row cascades to `child`
  // and `ending_found` via the schema foreign keys.
  user: { deleteUser: { enabled: true } },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});

export type Session = typeof auth.$Infer.Session;
