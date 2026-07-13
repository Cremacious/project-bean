// content/stories/owl-who-counted-stars.ts
import { defineStory } from "@bedtime-quests/core/stories/story-types";

export default defineStory({
  slug: "owl-who-counted-stars",
  title: "The Owl Who Counted Stars",
  description:
    "Sage the wise old owl counts the last stars of the night and tucks the whole forest in, one creature at a time.",
  ageBand: "8+",
  coverMotif: "forest",
  start: "forest-clearing",
  premium: false, // free sampler for ages 8 and up (issue #34)
  pages: {
    "forest-clearing": {
      body: "Every night, when the sky went deep and blue, Sage the wise old owl counted the last stars to make sure they were all safely lit, and tucked the whole forest in for sleep. Tonight Sage had asked {{name}} to help. From the mossy clearing, three quiet trails wound off into the trees, and every creature along them was waiting to be wished goodnight. Where should the two of you begin, {{name}}?",
      choices: [
        { label: "🌿 Down the willow path", to: "willow-path" },
        { label: "🌊 Along the river bend", to: "river-bend" },
        { label: "🌲 Up the pine rise", to: "pine-rise" },
      ],
    },
    "willow-path": {
      body: "The willow path was soft and green, and the long willow branches trailed down like sleepy curtains. {{name}} and Sage brushed through them gently, and each willow gave a slow, rustling sigh, as if it were already half asleep. Two smaller trails split off ahead. Which way, {{name}}?",
      choices: [
        { label: "✨ Into the firefly hollow", to: "firefly-hollow" },
        { label: "🌰 Through the hazel thicket", to: "hazel-thicket" },
      ],
    },
    "river-bend": {
      body: "At the river bend the water moved slow and dark, carrying the reflection of a hundred little stars. Sage counted them softly on the water, one, two, three, and lost the count, and did not mind. A pair of gentle sounds drifted from downstream. Which should you follow, {{name}}?",
      choices: [
        { label: "🦦 To the otter bank", to: "otter-bank" },
        { label: "✨ To the firefly hollow", to: "firefly-hollow" },
      ],
    },
    "pine-rise": {
      body: "The pine rise climbed up through tall, whispering trees that smelled sharp and clean and green. Near the top the wind was soft, and the stars felt close enough to count on {{name}}'s fingers. Sage ruffled its feathers, ready for sleep. Which way now, {{name}}?",
      choices: [
        { label: "🌌 Out to the star meadow", to: "star-meadow" },
        { label: "🌀 Round the whirling pines", to: "whirl-around" },
      ],
    },
    "firefly-hollow": {
      body: "The firefly hollow glowed with hundreds of slow, drifting lights, each one blinking like a tiny star come down to rest. Sage told {{name}} that fireflies are the forest's own little lanterns, and that even lanterns must dim at night. The fireflies floated toward two mossy paths. Which, {{name}}?",
      choices: [
        { label: "🌳 To the great lullaby oak", to: "lullaby-oak" },
        { label: "🍃 Into the moss den", to: "moss-den" },
      ],
    },
    "otter-bank": {
      body: "On the otter bank a family of otters lay in a sleepy pile, paws linked so no one would drift away in the night. {{name}} and Sage wished them goodnight in the softest whisper, and the smallest otter yawned back. Two calm ways led on from here. Where to, {{name}}?",
      choices: [
        { label: "🪺 To the cozy river nest", to: "river-nest" },
        { label: "🌳 To the great lullaby oak", to: "lullaby-oak" },
      ],
    },
    "moss-den": {
      body: "The moss den was a hollow at the foot of an old tree, lined so thick with moss it felt like green velvet. It was warm inside, and quiet, and it smelled of rain and roots. Sage counted the last few stars through the doorway. Which cozy place, {{name}}?",
      choices: [
        { label: "🌳 The great lullaby oak", to: "lullaby-oak" },
        { label: "🪺 The cozy river nest", to: "river-nest" },
      ],
    },
    "star-meadow": {
      body: "The star meadow opened wide beneath the whole shining sky, and the grass was cool and soft and full of dew. Here {{name}} and Sage could see every single star at once, more than anyone could ever count. Sage smiled its slow owl smile. Where shall you rest, {{name}}?",
      choices: [
        { label: "⭐ Stay and count the stars", to: "star-count" },
        { label: "🪺 Slip back to the river nest", to: "river-nest" },
      ],
    },
    "hazel-thicket": {
      body: "The hazel thicket was a snug tangle of low branches heavy with sleepy leaves, and small night creatures rustled softly, settling in. {{name}} and Sage stepped through slow and careful, so as not to wake a single one. Two quiet ways opened past the leaves. Which, {{name}}?",
      choices: [
        { label: "🍃 Into the moss den", to: "moss-den" },
        { label: "🌌 Out to the star meadow", to: "star-meadow" },
      ],
    },
    "lullaby-oak": {
      body: "The great lullaby oak was the oldest tree in the forest, and its wide branches held nests and hollows and dozens of sleeping creatures, all breathing slow together. {{name}} and Sage settled into a soft crook of the trunk. Sage counted the last star, and it was lit, and everything was safe. The old oak swayed the whole forest gently to sleep, and {{name}} went along with it.",
      ending: "The Lullaby Oak",
      endingKind: "good",
    },
    "river-nest": {
      body: "The cozy river nest was woven of soft reeds right where the water sang its quietest song. {{name}} and Sage curled up as the river carried the starlight past, slow and shining. Every creature they had wished goodnight was sleeping now, and the whole forest breathed as one. {{name}} closed both eyes and let the river's lullaby carry the rest of the way.",
      ending: "The River Nest",
      endingKind: "good",
    },
    "star-count": {
      body: "Out in the star meadow {{name}} and Sage lay back in the cool grass and counted stars together, slower and slower, until the numbers turned soft and stopped meaning anything at all. Every star was lit. Every creature was tucked in. The forest was quiet from root to treetop, and the sky held them like a great, kind blanket, until sleep came for the counters too.",
      ending: "The Star Count",
      endingKind: "good",
    },
    "whirl-around": {
      body: "The whirling pines spun their soft shadows round and round, and following them made {{name}} and Sage so pleasantly dizzy that they wandered in a wide, giggly circle right back to the clearing. Let's try again!",
      ending: "The Whirling Pines",
      endingKind: "game_over",
    },
  },
});
