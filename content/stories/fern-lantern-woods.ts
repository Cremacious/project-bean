// content/stories/fern-lantern-woods.ts
import { defineStory } from "./_story-types";

export default defineStory({
  slug: "fern-lantern-woods",
  title: "Fern and the Lantern Woods",
  description:
    "Fern the fox carries a warm lantern through the whispering woods to light the way to a cozy place to sleep.",
  ageBand: "5-7",
  coverMotif: "forest",
  start: "woods-gate",
  pages: {
    "woods-gate": {
      body: "{{name}} and Fern the fox stood at the gate of the Lantern Woods, where the trees leaned close and hummed a low, sleepy tune. Fern held up a small warm lantern, and its glow turned the path golden. Two ways opened ahead. Which should the lantern light first, {{name}}?",
      choices: [
        { label: "🌿 Take the soft mossy fork", to: "mossy-fork" },
        { label: "🌉 Cross the little stone bridge", to: "stone-bridge" },
      ],
    },
    "mossy-fork": {
      body: "The mossy fork was springy and quiet under their feet. Somewhere close, water trickled, and mushrooms glowed like tiny lamps. Fern's ears turned three ways at once. Which sound should they follow, {{name}}?",
      choices: [
        { label: "🍄 Follow the glowing mushrooms", to: "glow-mushrooms" },
        { label: "💧 Follow the sleepy stream", to: "sleepy-stream" },
        { label: "🦉 Follow the hooting owl", to: "owl-hollow" },
      ],
    },
    "stone-bridge": {
      body: "The little stone bridge arched over a stream that whispered goodnight to the stones. On the far side, the lantern lit up two friendly sights. {{name}} and Fern stepped across together. Where to now?",
      choices: [
        { label: "💧 Down to the sleepy stream", to: "sleepy-stream" },
        { label: "✨ Out to the firefly meadow", to: "firefly-meadow" },
      ],
    },
    "glow-mushrooms": {
      body: "The mushrooms lit a ring of soft light, and the air smelled like rain and pine. Fern's lantern swung gently, showing two cozy doorways in the roots of a great old tree. Which one calls to you, {{name}}?",
      choices: [
        { label: "🦊 Into Fern's warm den", to: "fox-den" },
        { label: "🏮 Up to the lantern tree", to: "lantern-tree" },
      ],
    },
    "sleepy-stream": {
      body: "The stream was slow and silver and sang a tune with no words. {{name}} and Fern followed it, lantern glowing, until the path split by a mossy log. Which turn feels sleepiest, {{name}}?",
      choices: [
        { label: "🏮 Toward the lantern tree", to: "lantern-tree" },
        { label: "🦉 Toward the owl's hollow", to: "owl-hollow" },
      ],
    },
    "firefly-meadow": {
      body: "The meadow was full of fireflies, blinking like slow, gentle stars. Fern set the lantern down and the fireflies gathered close, curious and kind. Where should they rest, {{name}}?",
      choices: [
        { label: "⭐ In the star clearing", to: "star-clearing" },
        { label: "🦊 Back to Fern's warm den", to: "fox-den" },
      ],
    },
    "owl-hollow": {
      body: "A round owl blinked down from its hollow and hooted a slow, happy hoo. It led {{name}} and Fern on a big, looping circle through the ferns, round and round, until they were right back at the gate. Let's try again!",
      ending: "The Owl's Big Circle",
      endingKind: "game_over",
    },
    "fox-den": {
      body: "Fern's den was round and warm, lined with soft leaves and a blanket the color of autumn. {{name}} and Fern hung the little lantern on a root, where it glowed like a tiny moon. They snuggled down as the woods breathed slow and quiet, ready for sleep.",
      ending: "Fern's Cozy Den",
      endingKind: "good",
    },
    "lantern-tree": {
      body: "High in the great old tree was a snug little room, and Fern's lantern lit it up all gold and glowing. {{name}} and Fern watched the woods sway softly below, safe and high and sleepy. One by one the humming trees hushed for the night.",
      ending: "The Lantern Tree",
      endingKind: "good",
    },
    "star-clearing": {
      body: "In the clearing the trees opened to a sky full of stars, and the fireflies rose up to join them. {{name}} and Fern lay back on the soft grass with the lantern glowing beside them. The whole quiet forest tucked itself in, and so did they.",
      ending: "The Star Clearing",
      endingKind: "good",
    },
  },
});
