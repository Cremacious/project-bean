// content/stories/starlight-sail.ts
import { defineStory } from "./_story-types";

export default defineStory({
  slug: "starlight-sail",
  title: "Pip and the Starlight Sea",
  description:
    "A little paper boat named Pip sails a sea of shiny stars, looking for the coziest place to fall asleep.",
  ageBand: "2-4",
  coverMotif: "ocean",
  start: "harbor",
  premium: false, // free sampler for ages 2 to 4 (issue #34)
  pages: {
    "harbor": {
      body: "{{name}} climbed aboard Pip, a little paper boat with a brave flag. Together they floated onto a calm sea full of shiny stars. Which way should they sail tonight, {{name}}?",
      choices: [
        { label: "🏝️ Sail to the cozy island", to: "island" },
        { label: "🌙 Sail out toward the big moon", to: "open-sea" },
        { label: "🌊 Bob along with the waves", to: "wave-loop" },
      ],
    },
    "wave-loop": {
      body: "Pip bobbed along with the rolling waves, up and down, up and down, until the gentle water carried {{name}} and Pip in a big sleepy circle right back to the harbor. Let's try again!",
      ending: "The Sleepy Waves",
      endingKind: "game_over",
    },
    "island": {
      body: "Pip's flag fluttered as they reached a warm little island of soft, sleepy sand. Tiny crabs had built a pillow fort and waved {{name}} inside. Everyone snuggled down while the waves sang a slow, gentle song.",
      ending: "The Cozy Island",
      endingKind: "good",
    },
    "open-sea": {
      body: "Out on the open water the stars grew big and bright. {{name}} spotted two friendly lights ahead. One was the round golden moon. The other was a little lighthouse blinking hello.",
      choices: [
        { label: "🌙 Row up to the smiling moon", to: "moon" },
        { label: "💡 Visit the blinking lighthouse", to: "lighthouse" },
      ],
    },
    "moon": {
      body: "Pip and {{name}} floated all the way up to the moon, who tucked them into a hammock of soft moonbeams. The moon hummed a cozy lullaby until {{name}} felt happy and sleepy.",
      ending: "The Moon's Lullaby",
      endingKind: "good",
    },
    "lighthouse": {
      body: "The lighthouse keeper was a kind old owl who welcomed {{name}} in for warm cocoa. From the tall window they watched every star wink goodnight, safe and snug and sleepy.",
      ending: "The Lighthouse of Dreams",
      endingKind: "good",
    },
  },
});
