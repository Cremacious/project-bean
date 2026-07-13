// packages/core/src/stories/from-input.ts
//
// Pure adapter: turn an authored StoryInput (the `defineStory` shape in
// content/stories/*) into the runtime StoryGraph the reader consumes. The web
// app builds the same StoryGraph from flat database rows via buildStoryGraph;
// this builds it straight from the authored object, so a platform that ships the
// content files (the Expo app today, an admin preview tomorrow) can drive the
// exact same reader without a database. Kept in core because it is platform
// agnostic: no DOM, React, Next, React Native, or DB imports.
import type { StoryInput } from "./story-types";
import type { StoryGraph, GraphPage } from "./graph";

/**
 * A StoryGraph plus the resolved start page key, built from one authored story.
 *
 * Page ids are assigned by authored order (1-based) and are stable for a given
 * story object, which is what the gameplay progress model needs to remember
 * which endings a reader has found. They are only unique WITHIN a story; a
 * consumer tracking progress across several stories should namespace by slug.
 */
export type BuiltStory = {
  graph: StoryGraph;
  startKey: string;
  /** The synthetic page id assigned to each page key, for progress tracking. */
  idByKey: Record<string, number>;
};

export function graphFromStoryInput(story: StoryInput): BuiltStory {
  const keys = Object.keys(story.pages);
  const idByKey: Record<string, number> = {};
  keys.forEach((key, i) => {
    idByKey[key] = i + 1;
  });

  const graph: StoryGraph = { pages: {}, totalEndings: 0, goodEndings: 0 };

  for (const key of keys) {
    const p = story.pages[key];
    const isEnding = p.ending !== undefined;
    // endingKind defaults to "good" when a page is an ending (mirrors the
    // authoring contract in story-types.ts and the DB default in the web app).
    const endingType = isEnding ? p.endingKind ?? "good" : "good";
    const gp: GraphPage = {
      id: idByKey[key],
      key,
      body: p.body,
      imageUrl: p.imageUrl ?? null,
      isEnding,
      endingLabel: isEnding ? p.ending ?? null : null,
      endingType,
      choices: (p.choices ?? []).map((c) => ({ label: c.label, to: c.to })),
    };
    graph.pages[key] = gp;
    if (isEnding) {
      graph.totalEndings += 1;
      if (endingType === "good") graph.goodEndings += 1;
    }
  }

  const startKey = story.start in graph.pages ? story.start : keys[0];
  return { graph, startKey, idByKey };
}
