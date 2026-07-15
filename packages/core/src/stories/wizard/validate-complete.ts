// packages/core/src/stories/wizard/validate-complete.ts
// Extends the structural validateStory with completeness + content checks, split
// into blocking (mechanical, safe to enforce) and warning (heuristic / craft).
// Each issue carries an optional pageKey so the UI can link straight to the page
// that needs fixing.
import type { StoryInput } from "../story-types";
import { validateStory } from "../validate";

// Any dash character: hyphen-minus, the general-punctuation dashes U+2010..U+2015,
// and the minus sign U+2212. Displayed copy must contain none of them.
const DASH = /[-‐-―−]/;
const PRONOUNS = /\b(he|she|him|her|hers|his|boy|girl)\b/i;

/** One validation issue. `pageKey` is set when the issue belongs to a page. */
export type Issue = { message: string; pageKey?: string };
export type ValidationResult = { blocking: Issue[]; warnings: Issue[] };

/** Every displayed string, labelled by where it lives and (if any) its page key. */
function displayedStrings(s: StoryInput): Array<{ where: string; text: string; pageKey?: string }> {
  const out: Array<{ where: string; text: string; pageKey?: string }> = [
    { where: "title", text: s.title },
    { where: "description", text: s.description ?? "" },
  ];
  for (const [key, p] of Object.entries(s.pages)) {
    out.push({ where: `page "${key}"`, text: p.body, pageKey: key });
    if (p.ending) out.push({ where: `ending label on "${key}"`, text: p.ending, pageKey: key });
    for (const c of p.choices ?? []) out.push({ where: `choice on "${key}"`, text: c.label, pageKey: key });
  }
  return out;
}

/** True when a good ending is reachable from the start. */
function goodEndingReachable(s: StoryInput): boolean {
  const seen = new Set<string>();
  const q = [s.start];
  while (q.length) {
    const k = q.shift()!;
    if (seen.has(k)) continue;
    seen.add(k);
    const p = s.pages[k];
    if (!p) continue;
    if (p.ending !== undefined && (p.endingKind ?? "good") === "good") return true;
    for (const c of p.choices ?? []) q.push(c.to);
  }
  return false;
}

/** Content-only checks. Dashes block; possible child pronouns warn. */
export function lintStoryContent(s: StoryInput): ValidationResult {
  const blocking: Issue[] = [];
  const warnings: Issue[] = [];
  for (const { where, text, pageKey } of displayedStrings(s)) {
    if (DASH.test(text)) blocking.push({ message: `Remove the dash in the ${where}.`, pageKey });
    if (PRONOUNS.test(text)) warnings.push({ message: `Check the ${where}: a word like "he" or "she" may stand in for the child.`, pageKey });
  }
  return { blocking, warnings };
}

/** The full "ready to publish" verdict. `blocking` empty means publishable. */
export function validateStoryComplete(s: StoryInput): ValidationResult {
  const blocking: Issue[] = validateStory(s).map((message) => ({ message })); // existing structural checks
  const warnings: Issue[] = [];

  for (const [key, p] of Object.entries(s.pages)) {
    if (p.body.trim() === "") blocking.push({ message: `Page "${key}" needs text.`, pageKey: key });
    if (p.ending !== undefined && (p.ending ?? "").trim() === "") blocking.push({ message: `The ending on "${key}" needs a label.`, pageKey: key });
    const forks = p.choices ?? [];
    if (forks.length >= 2) for (const c of forks) if (c.label.trim() === "") { blocking.push({ message: `A choice on "${key}" needs a label.`, pageKey: key }); break; }
    if (forks.length > 3) warnings.push({ message: `Page "${key}" has more than three choices; two or three reads best.`, pageKey: key });
  }

  if (!goodEndingReachable(s)) blocking.push({ message: "At least one good ending must be reachable from the start." });

  const lint = lintStoryContent(s);
  blocking.push(...lint.blocking);
  warnings.push(...lint.warnings);

  return { blocking, warnings };
}
