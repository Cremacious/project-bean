// content/stories/dot-the-tugboat.ts
import { defineStory } from "@bedtime-quests/core/stories/story-types";

export default defineStory({
  slug: "dot-the-tugboat",
  title: "Dot the Little Tugboat",
  description:
    "A friendly little tugboat named Dot helps two sleepy boats find their way home across a calm, starry harbor.",
  ageBand: "2-4",
  coverMotif: "ocean",
  start: "harbor",
  pages: {
    "harbor": {
      body: "{{name}} and Dot the little tugboat puttered onto the calm, sleepy harbor. Two boats out on the water yawned. They could not find their way to bed. Which one should Dot help first, {{name}}?",
      choices: [
        { label: "⛵ Help the little sailboat", to: "sailboat" },
        { label: "🚣 Row to the foggy cove", to: "cove" },
      ],
    },
    "sailboat": {
      body: "The sailboat's sail drooped like a sleepy eyelid. {{name}} and Dot tied a soft rope and gave a gentle pull. Should they tow it home, or rock it right here?",
      choices: [
        { label: "🛟 Tow it to the cozy docks", to: "docks-good" },
        { label: "🌀 Spin in happy circles", to: "circle-surprise" },
      ],
    },
    "cove": {
      body: "In the foggy cove the water was still and silver. A tiny fishing boat blinked its little lamp, hello. {{name}} and Dot puttered close. Which way now?",
      choices: [
        { label: "🌙 Follow the moon to the mooring", to: "moon-good" },
        { label: "🌀 Spin in happy circles", to: "circle-surprise" },
      ],
    },
    "docks-good": {
      body: "Dot nudged the sailboat into its snug little slip. The water rocked them both, slow and soft. {{name}} and Dot yawned a big, happy yawn and settled in for the night.",
      ending: "The Snug Docks",
      endingKind: "good",
    },
    "moon-good": {
      body: "The moon laid a path of gold across the water, straight to a quiet mooring. {{name}}, Dot, and the little fishing boat bobbed there together, warm and calm and ready for sleep.",
      ending: "The Moonlit Mooring",
      endingKind: "good",
    },
    "circle-surprise": {
      body: "{{name}} and Dot spun round and round, giggling at the splashy waves, until they were right back where they started. Let's try again!",
      ending: "The Silly Spin",
      endingKind: "game_over",
    },
  },
});
