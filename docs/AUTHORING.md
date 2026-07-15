# Story authoring guide

This is the source of truth for how a Bedtime Quests story is written. Follow it and any new branching story will read consistently, personalize safely, and pass the builder's publish checks the first time.

Everything here matches how the app actually works today: the data model in `db/schema.ts`, the reader in `components/story/`, the personalization in `lib/stories/personalize.ts`, and the admin builder under `app/admin/` and `lib/admin-actions.ts`. Two seeded stories live in `content/stories/` and are used as real examples below.

> A note on the writing in this guide: it follows the same content rules it teaches, so you will not find a single dash of any kind in the prose. Identifiers that genuinely contain a hyphen (page keys, slugs, the age band code `2-4`, the enum `game_over`) are internal, never shown to a child, and always written `in code font`.

---

## 1. Anatomy of a story

A story is a small graph. Pages are the nodes. Choices are the arrows between them. The reader starts on one page, taps a choice, lands on the next page, and keeps going until they reach an ending.

A story has this shape:

| Part | What it is | Where it lives |
| --- | --- | --- |
| **Title** | The name a parent sees, like "Pip and the Starlight Sea" | `story.title` |
| **Slug** | The web address id, lowercase words joined by single hyphens, like `starlight-sail` | `story.slug` |
| **Description** | A short, cozy summary shown on the library card | `story.description` |
| **Age band** | One of `2-4`, `5-7`, `8+`, or none | `story.ageBand` |
| **Start page** | The page the reader opens on | `story.startPageId` |
| **Pages** | Each scene of the story, one per decision point or ending | `page` rows |
| **Choices** | The tappable options on a page, each pointing to another page | `choice` rows |
| **Endings** | Pages marked as an ending, either good or a surprise | `page.isEnding`, `page.endingType` |

### How the graph connects

Every page has a **page key**: a short lowercase id joined by single hyphens, like `forest-edge` or `deep-woods`. A choice does not store a link to another page directly. Instead it stores the **key** of the page it leads to (`choice.toPageKey`). That is how branching works: a choice on `forest-edge` with a destination of `deep-woods` sends the reader to the page whose key is `deep-woods`.

Because pages are joined by keys, order does not matter and a page can be reached from more than one place. In "Bean and the Whispering Woods", both the `deep-woods` page and the `mushroom-path` page send the reader to the same `glimmer-friend` page. Two paths, one shared scene. That is fine and often lovely.

A page is one of two kinds:

- A **decision page** has body text plus two or three choices. It must have at least one choice.
- An **ending page** has body text and no choices. It is where a path stops.

---

## 2. Endings

Endings are the heart of the experience. A child replays a story to discover the endings they have not found yet, so plan them with care.

### Two kinds of ending

Every ending has an `endingType`. There are exactly two:

- **Good ending** (`good`): a warm, happy finish. This is the reward. In the builder this button is labelled **Good ending**.
- **Surprise ending** (`game_over` in the data): a gentle, playful dead end that loops the reader back to try again. In the builder this button is labelled **Surprise ending**. Nowhere does a child see the words "game over".

### How each ending looks to the reader

A **good ending** shows a burst of confetti, a 🎉, the words "The End", and your **ending label** as the big headline (for example "The Moon's Lullaby"). Below that the child sees progress: "That's 2 of 3 good endings" with a row of dots, one filled for each good ending they have collected. When they find the last good ending, the headline becomes "You finished the whole story!" with extra confetti.

A **surprise ending** shows a friendly 🦉 owl, "The End", a soft headline "Oh no! Let's try again", and the line "Surprise ending found!" with a big **Try again** button. The ending label you write is stored but not shown on this screen, so a surprise ending is always warm and never a scolding.

### Ending labels

Give every ending a short, delightful **ending label**, even surprise ones (it is good practice and may be shown elsewhere later). Labels are title style and warm: "The Cozy Island", "The Friendly Ending", "The Sleepy Mix Up". Keep them under about six words and free of dashes.

### Counts and achievements

Only **good endings** count toward finishing a story. The reader's collection screen tracks:

- **Good endings found** out of the story's total good endings. Finding all of them marks the story complete.
- **Surprises found**: how many `game_over` endings the child has bumped into. These are a fun side count, not required for completion.

Badges the child can earn include First ending, First story finished, Found a surprise, and Collected them all. So a story with **zero good endings can never be completed** and should never ship. Always give a story at least one good ending, and ideally give it a small handful.

### How many endings, and how they should feel

- Aim for **two to four good endings** per story. That gives a real reason to replay without becoming a maze.
- Add **zero to two surprise endings**. They are optional seasoning, not the main course.
- Surprise endings must feel **gentle and silly**, never scary or punishing. A path that loops the child sleepily back to the start ("The owl led them in a big sleepy circle, right back to the start. Let's try again!") is perfect. Nothing frightening, nothing that feels like the child did something wrong.
- Every good ending should land on the same cozy, ready for sleep note. This is a bedtime app. Endings wind down, they do not rev up.

---

## 3. Name personalization

The app knows the child's **name** and nothing else. No age, no pronouns, no gender. Personalization is one simple token.

### The `{{name}}` token

Write `{{name}}` anywhere in a page body or a choice label and the reader swaps in the child's name everywhere it appears. In the builder, put your cursor where you want it and press the **Insert {{name}}** button.

```
{{name}} climbed aboard Pip, a little paper boat with a brave flag.
Which way should they sail tonight, {{name}}?
```

For a child named Ada this reads: "Ada climbed aboard Pip, a little paper boat with a brave flag. Which way should they sail tonight, Ada?"

You can use `{{name}}` in choice labels too, though it is used less often there. Use the token naturally, the way you would sprinkle a child's name into a story read aloud. Once or twice per page is warm. Every sentence is too much.

### The pronoun rule (hard requirement)

Because the app never knows the child's gender, you must **never write a pronoun or gendered word for the child**. No he, she, him, her, his, hers, they as the child, boy, girl. Write around them.

The reliable trick: pair the child with a companion character and let the plot move through the pair, or address the child directly as "you".

| Do not write | Write instead |
| --- | --- |
| She climbed aboard the boat | `{{name}}` climbed aboard the boat |
| He saw two lights ahead | `{{name}}` spotted two friendly lights ahead |
| They (the child) felt sleepy | `{{name}}` felt happy and sleepy |
| Give him a choice | Which way should they sail tonight, `{{name}}`? |

Note that "they" and "them" are fine when they refer to the **child plus a companion** ("`{{name}}` and Bean heard a tiny voice"). The rule is only about pronouns that stand in for the child alone.

---

## 4. Writing style rules

These are content rules. Some are hard requirements enforced across the whole app, some are craft. All of them are non negotiable for a story that ships.

### Hard rules

1. **No dashes of any kind in story text or choice labels.** No em dash, no en dash, no hyphen used as punctuation. Write "Ages 2 to 4", "game over", "try again", "a happy, sleepy ending". (Hyphens are allowed only inside internal page keys and slugs, which a child never sees.)
2. **High contrast, simple language.** The words are read aloud by a parent to a young child. Short, common, concrete words. Short sentences. Say what happens plainly.
3. **No pronouns for the child.** See section 3.

### Craft rules

4. **Keep pages short.** A page is one small scene: roughly one to four sentences. If a parent cannot read it in a breath or two, split it.
5. **Two or three choices per decision page.** One choice is not a decision. Four is too many taps for a sleepy child. Two is the sweet spot, three is fine.
6. **Warm bedtime tone throughout.** Cozy, kind, slow. Soft light, gentle songs, warm cocoa, snug blankets, floating home on a happy dream. Wind the child down toward sleep on every path.
7. **Make choices clear and different.** Each choice should promise a plainly different next scene. A friendly emoji at the start of a choice label helps a pre reader tell them apart ("🌙 Sail out toward the big moon").

### A short do and do not list

**Do**

- Write "Ages 2 to 4" and "game over" and "try again".
- Use `{{name}}` warmly, once or twice a page.
- Pair the child with a companion so the story flows without pronouns.
- End every path cozy and calm.
- Keep pages to a few short sentences.

**Do not**

- Use any dash in story copy or choice labels.
- Write he, she, they (for the child), him, her, boy, or girl.
- Write scary, tense, or punishing surprise endings.
- Cram a page with more than three choices.
- Leave a story with no good ending.

---

## 5. Age bands

A story may carry one age band, or none. The band sets expectations for tone, vocabulary, and length. The stored codes and the labels the reader sees are:

| Code | Shown to parents as | Feel |
| --- | --- | --- |
| `2-4` | Ages 2 to 4 | Toddlers |
| `5-7` | Ages 5 to 7 | Early readers |
| `8+` | Ages 8 and up | Confident readers |
| (none) | No age band | Fits any age |

How to shift the writing across bands:

- **Ages 2 to 4.** The simplest words, the shortest pages (one to two sentences), two choices per decision, lots of repetition and gentle rhythm. Both seeded stories sit here. Big friendly ideas: a boat, the moon, a bear, a firefly.
- **Ages 5 to 7.** Slightly longer pages (two to four sentences), richer words, two or three choices, a little more of a mini adventure before the cozy landing. Still no scary stakes.
- **Ages 8 and up.** Fuller scenes and a bit more plot, more branching, a wider vocabulary, and endings that can carry a small gentle idea to think about. Keep it calm and bedtime shaped even as it grows more capable.

Whatever the band, the bedtime tone and the three hard rules never change.

---

## 6. Building a story in the admin builder, step by step

The builder lives under `/admin` (admin accounts only). A new story starts as an unpublished **draft** and stays private until you publish it.

1. **Create the draft.** Go to `/admin/stories/new`. Enter the **title** (the slug fills in for you from the title, and you can edit it), a short **description**, and pick an **age band**. Press **Create draft**. You land in the story editor.
2. **Set the age band and metadata.** In the story metadata panel confirm the title, description, and age band. This is also where you will set the start page once pages exist.
3. **Add your pages.** In the pages panel, add a page for each scene by giving it a **page key** (lowercase words joined by single hyphens, like `forest-edge`). Add every scene you sketched, including your endings.
4. **Write each page.**
   - Type the **scene text** in the body. Use the **Insert {{name}}** button to drop the name token in.
   - For a **decision page**, add **choices**. Each choice needs its **text** and a **destination page** chosen from the dropdown. Reorder them with the up and down arrows. A choice needs both a label and a destination, or it will not save.
   - For an **ending page**, press **Mark as an ending**, choose **Good ending** or **Surprise ending**, and write a short **ending label**. Marking a page as an ending removes its choices when you save.
   - Press **Save page**.
5. **Set the start page.** Back in the metadata panel, choose which page the reader opens on. This is required to publish.
6. **Watch the validation summary.** The editor shows a live list of problems that block publishing (a missing start page, a decision page with no choices, an ending with choices, a choice pointing at a page that does not exist, a bad age band). Clear every item.
7. **Preview as a draft.** Press **Preview** to open the story in the real reader in a new tab. Preview works while the story is still an unpublished draft and uses the sample name "Sam", so you can walk every path and check that `{{name}}` reads naturally, choices lead where you expect, and every ending feels right. Previewing does not record anything.
8. **Publish.** When the validation summary is clear and the preview reads well, press **Publish**. The app revalidates on publish and will refuse if anything is still wrong. A published story appears in the library. You can **Unpublish** at any time to pull it back to a private draft.

---

## 7. A worked example

Here is a tiny branching story of three real pages: a start page, one choice that leads to a good ending, and one that leads to a gentle surprise ending. It is shown in the underlying structure so you can see every field. In the builder you enter these same values: a page key, the scene text, and either choices or an ending.

```
Story
  title:   Milo and the Sleepy Kite
  slug:    sleepy-kite
  ageBand: 2-4
  start:   meadow          (the start page's key)

Page  key: meadow          (decision page)
  body:    {{name}} and Milo the kite floated over a soft, sleepy meadow.
           Should they drift up to a cloud, or coast down to the tall grass?
  choices:
    "☁️ Float up to the cloud"     -> cloud-bed
    "🌾 Coast down to the grass"    -> grass-tickle

Page  key: cloud-bed        (good ending)
  body:    The cloud was a giant pillow. Milo and {{name}} snuggled in and
           watched the stars blink goodnight, warm and cozy and calm.
  ending:      The Cloud Pillow
  endingKind:  good

Page  key: grass-tickle     (surprise ending)
  body:    The tall grass tickled so much that {{name}} and Milo giggled all
           the way back to the meadow. Let's try again!
  ending:      The Giggly Grass
  endingKind:  game_over
```

Notice how it follows every rule. The child is only ever named with `{{name}}`, never a pronoun. Milo the kite is the companion who lets the story move. Both endings are cozy. The surprise ending loops back with a giggle, not a fright. There is one good ending to collect, and there is not a single dash in any of the story copy.

---

## 8. Before you publish: the checklist

Walk this list before pressing Publish. The builder enforces the items marked (enforced); the rest are your responsibility.

- [ ] **Age band** is set (or deliberately left as none).
- [ ] **Start page** is set. (enforced)
- [ ] **Every decision page** has at least one choice, and **every ending page** has none. (enforced)
- [ ] **Every choice** points at a page that exists. (enforced)
- [ ] **At least one good ending** exists, so the story can be completed.
- [ ] **Surprise endings** are gentle and playful, never scary or punishing.
- [ ] **No dashes** anywhere in the story text, choice labels, or ending labels.
- [ ] **No pronouns or gendered words** for the child. `{{name}}` only.
- [ ] **Pages are short** and every choice reads clearly and differently.
- [ ] You have **previewed** the draft and walked every path start to finish.
- [ ] Then, and only then, **publish**.

---

## 9. The story creation wizard

Most stories now start in the **wizard** (`/admin/stories/new`) rather than the blank builder. The wizard plans everything except the words: you pick an age group, how many endings, and a template shape, and it generates all the pages, choices, and endings as empty slots. You then only write the text into those slots, watching a branch graph fill in green as you go.

### Scene pages and the rhythm

The wizard builds stories on one simple rhythm: **a scene, then a choice, then a scene**, all the way to an ending. To make this work there are two kinds of page:

- A **scene page** carries story text and a single **Turn the page** button that moves the reader on. It is a gentle beat of the story, not a decision. (This is the one place a page has a single choice; the "two or three choices" rule in section 4 is about **choice pages**.)
- A **choice page** carries a short prompt and two or three real choices, each leading to the next scene.

A reader never meets a choice unless the page before it was a scene, and every choice leads into a scene next. Endings are simply the scene that follows the last choice. A **good** ending sits several choices deep (three for the youngest, more for older readers); a **surprise** ending is a gentler early exit for a reader who wanders off sooner.

### Ghost text hints

Every empty slot shows a faint grey **hint** describing what to write there, like "Describe what they find here. Keep it calm and short." The hint is only a guide. It is never saved: as soon as you type, it disappears, and a page counts as written once it has real text. Write over every hint in your own warm words, following all the rules above.
