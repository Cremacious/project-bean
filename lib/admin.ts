// lib/admin.ts
/** Parse ADMIN_EMAILS (comma-separated) into a lowercased set at call time. */
function adminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean));
}

/** True if the email is on the ADMIN_EMAILS allowlist. */
export function isAdmin(email: string): boolean {
  return adminEmails().has(email.trim().toLowerCase());
}
