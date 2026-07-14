# App Store Optimization — Bedtime Quests (issue #69)

The single source of truth for **discoverability** metadata across the Apple App Store and
Google Play. It tunes each store separately, because their search algorithms and their fields
are different (see [Why the two stores differ](#0-why-the-two-stores-differ)).

All displayed copy here is **dash free** per the app wide copy rule (WORKFLOW.md UI rule 1),
parent facing, and honest. This doc supersedes the metadata fields in
[docs/marketing/app-store-copy.md](../marketing/app-store-copy.md) (#60) and
[docs/store/google-play-listing.md](./google-play-listing.md) (#61); those files now point
here for the optimized name, subtitle, keyword, title, and short description fields.

- **Product:** Bedtime Quests, an interactive bedtime story app for young children, read aloud by a parent.
- **Slogan (unchanged):** Choose your own goodnight.
- **Full name (web / press, unchanged):** Bedtime Quests: Interactive Bedtime Stories.

> **Honesty up front:** exact search volumes and difficulty scores below are *reasoned
> estimates*, not measured data. I do not have a live ASO tool in this environment. Treat the
> priorities as a starting hypothesis and validate the volume / difficulty numbers with a real
> tool before locking the fields (see [§5 Tools to validate](#5-tools-to-validate-before-you-lock-fields)).

---

## 0. Why the two stores differ

| | Apple App Store | Google Play |
| --- | --- | --- |
| Indexed for search | **App name (30)**, **subtitle (30)**, **keyword field (100)**, in app purchase display names. **Description is NOT indexed.** | **Title (30)**, **short description (80)**, **full description (4000)**. No dedicated keyword field. |
| How keywords are found | Apple splits every indexed field into tokens and auto combines them into phrases across fields. So "bedtime" in the name + "stories" anywhere = the phrase "bedtime stories" is covered. **Never repeat a word** across name / subtitle / keywords: duplication wastes the 100 char budget and does not rank you higher. | Play reads the three text fields like a mini web page. **Keyword repetition matters** (aim 2 to 3 mentions of a priority term across the copy) but stuffing is penalized. Natural, benefit led prose ranks and converts best. |
| Free extras Apple / Play add for you | Apple auto indexes the app category and handles most plurals and simple stems, so do not spend characters on "app", on obvious plurals, or on your category name. | Play uses on device signals (installs, ratings, retention, uninstalls) heavily, so store copy is only part of ranking. |
| Hard rules | No competitor brand names or trademarks in any field (rejection risk). No spaces after commas in the keyword field (each space is a wasted character). | No competitor brand names / trademarks. No spammy repetition, no unrelated keywords, no "best / number 1" style unverifiable claims. |

The practical consequence: **Apple copy is engineered word by word** (put unique high value
terms in name + subtitle + keywords, zero overlap) while **Play copy is written as persuasive
prose** that happens to weave the priority terms in a few times.

---

## 1. Keyword research

Search terms a parent would actually type, grouped by **intent**, with a reasoned read on
**relevance to this specific app** and **rough competitiveness**. Volume and difficulty are
estimates (Low / Med / High) pending a real tool.

Legend: **Relevance** = how well Bedtime Quests actually satisfies that search (a mismatch
hurts conversion and, on Play, ranking). **Comp** = how crowded / hard to rank. **Vol** =
rough demand.

### Tier 1 — core category (high volume, high competition, must appear)
These are the big head terms. We will not out rank giant incumbents on them at launch, but we
must be present and relevant, because they anchor the long tail combinations.

| Term | Relevance | Vol | Comp | Notes |
| --- | --- | --- | --- | --- |
| bedtime stories | Perfect | High | High | Our category. Owns the brand word "Bedtime" already. |
| kids stories / stories for kids | Perfect | High | High | Primary audience descriptor. |
| children's stories / children's books | Strong | High | High | "book(s)" pulls in the picture book crowd; we are story led, not a static book, so relevance is strong not perfect. |
| story time | Strong | Med | High | Ritual framing matches our read aloud together positioning. |
| kids books | Med | High | High | We are interactive stories, not a book library, so lower relevance; keep as a secondary. |

### Tier 2 — format and mechanic (our real differentiators, best ROI)
Mid volume, far less crowded, and we satisfy them better than almost anyone. **This is where
we should win.** Lead with these.

| Term | Relevance | Vol | Comp | Notes |
| --- | --- | --- | --- | --- |
| interactive stories | Perfect | Med | Med | Core mechanic. High intent, winnable. |
| read aloud | Perfect | Med | Med | We are explicitly a read aloud together app. Strong parent intent. |
| choose your own adventure (kids) | Perfect | Med | Med | Describes the branching path exactly; "adventure" is a strong single token. |
| personalized stories / story with my child's name | Perfect | Low-Med | Low | Rare and highly converting; our name in the story feature is the hook. Low competition. |
| choose the path / choose your own story | Perfect | Low | Low | Long tail, very high intent, easy to own. |

### Tier 3 — age specific (high intent, winnable long tail)
Parents search by their child's stage. High relevance, moderate competition, great for the
long tail. We span toddler through early reader.

| Term | Relevance | Vol | Comp | Notes |
| --- | --- | --- | --- | --- |
| toddler stories / stories for toddlers | Strong | Med | Med | Youngest band; pairs with read aloud. |
| preschool stories | Strong | Med | Med | Core band. |
| stories for 3 / 4 / 5 year olds | Strong | Low-Med | Low | Long tail, high intent, easy wins. |
| baby books / baby stories | Med | Med | Med | Edge of our range; include but do not lead. |
| early readers / learning to read | Med | Med | High | "I can read" mode supports it, but we are not a phonics app; keep honest and secondary. |

### Tier 4 — occasion and benefit (lower volume, very high intent)
Bedtime specific and outcome specific searches. Small volume, but the parent knows exactly
what they want and we deliver it.

| Term | Relevance | Vol | Comp | Notes |
| --- | --- | --- | --- | --- |
| goodnight stories | Perfect | Low-Med | Med | On brand ("Choose your own goodnight"). |
| sleep stories for kids | Strong | Med | High | Crowded by adult meditation apps; relevance strong but comp high. |
| calm / soothing bedtime | Strong | Low | Low | Matches our calm, cozy art and winding down promise. |
| nighttime routine / bedtime routine | Strong | Low-Med | Med | Ritual framing; supports story time. |

### Tier 5 — adjacent and aspirational (watch, do not force)
Tempting but weaker fit. Chasing these risks lower conversion (Apple) or spam signals (Play).
Track them; only add when the app genuinely earns them.

| Term | Relevance | Vol | Comp | Notes |
| --- | --- | --- | --- | --- |
| learning games for kids | Weak | High | High | We are not a game; do not claim it. |
| dyslexia friendly reading | Niche | Low | Low | We ship OpenDyslexic + high legibility font; a real, honest niche term worth a mention in the Play full description, not a headline. |
| educational app for kids | Med | High | High | Broad and crowded; category selection covers most of this on Apple. |

**Priority target list (what the metadata below is built around), best ROI first:**
1. interactive (bedtime) stories
2. read aloud
3. bedtime stories
4. kids stories / children's stories
5. personalized stories (child's name)
6. choose your own adventure / choose the path
7. toddler stories / preschool stories
8. story time
9. goodnight stories
10. children's books

---

## 2. Apple App Store optimization

Engineered so that **name + subtitle + keyword field** together cover the priority terms with
**zero word overlap** (every character earns its keep). Apple does not index the description,
so the description is optimized purely for **persuasion and the first 1 to 2 lines** shown
before the "more" fold.

### 2.1 App name — 28 / 30
```
Bedtime Quests: Kids Stories
```
Leads with the brand, then the two highest value head tokens. Indexes: **bedtime, quests,
kids, stories**. Combined with the subtitle this already yields "bedtime stories", "kids
stories", "bedtime kids stories", etc. Reads naturally, dash free.

### 2.2 Subtitle — 29 / 30
```
Interactive Tales, Read Aloud
```
Adds four fresh tokens with no overlap with the name: **interactive, tales, read, aloud**.
Yields high value phrases like "interactive stories" (interactive + stories from the name),
"read aloud stories", "interactive tales". Still reads as a human value proposition, not a
keyword dump.

### 2.3 Keyword field — 99 / 100
No spaces after commas. No word already used in the name or subtitle. No plurals Apple derives
for free. No competitor brand names.
```
toddler,preschool,children,book,goodnight,personalized,adventure,choose,sleep,night,learn,baby,calm
```
Covers Tiers 3 and 4 and the personalization / choose the path differentiators: **toddler,
preschool, children, book, goodnight, personalized, adventure, choose, sleep, night, learn,
baby, calm**. Apple auto combines these with the name / subtitle tokens (for example
personalized + stories, goodnight + stories, toddler + bedtime, choose + adventure).

> Words deliberately **left out** because the name / subtitle already index them: bedtime,
> quests, kids, stories, interactive, tales, read, aloud. Repeating them here would waste
> characters. "story" is omitted because Apple stems it to the same root as "stories".

### 2.4 Promotional text — 144 / 170 (updatable anytime, not indexed)
```
New quests added every month. Read aloud, let your child choose the path, and watch their name bring the story to life. Sweet dreams start here.
```
Unchanged from #60. It is not indexed, so it stays a freshness + hook lever you can swap
without a review (great for seasonal pushes and A/B messaging).

### 2.5 Description — optimize for conversion, not keywords
Apple does **not** index this, so every word serves persuasion. The **first 1 to 2 lines** are
the only thing shown before "more" on the product page, so the hook is front loaded and must
stand alone.

**Opening 2 lines (the pre "more" hook):**
```
Every night is a new adventure, and your child is the hero.

You read aloud, they choose what happens next, and their own name is woven into the tale. One bedtime story, endless ways to end it.
```
Then keep the existing body (HOW IT WORKS / WHAT IS INSIDE / MADE FOR FAMILIES, BUILT FOR
TRUST / BEDTIME QUESTS PREMIUM / auto renew small print). See the full block in
[docs/marketing/app-store-copy.md §Apple](../marketing/app-store-copy.md), which has been
updated to this opening.

**Conversion tweaks folded in:**
- Second line now states the payoff (name in the story + replayable endings) instead of
  restating the mechanic, so a skimmer gets the value in one glance.
- Keep the trust block ("first name only, no chat, no third party tracking") high, because for
  a kids app the parent's buying decision is safety first.
- Keep the annual price framed as "about $2.50 a month" next to the trial.

---

## 3. Google Play optimization

Play indexes the title, short description, and full description, and **rewards natural
repetition** of priority terms (roughly 2 to 3 times each) across benefit led copy. The copy
below weaves the Tier 1 and Tier 2 terms in without stuffing.

### 3.1 Title — 28 / 30
```
Bedtime Quests: Kids Stories
```
Same as Apple; Play weights the title heavily for search, so the keyword rich variant is the
recommended one (decision D1 in the Play listing doc).

### 3.2 Short description — 80 / 80 (shown first, above the fold)
```
Interactive bedtime stories for kids to read aloud, starring your child by name.
```
Leads with the three highest value terms (**interactive bedtime stories**, **kids**, **read
aloud**) in the first eight words, then the differentiator (name). This replaces the #61 line
"Interactive bedtime stories where your child chooses the path and stars by name." (which led
well but omitted "kids" and "read aloud").

### 3.3 Full description — priority terms woven 2 to 3x, no stuffing
Dash free, parent facing. Priority terms appear a natural number of times (bedtime stories x3,
read aloud x2, interactive x2, kids / children x3, personalized name x2, choose the path x2,
toddler / preschool x1, story time x1) inside benefit driven copy.

```
Bedtime Quests is an interactive bedtime story app for kids, where your child chooses the path and becomes the hero of every tale. It turns story time into a calm ritual you build together, one goodnight at a time.

Read the bedtime stories aloud together, let your little one pick what happens next, and see their first name woven right into the story. Every choice leads somewhere new, so each quest can be read again and again, with a different happy ending to discover each time.

HOW IT WORKS
Pick a quest. Read the scene aloud. Let your child choose the path. Tap to see where the choice leads. Discover all the happy endings together and celebrate every one.

WHAT IS INSIDE
• Interactive choose the path bedtime stories, gentle enough for winding down
• Your child's first name personalized into every story
• Multiple happy endings to discover and collect
• A growing library of kids stories, with new quests added every month
• Read aloud stories for toddlers, preschoolers, and early readers
• Achievements and a collection page that celebrate progress
• Calm, cozy art made for bedtime

MADE TO READ YOUR WAY
Choose from four text sizes and pick the reading font that feels best, including a clear high legibility option and a dyslexia friendly OpenDyslexic option. Switch between a read to me mode for cuddled up story time and an I can read mode for new readers. Every screen uses warm, high contrast colors so words stay easy to see.

SAFE AND MADE FOR FAMILIES
We personalize stories using your child's first name only. We never ask for photos, birthdays, or other personal details. There is no chat, there are no third party ads, and there is no third party tracking of your child. Just bedtime stories, made for young children.

BEDTIME QUESTS PREMIUM
Unlock the full library, every new monthly quest, and all endings and achievements. Always ad free, with no tracking.
• Monthly: $4.99
• Yearly: $29.99, our best value at about $2.50 a month
Start with a free trial and cancel anytime. Your subscription is billed through your Google Play account and renews automatically unless you cancel at least 24 hours before the end of the current period. You can manage or cancel anytime in your Google Play account settings.

Tuck in, choose the path, and drift off. Download Bedtime Quests and make tonight's story their own.
```

> The Google required billing wording (billed through Google Play, auto renew, 24 hour cancel
> window) is preserved verbatim from #61. Do not soften it.

---

## 4. Guidance and guardrails

### 4.1 Character limits (do not exceed)
| Field | Store | Limit | Ours |
| --- | --- | --- | --- |
| App name | Apple | 30 | 28 |
| Subtitle | Apple | 30 | 29 |
| Keyword field | Apple | 100 | 99 |
| Promotional text | Apple | 170 | 144 |
| Description | Apple | 4000 | well under |
| Title | Play | 30 | 28 |
| Short description | Play | 80 | 80 |
| Full description | Play | 4000 | ~2500 |

### 4.2 Rules to hold the line on
- **No trademarks or competitor brand names** in any field, on either store. It is the fastest
  path to rejection and adds no honest value. (No "like [BrandName]", no rival app names.)
- **Keep every claim honest.** We are an interactive story app, not a phonics / learning game
  or a meditation app. Do not chase "learning games" or lean hard on "sleep stories" if it
  overstates what the app does; a keyword you cannot satisfy tanks conversion (Apple) and can
  read as spam (Play).
- **No dashes in any displayed copy** (WORKFLOW.md UI rule 1). This includes the store fields.
- **Apple: no word overlap** across name / subtitle / keywords, no spaces after commas, no
  plurals Apple derives for free.
- **Play: no keyword stuffing.** Two to three natural mentions of a priority term is the
  ceiling; repetition beyond that or lists of unrelated keywords are penalized.
- **Do not invent ratings or superlatives** ("number 1", "best kids app"). Unverifiable.

### 4.3 Iterate post launch (this is a hypothesis, not a finish line)
- **A/B test on the store that lets you:** Google Play has native **Store Listing Experiments**
  (test title, short description, icon, screenshots against live traffic). Use it. Apple has no
  metadata A/B test for organic listings, but **Apple Search Ads** Custom Product Pages +
  Product Page Optimization let you test screenshots / order, and Search Ads gives you real
  keyword popularity + conversion data you can feed back into the keyword field.
- **The keyword field and short description are cheap to change.** Revisit every release:
  drop terms that never convert, promote long tail terms that do.
- **Watch the metrics that actually move ranking:** impression to product page rate (does the
  term bring the right people), product page to install (does the listing convert), and on
  Play, retention / uninstall rate. A high volume term that does not convert is worse than a
  low volume term that does.
- **Localize later.** Each locale is its own keyword field on Apple and its own listing on
  Play. High leverage once English is dialed in; out of scope for launch.

---

## 5. Tools to validate before you lock fields

None of the volume / difficulty estimates in §1 are measured. Validate with at least one of:

- **Apple Search Ads (free with an account)** — the **keyword popularity index (0 to 100)** is
  Apple's own first party signal for how often a term is searched. The single best free source
  for the Apple keyword field.
- **Google Play autocomplete + Google Keyword Planner + Google Trends** — free proxies for Play
  demand; type each priority term into the Play search bar and note the suggestions and order.
- **Dedicated ASO tools (paid, pick one):** AppTweak, Sensor Tower, Mobile Action / App Radar,
  AppFollow, ASOMobile, TheTool. They give per store search volume, difficulty, competitor
  keyword gaps, and rank tracking. Use one to confirm Tier 1 vs Tier 2 volumes and to find long
  tail terms we have not thought of.
- **Sanity check the competitive set:** search each Tier 1 term on both stores, look at who
  ranks, and confirm our Tier 2 (interactive / read aloud / personalized) is genuinely less
  crowded than assumed here.

---

## 6. Update the listings — checklist

Map each optimized field back to the console. Nothing here is submitted automatically.

### Apple — App Store Connect → your app → **App Information** and the **version** page
- [ ] **App Name** → `Bedtime Quests: Kids Stories` (App Information; localized, English US).
- [ ] **Subtitle** → `Interactive Tales, Read Aloud` (version page).
- [ ] **Keywords** → `toddler,preschool,children,book,goodnight,personalized,adventure,choose,sleep,night,learn,baby,calm` (version page; no spaces).
- [ ] **Promotional Text** → the 144 char line (version page; updatable anytime).
- [ ] **Description** → the updated block in [app-store-copy.md](../marketing/app-store-copy.md) with the new 2 line opening.
- [ ] Confirm no dashes, confirm the trademark check, submit with the build.

### Google Play — Play Console → your app → **Grow → Store presence → Main store listing**
- [ ] **App name** → `Bedtime Quests: Kids Stories`.
- [ ] **Short description** → `Interactive bedtime stories for kids to read aloud, starring your child by name.`
- [ ] **Full description** → the §3.3 block (also mirrored in [google-play-listing.md](./google-play-listing.md)).
- [ ] Confirm no dashes, no stuffing, Google billing wording intact, then save and roll out.
- [ ] Optionally queue a **Store Listing Experiment** for the short description (A vs the #61 line).

### Both
- [ ] Screenshots / feature graphic are unchanged by this issue (see #60 / #61); ASO here is text only.
- [ ] After launch, book a recurring review (every release) to feed real Search Ads / Play
      experiment data back into §1 and re tune.

---

## Sources
- [Apple — App Store Connect Help: keywords, app name, subtitle](https://developer.apple.com/help/app-store-connect/reference/app-information/) (field limits; keyword field 100 chars; description not indexed).
- [Apple Search Ads — keyword popularity](https://searchads.apple.com/) (first party search popularity signal).
- [Google Play Console Help — Store listing and Store Listing Experiments](https://support.google.com/googleplay/android-developer/answer/9866151) (title/short/full description indexing; A/B experiments).
- Repo: [docs/marketing/app-store-copy.md](../marketing/app-store-copy.md) (#60), [docs/store/google-play-listing.md](./google-play-listing.md) (#61), [docs/WORKFLOW.md](../WORKFLOW.md) (dash free rule).
