// content/stories/pearl-tide-pools.ts
import { defineStory } from "./_story-types";

export default defineStory({
  slug: "pearl-tide-pools",
  title: "Pearl and the Glowing Tide Pools",
  description:
    "Pearl the seal explores the glowing tide pools by moonlight, looking for the softest place to curl up and nap.",
  ageBand: "5-7",
  coverMotif: "ocean",
  start: "quiet-shore",
  pages: {
    "quiet-shore": {
      body: "The tide had slipped out, and the quiet shore was dotted with little pools that glowed a soft, pale blue. {{name}} and Pearl the seal flopped along the cool wet sand, looking for the softest place to nap. Two paths curved along the shore. Which way, {{name}}?",
      choices: [
        { label: "🪨 Along the rocky ledge", to: "rocky-ledge" },
        { label: "🌿 Into the kelp cove", to: "kelp-cove" },
      ],
    },
    "rocky-ledge": {
      body: "The rocky ledge was smooth and cool, and every pool along it shone like a little lamp. Pearl slid from pool to pool with a happy splash. Tiny crabs waved their claws hello. Where should they look, {{name}}?",
      choices: [
        { label: "💙 Into the glowing pool", to: "glow-pool" },
        { label: "⭐ Onto the starfish step", to: "starfish-step" },
        { label: "🌀 Slide back down the ledge", to: "tumble-back" },
      ],
    },
    "kelp-cove": {
      body: "In the kelp cove the long green ribbons swayed like a slow, sleepy dance. The water was warm and still, and it smelled of salt and moonlight. Pearl nosed gently through the leaves. Which way now, {{name}}?",
      choices: [
        { label: "⭐ Up to the starfish step", to: "starfish-step" },
        { label: "🌙 Out to the moon lagoon", to: "moon-lagoon" },
      ],
    },
    "glow-pool": {
      body: "The glowing pool was full of light, as if it had caught a piece of the moon. Little fish drifted by, calm and slow. {{name}} and Pearl peered in and saw two soft, sandy beds below. Which looks cozier, {{name}}?",
      choices: [
        { label: "🐚 The seashell bed", to: "seashell-bed" },
        { label: "🌾 The swaying sea garden", to: "sea-garden" },
      ],
    },
    "starfish-step": {
      body: "On the starfish step, a friendly orange starfish stretched out one slow arm, then another, getting ready for sleep. Pearl yawned a big, whiskery yawn. Two calm places waited nearby. Where to, {{name}}?",
      choices: [
        { label: "🌾 The swaying sea garden", to: "sea-garden" },
        { label: "🌙 The quiet moon lagoon", to: "moon-lagoon" },
      ],
    },
    "moon-lagoon": {
      body: "The moon lagoon was round and still and held the whole moon on its surface. {{name}} and Pearl floated in the warm shallows, rocking softly. Two snug spots glowed at the water's edge. Which one, {{name}}?",
      choices: [
        { label: "🦪 Pearl's little nook", to: "pearl-nook" },
        { label: "🐚 The seashell bed", to: "seashell-bed" },
      ],
    },
    "seashell-bed": {
      body: "The seashell bed was lined with smooth pink shells, cool and soft as a whisper. {{name}} and Pearl nestled in while the little pools glowed all around them like nightlights. The waves hushed far away, and their eyes grew heavy and calm.",
      ending: "The Seashell Bed",
      endingKind: "good",
    },
    "sea-garden": {
      body: "The sea garden swayed in slow, gentle waves, tucking {{name}} and Pearl in with soft green ribbons. The glowing pools dimmed to a sleepy shimmer. Everything rocked, slow and warm, until the whole shore felt like one big lullaby.",
      ending: "The Swaying Garden",
      endingKind: "good",
    },
    "pearl-nook": {
      body: "Pearl's little nook was a cozy hollow in the rock, just big enough for two. {{name}} and Pearl curled up nose to flipper as the moon lagoon glowed below. The tide sang its softest song, and sleep came easy and warm.",
      ending: "Pearl's Cozy Nook",
      endingKind: "good",
    },
    "tumble-back": {
      body: "Pearl slid down the smooth ledge with a joyful splash, and {{name}} slid right after, laughing all the way back to the start of the shore. Let's try again!",
      ending: "The Splashy Slide",
      endingKind: "game_over",
    },
  },
});
