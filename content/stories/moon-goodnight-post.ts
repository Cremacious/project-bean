// content/stories/moon-goodnight-post.ts
import { defineStory } from "./_story-types";

export default defineStory({
  slug: "moon-goodnight-post",
  title: "The Moon's Goodnight Post",
  description:
    "A little moth delivers goodnight letters across the sleepy rooftops of town before the last stars close their eyes.",
  ageBand: "5-7",
  coverMotif: "night",
  start: "post-window",
  pages: {
    "post-window": {
      body: "The moon leaned close to {{name}}'s window with a soft, silver smile. In its light waited a little stack of goodnight letters, and Moth, who carried them on quiet wings. Every sleepy house in town was waiting for one. Where should the first letter go, {{name}}?",
      choices: [
        { label: "🏠 Along the chimney rooftops", to: "chimney-row" },
        { label: "🕰️ Up to the old clock tower", to: "clock-tower" },
      ],
    },
    "chimney-row": {
      body: "The chimneys stood in a cozy row, each one puffing slow, warm smoke that smelled like cocoa. Moth fluttered from cap to cap while {{name}} read the addresses by moonlight. One letter was for the baker, fast asleep. Which way, {{name}}?",
      choices: [
        { label: "🥐 Down to the baker's loft", to: "baker-loft" },
        { label: "🔁 Take the long way round town", to: "round-and-back" },
      ],
    },
    "clock-tower": {
      body: "The old clock tower ticked so softly it sounded like a lullaby. From the top, the whole town glittered, small and sleepy. Moth landed on the big hand to rest. Which rooftop next, {{name}}?",
      choices: [
        { label: "🏚️ Across the gabled roofs", to: "gable-path" },
        { label: "⭐ Out to the star balcony", to: "star-balcony" },
      ],
    },
    "gable-path": {
      body: "The gabled roofs rose and fell like gentle hills of slate. {{name}} and Moth hopped from peak to peak, dropping a letter down each warm chimney. Two last houses glowed ahead. Which one, {{name}}?",
      choices: [
        { label: "🥐 The baker's loft", to: "baker-loft" },
        { label: "🌙 The little moon porch", to: "moon-porch" },
      ],
    },
    "baker-loft": {
      body: "In the baker's loft the air was warm with the smell of soft bread and cinnamon. Moth slipped the letter under a snug little door. Inside, a lamp glowed low and kind. Where should {{name}} and Moth rest?",
      choices: [
        { label: "🍞 By the warm kitchen stove", to: "warm-kitchen" },
        { label: "🧵 Up in the quilt attic", to: "quilt-attic" },
      ],
    },
    "star-balcony": {
      body: "The star balcony hung high above the town, draped in twinkling lights. The stars were beginning to yawn and dim, one by one. Moth delivered the last few letters with a happy flutter. Which cozy spot, {{name}}?",
      choices: [
        { label: "🧵 The quilt attic", to: "quilt-attic" },
        { label: "🌙 The little moon porch", to: "moon-porch" },
      ],
    },
    "warm-kitchen": {
      body: "By the baker's stove it was toasty and golden, and a cup of warm milk waited on the table. {{name}} and Moth curled up on a soft cushion as the last letter floated home. The whole town was tucked in, and so were they.",
      ending: "The Warm Kitchen",
      endingKind: "good",
    },
    "quilt-attic": {
      body: "The attic was a soft mountain of quilts, every one a different sleepy color. Moth settled on a pillow and {{name}} sank in deep. Through the little window, the moon watched over the whole quiet town, warm and glad and calm.",
      ending: "The Quilt Attic",
      endingKind: "good",
    },
    "moon-porch": {
      body: "The little moon porch faced right up at the smiling moon. Every letter was delivered now, and the town breathed slow and easy. {{name}} and Moth lay back on a woven blanket as the moon hummed a soft goodnight.",
      ending: "The Moon Porch",
      endingKind: "good",
    },
    "round-and-back": {
      body: "The long way round looped past every sleepy chimney twice, and {{name}} and Moth got so cozy in the warm smoke that they drifted right back to the window where they began. Let's try again!",
      ending: "The Long Way Round",
      endingKind: "game_over",
    },
  },
});
