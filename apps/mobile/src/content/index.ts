// apps/mobile/src/content/index.ts
//
// The native app's story catalog. The web app loads stories from Postgres; there
// is no stories REST API yet (see README "Backend endpoints the native app still
// needs"), so for this UI port the app bundles the SAME authored content files
// the web app seeds its database from. One source of truth, no duplicated prose.
// Metro reaches these files via the workspace watchFolders in metro.config.js.
//
// When the stories API lands, swap this module for a fetch-backed repository that
// returns the same StoryInput[] shape; nothing downstream changes.
import type { StoryInput } from "@bedtime-quests/core/stories/story-types";

import beanWhisperingWoods from "../../../../content/stories/bean-whispering-woods";
import brambleHopsHome from "../../../../content/stories/bramble-hops-home";
import castleOfSlowHours from "../../../../content/stories/castle-of-slow-hours";
import cometSleepyPlanets from "../../../../content/stories/comet-sleepy-planets";
import dotTheTugboat from "../../../../content/stories/dot-the-tugboat";
import fernLanternWoods from "../../../../content/stories/fern-lantern-woods";
import moonGoodnightPost from "../../../../content/stories/moon-goodnight-post";
import owlWhoCountedStars from "../../../../content/stories/owl-who-counted-stars";
import pearlTidePools from "../../../../content/stories/pearl-tide-pools";
import starlightSail from "../../../../content/stories/starlight-sail";

// Ordered so the free samplers lead (they are the walkthrough entry points).
export const STORIES: StoryInput[] = [
  starlightSail,
  beanWhisperingWoods,
  moonGoodnightPost,
  owlWhoCountedStars,
  dotTheTugboat,
  pearlTidePools,
  fernLanternWoods,
  brambleHopsHome,
  cometSleepyPlanets,
  castleOfSlowHours,
];

export function getStoryInput(slug: string): StoryInput | undefined {
  return STORIES.find((s) => s.slug === slug);
}

/** A story is premium unless it explicitly opts out (`premium: false`), matching the web default. */
export function isPremium(story: StoryInput): boolean {
  return story.premium !== false;
}
