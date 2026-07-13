// lib/site-url.ts
// Single source of truth for the app's public origin. Used by the Metadata API
// (canonical / OpenGraph resolution in app/layout.tsx), the sitemap, and the
// robots rules so every absolute URL agrees with the origin the browser is
// actually on. Driven by the same NEXT_PUBLIC_APP_URL env var as the auth client
// (lib/auth-client.ts). In Production this is the custom domain set in issue #43
// (https://bedtimequests.com); the localhost fallback is dev only and is never
// used on Vercel, where NEXT_PUBLIC_APP_URL is always set. Any trailing slash is
// stripped so callers can safely append `/path`.
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
