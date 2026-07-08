// lib/stories/personalize.ts
/** Replace the {{name}} token with the child's name. Exact-match only. */
export function personalize(text: string, name: string): string {
  return text.split("{{name}}").join(name);
}
