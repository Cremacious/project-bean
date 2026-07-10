// content/stories/castle-of-slow-hours.ts
import { defineStory } from "./_story-types";

export default defineStory({
  slug: "castle-of-slow-hours",
  title: "The Castle of Slow Hours",
  description:
    "A gentle night keeper and a ring of little keys help a whole castle wind down, one quiet room at a time.",
  ageBand: "8+",
  coverMotif: "castle",
  start: "great-hall",
  pages: {
    "great-hall": {
      body: "The great hall of the castle was hushed and golden, lit by one last row of candles. {{name}} and Wren the night keeper carried a ring of little brass keys, for tonight it was their job to help the whole castle settle into sleep. Wren always said the trick was to go slowly, one quiet room at a time. Three tall doors waited, {{name}}. Where should the settling begin?",
      choices: [
        { label: "🕯️ Up the lantern stair", to: "lantern-stair" },
        { label: "🔥 Into the kitchen by the hearth", to: "kitchen-hearth" },
        { label: "⚙️ Through the old clockwork gate", to: "clockwork-gate" },
      ],
    },
    "lantern-stair": {
      body: "The lantern stair spiraled up and up, each step lit by a small warm flame that {{name}} gently blew out along the way. The higher they climbed, the softer the world became, until even their footsteps seemed to tiptoe. At the top the stair split in two. Which way, {{name}}?",
      choices: [
        { label: "🔭 Toward the star tower", to: "star-tower" },
        { label: "🦉 Toward the owl roost", to: "owl-roost" },
      ],
    },
    "kitchen-hearth": {
      body: "In the castle kitchen the great hearth glowed low and orange, and a pot of something sweet still breathed a curl of steam. Wren banked the coals so they would keep the room warm all night. {{name}} helped hang the ladles in their sleepy row. Where next?",
      choices: [
        { label: "☕ Into the cocoa pantry", to: "cocoa-pantry" },
        { label: "🌙 Out to the moon terrace", to: "moon-terrace" },
      ],
    },
    "clockwork-gate": {
      body: "The old clockwork gate was a wall of slow, turning gears that kept the castle's gentle time. Wren showed {{name}} the little lever that made the whole works tick softer, so the night could stretch long and calm. The gears yawned as they slowed. Which passage now, {{name}}?",
      choices: [
        { label: "🌙 Up to the moon terrace", to: "moon-terrace" },
        { label: "🌀 Down the echoing hall", to: "echo-loop" },
      ],
    },
    "star-tower": {
      body: "The star tower opened to a wide, dark sky brimming with stars, so many that {{name}} lost count and did not mind at all. Wren pointed out the quiet ones near the edge, the sleepy stars that always go to bed first. A little door and a little ladder waited. Which, {{name}}?",
      choices: [
        { label: "🔭 Into the round observatory", to: "observatory" },
        { label: "🌀 Up the dizzy spiral stair", to: "dizzy-spiral" },
      ],
    },
    "owl-roost": {
      body: "The owl roost was tucked under the eaves, soft with feathers and warm with the slow breath of sleeping owls. One old owl blinked at {{name}} and Wren, then tucked its head back down. Everything here already knew how to rest. Where should {{name}} go?",
      choices: [
        { label: "🪶 To the feather nook", to: "feather-nook" },
        { label: "🔭 Over to the observatory", to: "observatory" },
      ],
    },
    "cocoa-pantry": {
      body: "The cocoa pantry smelled of chocolate and cinnamon and old, kind wood. Wren poured two small cups, just warm enough to hold, and {{name}} breathed in the sweet steam. Sleep felt very close now. Which cozy place calls, {{name}}?",
      choices: [
        { label: "🔥 Back to the glowing hearth", to: "hearth-rest" },
        { label: "🪶 Up to the feather nook", to: "feather-nook" },
      ],
    },
    "moon-terrace": {
      body: "The moon terrace was open to the night, and the moon sat so low and round that it seemed {{name}} could reach up and pat it goodnight. The whole sleeping castle spread out below, dark and safe. Wren yawned. Which way to rest, {{name}}?",
      choices: [
        { label: "🔭 In to the observatory", to: "observatory" },
        { label: "🌀 Round the echoing hall", to: "echo-loop" },
      ],
    },
    "observatory": {
      body: "The round observatory held one great, kind telescope and a floor of soft cushions. {{name}} and Wren lay back and watched the sleepy stars drift by, slow as a lullaby. One by one the little flames of the castle had gone out, and now only the stars kept watch. {{name}} felt the whole slow night wrap around like a blanket, and sleep came gently.",
      ending: "The Quiet Observatory",
      endingKind: "good",
    },
    "feather-nook": {
      body: "The feather nook was the softest place in the whole castle, piled high with down and warm wool. {{name}} and Wren sank in together while the owls breathed slow above. Far below, every room was dark and calm now, each one tucked in for the night. There was nothing left to do but rest, and that felt just right.",
      ending: "The Feather Nook",
      endingKind: "good",
    },
    "hearth-rest": {
      body: "Back by the great hearth, the coals glowed like sleepy embers of the sun. {{name}} and Wren settled into two deep chairs with a soft blanket across their knees. The castle was quiet from tower to cellar, warm and safe and slow. {{name}} watched the last spark wink goodnight and drifted off, cozy to the bone.",
      ending: "The Glowing Hearth",
      endingKind: "good",
    },
    "dizzy-spiral": {
      body: "The dizzy spiral stair went up and up and somehow round and back, past the same three friendly gargoyles twice, until {{name}} and Wren laughed and found themselves right where they began. Let's try again!",
      ending: "The Winding Stair",
      endingKind: "game_over",
    },
    "echo-loop": {
      body: "The echoing hall caught every soft giggle and sent it bouncing back, hello, hello, hello, and following the echoes led {{name}} and Wren in a big gentle loop to the start. Let's try again!",
      ending: "The Echoing Hall",
      endingKind: "game_over",
    },
  },
});
