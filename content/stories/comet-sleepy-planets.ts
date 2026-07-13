// content/stories/comet-sleepy-planets.ts
import { defineStory } from "@bedtime-quests/core/stories/story-types";

export default defineStory({
  slug: "comet-sleepy-planets",
  title: "Comet and the Sleepy Planets",
  description:
    "A small friendly robot named Comet charts a slow, gentle path home past the drowsy planets to a warm bunk.",
  ageBand: "8+",
  coverMotif: "space",
  start: "launch-pad",
  pages: {
    "launch-pad": {
      body: "The little launch pad glowed at the edge of a calm, dark sky. {{name}} and Comet, a small round robot with a friendly blinking light, climbed into their cozy ship for the long, slow trip home to bed. Comet had drawn a map of sleepy planets, each one a good place to say goodnight along the way. Three soft paths curved off into the stars. Which one first, {{name}}?",
      choices: [
        { label: "🔵 Toward the blue planet", to: "blue-planet" },
        { label: "🔴 Toward the red planet", to: "red-planet" },
        { label: "☄️ Along the comet trail", to: "comet-trail" },
      ],
    },
    "blue-planet": {
      body: "The blue planet turned below them, slow and gentle, wrapped in swirls of soft white cloud. It was an ocean world, and even from up high {{name}} could hear the faraway hush of its waves. Comet beeped a happy, sleepy beep. Where should they drift next?",
      choices: [
        { label: "🌘 To the little moon station", to: "moon-station" },
        { label: "🪐 Into the asteroid garden", to: "asteroid-garden" },
      ],
    },
    "red-planet": {
      body: "The red planet was warm and rusty and quiet, with tall canyons full of long evening shadows. A soft dust floated by like slow snow. Comet dimmed the ship's lights to match the calm. Which way now, {{name}}?",
      choices: [
        { label: "🪐 Into the asteroid garden", to: "asteroid-garden" },
        { label: "🔁 Loop once around the red moon", to: "loop-orbit" },
      ],
    },
    "comet-trail": {
      body: "The comet trail was a river of tiny glittering ice, and the ship coasted along it without a sound. {{name}} trailed a hand along the window as the sparkles drifted past. Comet hummed the tune it always hummed at bedtime. Two calm lights waited ahead. Which, {{name}}?",
      choices: [
        { label: "🌫️ Toward the giant cloud planet", to: "gas-giant" },
        { label: "⚓ Into the star harbor", to: "star-harbor" },
      ],
    },
    "moon-station": {
      body: "The little moon station was a warm bubble of light on a quiet grey moon. Inside, small windows glowed like honey, and everything floated slow and soft. Comet clicked the ship into its gentle dock. Where should {{name}} rest?",
      choices: [
        { label: "🛏️ In the warm bunk", to: "warm-bunk" },
        { label: "☁️ In the cloud cradle", to: "cloud-cradle" },
      ],
    },
    "asteroid-garden": {
      body: "The asteroid garden drifted by like a field of slow grey stones, and tiny lights blinked on each one, as if the rocks were yawning awake just to say goodnight. Comet steered the ship through with the softest of nudges. Which way, {{name}}?",
      choices: [
        { label: "☁️ Down to the cloud cradle", to: "cloud-cradle" },
        { label: "🌀 Weave through the tumbling rocks", to: "star-shuffle" },
      ],
    },
    "gas-giant": {
      body: "The giant cloud planet filled the whole window, striped in soft creams and golds and turning slower than anything {{name}} had ever seen. Around it swept a wide, shining ring. Comet gave a long, contented whirr. Where to, {{name}}?",
      choices: [
        { label: "💫 Up into the ring hammock", to: "ring-hammock" },
        { label: "🔁 Once around the great planet", to: "loop-orbit" },
      ],
    },
    "star-harbor": {
      body: "The star harbor was a quiet dock among the stars, where sleepy little ships were moored and glowing dim. It felt like the end of a long, good day. Comet eased them in beside the others. Which berth, {{name}}?",
      choices: [
        { label: "🛏️ To the warm bunk", to: "warm-bunk" },
        { label: "💫 To the ring hammock", to: "ring-hammock" },
      ],
    },
    "warm-bunk": {
      body: "The warm bunk was small and snug, with a round window looking out at the whole calm galaxy. {{name}} and Comet tucked in under a heavy, soft blanket, and Comet's little light faded to a sleepy glow. Far off, the planets turned slow and quiet in the dark. {{name}} had made it home, and home was warm, and it was time to sleep.",
      ending: "The Warm Bunk",
      endingKind: "good",
    },
    "cloud-cradle": {
      body: "The cloud cradle rocked in a soft pocket of the moon station, gentle as a boat on still water. {{name}} sank into it while Comet powered down to a low, kind hum. Through the window the stars drifted by like slow snow that never landed. Everything was calm now, and calm was exactly enough.",
      ending: "The Cloud Cradle",
      endingKind: "good",
    },
    "ring-hammock": {
      body: "Up in the great planet's ring, the ship hung in a hammock of shining dust, swaying ever so slightly. {{name}} and Comet lay back and watched the wide gold planet turn below, slow and grand and quiet. The whole sky felt like one enormous, gentle goodnight. {{name}}'s eyes grew heavy, and that was just fine.",
      ending: "The Ring Hammock",
      endingKind: "good",
    },
    "loop-orbit": {
      body: "The ship swung once around the little moon, then somehow twice, then round again, looping past the same three friendly stars until {{name}} and Comet laughed and coasted right back to the start of the map. Let's try again!",
      ending: "The Long Loop",
      endingKind: "game_over",
    },
    "star-shuffle": {
      body: "Weaving through the tumbling rocks was so much fun that {{name}} and Comet took a wrong, wobbly turn, and the ship shuffled gently back to where the journey began, no harm done. Let's try again!",
      ending: "The Star Shuffle",
      endingKind: "game_over",
    },
  },
});
