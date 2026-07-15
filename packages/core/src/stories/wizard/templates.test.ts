import { describe, it, expect } from "vitest";
import { TEMPLATES, expandTemplate } from "./templates";
import { isValidSlug } from "../../admin/slugs";
import type { Scaffold, ScaffoldPage } from "./types";

function byKey(s: Scaffold): Map<string, ScaffoldPage> {
  return new Map(s.pages.map((p) => [p.key, p]));
}
function forkCount(p: ScaffoldPage): number {
  return p.kind === "choice" ? p.choices.length : 0;
}
/** Min choice-depth (number of choice pages passed) from start to each page. */
function choiceDepths(s: Scaffold): Map<string, number> {
  const map = byKey(s);
  const depth = new Map<string, number>();
  const q: Array<[string, number]> = [[s.startKey, 0]];
  while (q.length) {
    const [k, d] = q.shift()!;
    if (depth.has(k) && depth.get(k)! <= d) continue;
    depth.set(k, d);
    const p = map.get(k);
    if (!p) continue;
    for (const c of p.choices) q.push([c.toKey, d + (p.kind === "choice" ? 1 : 0)]);
  }
  return depth;
}

const cases = [
  { id: "twin-trails" as const, band: "2-4" as const, good: 2, surprise: 1, minDepth: 3 },
  { id: "twin-trails" as const, band: "2-4" as const, good: 3, surprise: 2, minDepth: 3 },
  { id: "two-paths-meet" as const, band: "5-7" as const, good: 3, surprise: 1, minDepth: 5 },
  { id: "branching-tree" as const, band: "8+" as const, good: 4, surprise: 2, minDepth: 7 },
  { id: "adventure-trail" as const, band: "8+" as const, good: 3, surprise: 2, minDepth: 7 },
];

describe("expandTemplate invariants", () => {
  for (const c of cases) {
    const label = `${c.id} (${c.good} good / ${c.surprise} surprise)`;

    it(`${label}: obeys the rhythm rule`, () => {
      const s = expandTemplate(c.id, { ageBand: c.band, good: c.good, surprise: c.surprise });
      const map = byKey(s);
      expect(map.get(s.startKey)!.kind).toBe("scene");
      for (const p of s.pages) {
        for (const ch of p.choices) {
          if (p.kind === "choice") expect(map.get(ch.toKey)!.kind).toBe("scene");
        }
        if (p.kind === "scene" && !p.isEnding) expect(p.choices.length).toBe(1);
      }
    });

    it(`${label}: produces the requested ending counts`, () => {
      const s = expandTemplate(c.id, { ageBand: c.band, good: c.good, surprise: c.surprise });
      const good = s.pages.filter((p) => p.isEnding && p.endingKind === "good").length;
      const surprise = s.pages.filter((p) => p.isEnding && p.endingKind === "game_over").length;
      expect(good).toBe(c.good);
      expect(surprise).toBe(c.surprise);
    });

    it(`${label}: every good ending sits behind at least the minimum choices`, () => {
      const s = expandTemplate(c.id, { ageBand: c.band, good: c.good, surprise: c.surprise });
      const depths = choiceDepths(s);
      for (const p of s.pages) {
        if (p.isEnding && p.endingKind === "good") {
          expect(depths.get(p.key)!).toBeGreaterThanOrEqual(c.minDepth);
        }
      }
    });

    it(`${label}: choices only point at existing pages, forks have 2 or 3`, () => {
      const s = expandTemplate(c.id, { ageBand: c.band, good: c.good, surprise: c.surprise });
      const keys = new Set(s.pages.map((p) => p.key));
      for (const p of s.pages) {
        for (const ch of p.choices) expect(keys.has(ch.toKey)).toBe(true);
        if (p.kind === "choice") {
          expect(forkCount(p)).toBeGreaterThanOrEqual(2);
          expect(forkCount(p)).toBeLessThanOrEqual(3);
        }
      }
    });

    it(`${label}: page keys are unique and valid slugs`, () => {
      const s = expandTemplate(c.id, { ageBand: c.band, good: c.good, surprise: c.surprise });
      expect(new Set(s.pages.map((p) => p.key)).size).toBe(s.pages.length);
      for (const p of s.pages) expect(isValidSlug(p.key)).toBe(true);
      expect(isValidSlug(s.startKey) || s.startKey === "opening").toBe(true);
    });
  }

  it("blank template is a single opening scene", () => {
    const s = expandTemplate("blank", { ageBand: null, good: 0, surprise: 0 });
    expect(s.pages).toHaveLength(1);
    expect(s.pages[0].key).toBe(s.startKey);
    expect(s.pages[0].kind).toBe("scene");
    expect(s.pages[0].isEnding).toBe(false);
  });

  it("registry lists every non-blank template with a name and description", () => {
    expect(TEMPLATES.length).toBe(4);
    for (const t of TEMPLATES) {
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
    }
  });
});

// --- distinctive-topology checks: prove the four shapes really differ --------
function reachable(s: Scaffold, from: string): Set<string> {
  const map = byKey(s);
  const seen = new Set<string>();
  const q = [from];
  while (q.length) {
    const k = q.shift()!;
    if (seen.has(k)) continue;
    seen.add(k);
    for (const c of map.get(k)?.choices ?? []) q.push(c.toKey);
  }
  return seen;
}
function maxIndegree(s: Scaffold): number {
  const deg = new Map<string, number>();
  for (const p of s.pages) for (const c of p.choices) deg.set(c.toKey, (deg.get(c.toKey) ?? 0) + 1);
  return Math.max(0, ...deg.values());
}
/** Choices whose forks lead to 2+ non-terminal, mutually disjoint regions. */
function midBranchCount(s: Scaffold): number {
  const map = byKey(s);
  let count = 0;
  for (const p of s.pages) {
    if (p.kind !== "choice") continue;
    const continuing = p.choices.filter((c) => !map.get(c.toKey)!.isEnding);
    if (continuing.length < 2) continue;
    const sets = continuing.map((c) => reachable(s, c.toKey));
    let disjoint = true;
    for (let i = 0; i < sets.length && disjoint; i++)
      for (let j = i + 1; j < sets.length && disjoint; j++)
        if ([...sets[i]].some((k) => sets[j].has(k))) disjoint = false;
    if (disjoint) count++;
  }
  return count;
}
function choiceDepthsDistinct(s: Scaffold): boolean {
  const depths = choiceDepths(s);
  const choiceKeys = s.pages.filter((p) => p.kind === "choice").map((p) => p.key);
  const ds = choiceKeys.map((k) => depths.get(k)!);
  return new Set(ds).size === ds.length;
}

describe("template topologies are distinct", () => {
  it("adventure-trail is a single reconverging spine (no mid-branch, choices at distinct depths)", () => {
    const s = expandTemplate("adventure-trail", { ageBand: "8+", good: 3, surprise: 2 });
    expect(midBranchCount(s)).toBe(0);
    expect(choiceDepthsDistinct(s)).toBe(true);
  });

  it("two-paths-meet rejoins at a shared scene reached from both paths", () => {
    const s = expandTemplate("two-paths-meet", { ageBand: "5-7", good: 3, surprise: 1 });
    expect(maxIndegree(s)).toBeGreaterThanOrEqual(2); // a scene reached from both paths
    expect(midBranchCount(s)).toBe(0);
    expect(choiceDepthsDistinct(s)).toBe(false); // parallel choices on the two paths
  });

  it("twin-trails splits once into two disjoint trails", () => {
    const s = expandTemplate("twin-trails", { ageBand: "2-4", good: 2, surprise: 1 });
    expect(midBranchCount(s)).toBe(1);
  });

  it("branching-tree branches at more than one level", () => {
    for (const good of [3, 4]) {
      const s = expandTemplate("branching-tree", { ageBand: "8+", good, surprise: 2 });
      expect(midBranchCount(s)).toBeGreaterThanOrEqual(2);
    }
  });
});
