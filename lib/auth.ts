// lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/client";
import * as schema from "@/db/schema";

type Social = NonNullable<Parameters<typeof betterAuth>[0]["socialProviders"]>;
const socialProviders: Social = {};
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  socialProviders.apple = {
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
  };
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
  emailAndPassword: { enabled: true },
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
