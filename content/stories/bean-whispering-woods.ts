// content/stories/bean-whispering-woods.ts
import { defineStory } from "./_story-types";

export default defineStory({
  slug: "bean-whispering-woods",
  title: "Bean and the Whispering Woods",
  description: "A little bear explores a magical forest and chooses a path together with a new friend.",
  ageBand: "2-4",
  start: "forest-edge",
  pages: {
    "forest-edge": {
      body: "{{name}} and Bean the little bear stood at the edge of the dark, whispering woods. The trees seemed to hum a soft song just for them. What should they do?",
      choices: [
        { label: "🌲 Step into the woods", to: "deep-woods" },
        { label: "🏡 Go back home", to: "cozy-home" },
      ],
    },
    "deep-woods": {
      body: "Inside the woods, moonlight sparkled on the leaves. {{name}} and Bean heard a tiny voice say, \"Hello!\" It was a little firefly named Glimmer.",
      choices: [
        { label: "👋 Say hello to Glimmer", to: "glimmer-friend" },
        { label: "🍄 Follow the glowing mushrooms", to: "mushroom-path" },
        { label: "🦉 Follow the big owl", to: "owl-mixup" },
      ],
    },
    "owl-mixup": {
      body: "The owl led {{name}} in a big sleepy circle, right back to the start. Let's try again!",
      ending: "The Sleepy Mix Up",
      endingKind: "game_over",
    },
    "mushroom-path": {
      body: "The glowing mushrooms led {{name}} and Bean to a warm little clearing where Glimmer was waiting with a picnic of honey and berries.",
      choices: [{ label: "🧺 Join the picnic", to: "glimmer-friend" }],
    },
    "glimmer-friend": {
      body: "{{name}}, Bean, and Glimmer became the best of friends. They watched the stars together until it was time to float home on a happy dream.",
      ending: "The Friendly Ending",
    },
    "cozy-home": {
      body: "{{name}} and Bean decided the woods could wait for another day. They curled up by the fire with warm cocoa and a favorite blanket.",
      ending: "The Snug Ending",
    },
  },
});
