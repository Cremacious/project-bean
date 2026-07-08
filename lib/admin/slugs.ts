// lib/admin/slugs.ts
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Valid slug/page-key: lowercase alphanumerics joined by single hyphens. */
export function isValidSlug(s: string): boolean {
  return SLUG_RE.test(s);
}

/** Best-effort conversion of free text to a valid slug. May be empty. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
