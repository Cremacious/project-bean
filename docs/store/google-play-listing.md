# Google Play "Main store listing" — Bedtime Quests (issue #61)

Everything needed to fill the Play Console **Main store listing** page and its graphic
assets, ready to paste. All displayed copy is **dash free** per the app wide copy rule
(UI rule 1), parent facing, and high contrast where it is a graphic.

- **Package name:** `com.bedtimequests.app` (permanent; see [STORE-ACCOUNTS.md](../STORE-ACCOUNTS.md) §0).
- **Product:** Bedtime Quests, an interactive bedtime story app for young children, read aloud by a parent.
- **Source copy reused:** the App Store / Play copy in [docs/marketing/app-store-copy.md](../marketing/app-store-copy.md) (#60), adapted to Play's fields, limits, and Google specific billing wording.
- **Requirements checked against Play Console, 2026** (feature graphic 1024x500 no alpha; screenshots 320 to 3840 px, longest side at most 2x the shortest, 24 bit PNG or JPEG, no alpha; icon 512x512). See Sources at the bottom.

> Nothing here is submitted automatically. This doc is the paste ready content plus a
> field by field checklist. The Data Safety form (#62), content rating questionnaire
> (#63), and the guidelines compliance pass (#64) are separate and are only flagged here.

---

## 1. Text fields (paste ready, within Play limits)

### App title  ·  Play limit 30

Two options. Play weights the **title** heavily for search, so a keyword richer title
helps discovery. Pick one (decision D1 below).

Option A, clean brand (14 / 30):
```
Bedtime Quests
```
Option B, keyword richer, recommended for Play (28 / 30):
```
Bedtime Quests: Kids Stories
```

### Short description  ·  Play limit 80  (shown first, above the fold)

(80 / 80)
```
Interactive bedtime stories where your child chooses the path and stars by name.
```

### Full description  ·  Play limit 4000

(2426 / 4000, dash free). Includes benefits, how it works, the reading and accessibility
options, the safety / COPPA friendly framing, and the subscription terms in Google's
required wording (billed through Google Play, auto renew, cancel window).
```
Bedtime Quests is an interactive bedtime story app for young children, where your child chooses the path and becomes the hero of every tale. It is made to be read aloud together, so story time becomes a calm ritual you build side by side.

Read a scene aloud, let your little one pick what happens next, and see their first name woven right into the story. Every choice leads somewhere new, so each quest can be enjoyed again and again, with a different ending to discover each time.

HOW IT WORKS
Pick a quest. Read the scene aloud. Let your child choose the path. Tap to see where the choice leads. Discover all the happy endings together and celebrate every one.

WHAT IS INSIDE
• Interactive choose the path stories, gentle enough for winding down
• Your child's first name in every story
• Multiple happy endings to discover and collect
• A growing library, with new quests added every month
• Stories for toddlers, preschoolers, and early readers
• Achievements and a collection page that celebrate progress
• Calm, cozy art made for bedtime

MADE TO READ YOUR WAY
Bedtime Quests adapts to how your family reads. Choose from four text sizes, from small all the way up to huge, and pick the reading font that feels best, including a clear, high legibility option and a dyslexia friendly OpenDyslexic option. Switch between a read to me mode for cuddled up story time and an I can read mode that starts new readers off with bigger text. Every screen uses warm, high contrast colors so words stay easy to see.

SAFE AND MADE FOR FAMILIES
We designed Bedtime Quests to be safe for young children. We personalize stories using your child's first name only. We never ask for photos, birthdays, or other personal details. There is no chat, there are no third party ads, and there is no third party tracking of your child. Just stories.

BEDTIME QUESTS PREMIUM
Unlock the full library, every new monthly quest, and all endings and achievements. Always ad free, with no tracking.
• Monthly: $4.99
• Yearly: $29.99, our best value at about $2.50 a month
Start with a free trial and cancel anytime. Your subscription is billed through your Google Play account and renews automatically unless you cancel at least 24 hours before the end of the current period. You can manage or cancel anytime in your Google Play account settings.

Tuck in, choose the path, and drift off. Download Bedtime Quests and make tonight's story their own.
```

### Contact details  ·  Store listing "Store settings" and "Contact details"

| Play field | Value | Note |
| --- | --- | --- |
| Email (required) | `support@bedtimequests.com` | Suggested support address from STORE-ACCOUNTS.md §1. Currently a placeholder in [lib/legal.ts](../../lib/legal.ts) (`supportEmail`); create the mailbox and confirm before submitting. |
| Website | `https://bedtimequests.com` | Marketing site (#49). |
| Phone | Optional | Leave blank unless you want it public. |
| Privacy Policy (required, on the "App content" page) | `https://bedtimequests.com/privacy` | Live route (#49); mandatory for a child directed app. |
| Support URL (referenced from the listing / support flows) | `https://bedtimequests.com/support` | Live route (#49). |
| Terms of Service (for reference / description links) | `https://bedtimequests.com/terms` | Live route (#49). |

> The support email, privacy URL, support URL, and marketing URL are all from #49. Only
> the mailbox itself (`support@bedtimequests.com`) still needs to be created and verified.

---

## 2. Graphic assets

All Play store rasters live next to the other brand rasters in **`public/brand/`** (the
brand pipeline's home: `google-play-512.png`, `app-store-ios-1024.png`, and now the
feature graphic). Screenshots are a separate spec, in §2.3.

### 2.1 App icon  ·  512x512, 32 bit PNG  ·  reuse

- **File:** [`public/brand/google-play-512.png`](../../public/brand/google-play-512.png)
- Already generated by `npm run gen:icons` (full bleed square, no alpha, navy background). No change needed.

### 2.2 Feature graphic  ·  1024x500, no alpha  ·  NEW, generated

- **File:** [`public/brand/google-play-feature-1024x500.png`](../../public/brand/google-play-feature-1024x500.png) (24 bit PNG, no alpha, exactly 1024x500).
- **Editable source:** `public/brand/google-play-feature-1024x500.svg`.
- **How it is made:** `npm run gen:feature-graphic` (`scripts/gen-feature-graphic.ts`). It **reuses the one shared paper-boat art** (`NAVY` + `INNER`) exported from `scripts/gen-icons.ts`, so the banner is byte for byte on brand with the icon and splash. Do **not** hand edit the PNG; change `INNER` in `gen-icons.ts` and rerun.
- **Design:** navy `#16283A` background, the paper boat sailing a sea of stars toward the crescent moon on the left, the product name "Bedtime Quests" in cream `#FFF1DC`, and the slogan "Choose your own goodnight" in sun `#FFC24B`. Dash free, high contrast, key content kept inside a safe band away from the edges and the center (where Play overlays a play button if you attach a promo video).

### 2.3 Screenshots  ·  spec + reused captions  (assets to be exported from the app)

I cannot capture native Expo frames from here, so this is a **spec** (per the issue's "provide
a spec if you cannot hit exact frames"). The seven benefit captions are reused verbatim from
#60. Full spec and drop location: [docs/store/screenshots/README.md](screenshots/README.md).

- **Phone (required): 2 to 8.** Ship all **7**, portrait **1080x1920** (24 bit PNG, no alpha). Order 1 to 3 carries the most weight.
- **Tablet (optional): 7 inch and 10 inch, up to 8 each.** Recommended for a Families app and for store featuring. Same frames re rendered at **1600x2560** (decision D6).
- Export the PNGs into `apps/mobile/store-assets/phone/` and `.../tablet/` (folders and naming described in the screenshots README).

| # | Headline (dash free) | Supporting line |
| --- | --- | --- |
| 1 (hero) | Choose your own goodnight | Interactive bedtime stories for kids |
| 2 | Every story stars their name | Their first name, woven right into the tale |
| 3 | They choose what happens next | Every choice leads somewhere new |
| 4 | Discover every happy ending | Read again to find them all |
| 5 | Celebrate every win | Badges and a collection that grows with them |
| 6 | A new quest every month | Calm, cozy stories made for winding down |
| 7 (trust) | Safe for little ones | First name only. No chat. No tracking. |

### 2.4 Optional assets

- **Promo video (YouTube URL):** optional; skip for launch. If added later, keep the feature graphic center clear (it overlays a play button).
- **Tablet / Chromebook / Wear / TV:** not applicable at launch (phone plus optional tablet only).

---

## 3. Play Console checklist — where each thing goes, plus decisions to make

Play Console → your app → **Grow → Store presence → Main store listing** unless noted.
"App content" items are under **Policy → App content**; audience items under
**Policy → App content → Target audience and content**.

### 3.1 Field / asset map

| Play Console location | What to paste / upload | Source here | Status |
| --- | --- | --- | --- |
| Main store listing → **App name** | `Bedtime Quests` or `Bedtime Quests: Kids Stories` | §1 (decision D1) | Ready |
| Main store listing → **Short description** | the 80 char line | §1 | Ready |
| Main store listing → **Full description** | the 4000 limit block | §1 | Ready |
| Main store listing → **App icon** | `public/brand/google-play-512.png` | §2.1 | Ready |
| Main store listing → **Feature graphic** | `public/brand/google-play-feature-1024x500.png` | §2.2 | Ready |
| Main store listing → **Phone screenshots** | 7x 1080x1920 | §2.3 | Spec only, export from app |
| Main store listing → **Tablet screenshots** (7 in / 10 in) | 7x 1600x2560 each | §2.3 | Optional, decision D6 |
| Main store listing → **Video** | (skip) | §2.4 | Optional |
| Store settings → **App category** | Category + tags | decision D4 | Decision |
| Store settings → **Contact details** (email / website / phone) | `support@bedtimequests.com`, `https://bedtimequests.com` | §1 | Email mailbox to create |
| App content → **Privacy policy** | `https://bedtimequests.com/privacy` | §1 | Ready |
| Monetization → **Products → Subscriptions** | Monthly $4.99 / Yearly $29.99 + 7 day trial | app-store-copy.md | Set up in #55 billing work |

### 3.2 Play specific decisions you must make

These are Play choices this listing content cannot make for you. Several tie into #62/#63/#64.

- **D1 — App title.** Clean `Bedtime Quests` vs keyword richer `Bedtime Quests: Kids Stories`. **Recommend B** for Play search visibility.
- **D2 — Designed for Families: YES.** This is a child directed app, so opt in to the **Designed for Families** program and answer the Families policy declarations. This unlocks / requires the target audience and content rating work (#63) and constrains ads and SDKs (you already ship no third party ads or tracking, which keeps this clean).
- **D3 — Target age groups.** Under Target audience and content, select the child age bands the app targets. The content spans toddlers through early readers, so the youngest selected band ("Ages 5 and under" plus the relevant older bands) drives the strictest COPPA / Families rules. Confirm the exact bands with #63.
- **D4 — Category and tags.** Recommend primary category **Education** (or **Parenting**); add tags like stories, kids, bedtime, reading. Confirm at listing time.
- **D5 — Pricing: Free with in app subscriptions.** The app is **Free** to install with a limited free tier (a few stories) and Premium via subscription ($4.99 / month, $29.99 / year, 7 day trial). Set on the **Monetization** and **Pricing** pages, not the listing.
- **D6 — Tablet screenshots yes / no.** Recommend **yes** (re render the 7 frames at 1600x2560) for a Families app and better featuring. Skippable for a first release.
- **D7 — Countries / regions.** Choose launch countries under **Release → Countries / regions**. Note kids privacy laws vary (COPPA in the US, GDPR-K in the EU, UK Age Appropriate Design Code); your no tracking, first name only design is built for this, but confirm during #64.
- **D8 — Store listing contact email.** Confirm `support@bedtimequests.com` (create and verify the mailbox) or substitute the real monitored address.

### 3.3 Not in scope here (flagged only)

- **Data safety form (#62):** declare data collection / sharing; must match the privacy policy and the "no third party tracking, first name only" claim.
- **Content rating questionnaire (#63):** IARC questionnaire; drives the displayed rating.
- **Guidelines / Families policy compliance pass (#64).**

---

## 4. What changed in the repo for this issue

- `scripts/gen-feature-graphic.ts` (new) + `npm run gen:feature-graphic` — generates the feature graphic from the shared brand art.
- `scripts/gen-icons.ts` — now **exports** `NAVY` and `INNER` and only regenerates when run directly (guarded), so the feature graphic script can reuse the one art definition without side effects. Icon output is unchanged.
- `public/brand/google-play-feature-1024x500.png` and `.svg` (new, generated).
- `docs/store/google-play-listing.md` (this file) and `docs/store/screenshots/README.md` (screenshot spec).
- Web tests (241) and core tests (128) pass; icon output is byte identical.

---

## Sources

- [Play Console Help — Add preview assets to showcase your app](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en) (feature graphic 1024x500, screenshot size rules, counts)
- [Play Console Help — App testing / Designed for Families and target audience](https://support.google.com/googleplay/android-developer/answer/9285070) (families program, target audience and content)
- Repo: [docs/marketing/app-store-copy.md](../marketing/app-store-copy.md) (#60 copy reused), [docs/STORE-ACCOUNTS.md](../STORE-ACCOUNTS.md) (#58 package name / support email), [lib/legal.ts](../../lib/legal.ts) and the `/privacy` `/support` `/terms` routes (#49 URLs).
