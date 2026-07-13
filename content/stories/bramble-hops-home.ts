// content/stories/bramble-hops-home.ts
import { defineStory } from "@bedtime-quests/core/stories/story-types";

export default defineStory({
  slug: "bramble-hops-home",
  title: "Bramble Hops Home",
  description:
    "A soft little bunny named Bramble hops home across a moonlit meadow, choosing the coziest way to bed.",
  ageBand: "2-4",
  coverMotif: "meadow",
  start: "meadow-edge",
  pages: {
    "meadow-edge": {
      body: "The moon rose big and round over the soft meadow. {{name}} and Bramble the bunny needed to hop home to bed. Two little paths curved through the grass. Which one, {{name}}?",
      choices: [
        { label: "🌼 Take the flower path", to: "flower-path" },
        { label: "🌾 Take the tall grass path", to: "grass-path" },
      ],
    },
    "flower-path": {
      body: "The flower path smelled like warm honey. Sleepy bees hummed a slow goodnight song. Should they stop and listen, {{name}}, or keep hopping home?",
      choices: [
        { label: "🎵 Listen to the sleepy bees", to: "bee-song" },
        { label: "🐇 Keep hopping home", to: "burrow" },
      ],
    },
    "grass-path": {
      body: "The tall grass tickled Bramble's soft ears. A little firefly floated up with a warm, glowing light. Which way should the light lead them, {{name}}?",
      choices: [
        { label: "✨ Follow the firefly home", to: "burrow" },
        { label: "🔄 Chase it round the meadow", to: "round-meadow" },
      ],
    },
    "bee-song": {
      body: "{{name}} and Bramble curled up in a patch of soft clover while the bees hummed. The song was so slow and warm that both of them drifted off, cozy and calm.",
      ending: "The Clover Bed",
      endingKind: "good",
    },
    "burrow": {
      body: "Home at last! Bramble's burrow was warm and round and full of soft blankets. {{name}} and Bramble snuggled deep and watched the stars through the little round door.",
      ending: "The Cozy Burrow",
      endingKind: "good",
    },
    "round-meadow": {
      body: "{{name}} and Bramble chased the firefly round and round the meadow, laughing, until they landed right back at the start with sleepy, happy feet. Let's try again!",
      ending: "The Giggly Loop",
      endingKind: "game_over",
    },
  },
});
