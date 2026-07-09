// lib/brand.ts
// Single source of truth for the product's public branding. Import these
// everywhere the name appears (navbar, footer, auth, metadata) so the copy
// stays consistent. No dashes in any displayed value (app-wide UI rule).
export const BRAND = {
  /** Primary name shown in the navbar, footer, and auth screens. */
  name: "Bedtime Quests",
  /** Short tagline shown under the name. */
  subtitle: "Interactive Stories for Kids",
  /** Full name for web titles and press. */
  fullName: "Bedtime Quests: Interactive Bedtime Stories",
  /** Marketing slogan. */
  slogan: "Choose your own goodnight.",
} as const;
