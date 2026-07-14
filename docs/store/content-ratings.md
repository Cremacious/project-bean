# Content and age ratings for Bedtime Quests

> **Draft for review. Not legal advice.** This document gives the accurate answers
> for **Apple's age rating questionnaire** (App Store Connect) and the **IARC
> content rating questionnaire** used by **Google Play**, so Bedtime Quests earns
> a correct and, honestly, the **lowest appropriate** age rating without
> misrepresenting its content. Every answer is grounded in what the app actually
> contains, not the marketing copy. Confirm the two open decisions in section 4
> (final target age, Kids Category yes or no) before you submit.

**Product:** Bedtime Quests (repo codename `project-bean`)
**What it is:** an interactive bedtime story app for young children, read aloud by
a parent. Content is calm and age appropriate; every path winds down toward sleep.
Endings are either a warm **good ending** or a **gentle surprise ending** that
loops the child sleepily back to try again, never scary, never punishing.
**Grounded against:**
- Story content rules: `docs/AUTHORING.md` (no scary or punishing content, gentle
  surprise endings, warm bedtime tone on every path).
- Real launch content: `content/stories/*.ts` (ten seeded stories; e.g.
  "Bean and the Whispering Woods", "The Castle of Slow Hours"). Every ending
  reviewed is cozy; every surprise ending is a sleepy loop back with a giggle.
- Ads: `lib/ads.ts` (contextual only, `house` self promotion default, no behavioral
  ads, free tier only, off unless configured; issue #37).
- Purchases: subscriptions via RevenueCat and the app stores (issue #55;
  $4.99 / month, $29.99 / year, free trial).
- Privacy: `docs/store/privacy-declarations.md` (#62), `docs/COMPLIANCE-COPPA.md`
  (#31).
**Questionnaire versions checked:** Apple's revised age rating system (bands
**4+, 9+, 13+, 16+, 18+**; the old 12+ and 17+ are retired) with the new
**In-App Controls**, **Capabilities**, **Medical or Wellness**, and social media
questions required for submissions from 2026; and the current **IARC** topic set
used by Google Play. See Sources at the bottom.

---

## 0. The bottom line (expected ratings)

| Store | Expected rating | Why |
| --- | --- | --- |
| **Apple App Store** | **4+** (the lowest band) | No objectionable content in any category; gentle bedtime stories only. Ads (if shown) are the only capability worth declaring and do not raise the band. |
| **Google Play (IARC)** | Lowest bands: **ESRB Everyone**, **PEGI 3**, **USK 0**, and equivalents | No violence, fear, language, sexual content, substances, or gambling. Interactive elements **Digital Purchases** and **In-App Ads** are appended as notices; **Users Interact = No**. |

**Two decisions you must confirm before submitting** (section 4): the **final
target age bands** on Play, and whether to enroll in the **Apple Kids Category**
(which constrains third party analytics and ads).

---

## 1. Apple App Store age rating

Apple's revised questionnaire groups descriptors under **In-App Controls**,
**Capabilities**, **Mature Themes**, **Medical or Wellness**,
**Sexuality or Nudity**, **Violence**, and **Chance-Based Activities**. For each,
you pick **None** or a frequency (**Infrequent/Mild** or **Frequent/Intense**).
Below is the correct answer for Bedtime Quests, one line of justification each.

### 1a. Violence (and the "gentle game over", head on)

| Descriptor | Answer | Justification |
| --- | --- | --- |
| **Cartoon or Fantasy Violence** | **None** | No fighting, peril, or harm of any kind. Stories are boats, bears, fireflies, castles winding down to sleep (`content/stories/*`). |
| **Realistic Violence** | **None** | Nothing realistic or violent anywhere in the app. |
| **Prolonged Graphic or Sadistic Realistic Violence** | **None** | Not present; this would make an app Unrated. |
| **Guns or Other Weapons** | **None** | No weapons appear in any story. |

**The "gentle game over" is not violence, horror, or fear.** In the data a
non good ending is stored as `endingKind: "game_over"`, but a child **never** sees
those words. The reader shows a friendly owl, "Oh no! Let's try again", and a
**Try again** button (`docs/AUTHORING.md` §2). In real content the "surprise
ending" is an owl leading the child "in a big sleepy circle, right back to the
start" or tall grass that "tickled so much that {{name}} and Milo giggled all the
way back". `AUTHORING.md` makes gentle, non punishing surprise endings a **hard
content rule** enforced in review. So this is a playful replay loop, not a loss,
death, threat, or scare. **Declare None for all violence, horror, and fear
descriptors.**

### 1b. Horror, Mature Themes, Language

| Descriptor | Answer | Justification |
| --- | --- | --- |
| **Horror/Fear Themes** | **None** | Warm bedtime tone on every path; surprise endings are explicitly forbidden from being scary or tense (`AUTHORING.md` §4). |
| **Profanity or Crude Humor** | **None** | Simple, kind, read aloud language; no profanity, no crude humor. |
| **Mature or Suggestive Themes** | **None** | Cozy toddler and early reader stories; nothing mature or suggestive. |

### 1c. Sexuality or Nudity

| Descriptor | Answer | Justification |
| --- | --- | --- |
| **Sexual Content or Nudity** | **None** | No sexual content or nudity of any kind. |
| **Graphic Sexual Content and Nudity** | **None** | Not present. |

### 1d. Chance-Based Activities

| Descriptor | Answer | Justification |
| --- | --- | --- |
| **Gambling** (real money) | **None** | No gambling. Subscriptions are a fixed price purchase, not a wager. |
| **Simulated Gambling** | **None** | No slot machines, cards, wheels, or betting simulations. |
| **Loot Boxes** | **None** | Rewards are deterministic (you collect the specific endings you reach); nothing randomized is sold. |
| **Contests** | **None** | No sweepstakes or contests. Achievements are personal progress badges, not prizes. |

### 1e. Alcohol, Tobacco, Drugs, and Medical or Wellness

| Descriptor | Answer | Justification |
| --- | --- | --- |
| **Alcohol, Tobacco, or Drug Use or References** | **None** | None appear. "Warm cocoa" and a "cocoa pantry" are cozy props, not controlled substances. |
| **Medical or Treatment Information** | **None** | The app tells stories; it gives no medical or treatment guidance. |
| **Health or Wellness Topics** | **None** | A bedtime story about winding down to sleep is narrative comfort, not a health, sleep tracking, or wellness feature. Answer None. |

### 1f. Capabilities (the new questions that matter here)

| Capability | Answer | Justification |
| --- | --- | --- |
| **Messaging and Chat** | **No** | There is no chat or messaging anywhere. Children cannot communicate. |
| **User-Generated Content** | **No** | Children create nothing and post nothing. Stories are authored in an admin only builder and cannot be seen or edited by users (`app/admin/`). |
| **Social Media** | **No** | No social features, feeds, or connections. |
| **Unrestricted Web Access** | **No** | The app has no in-app browser. The only outbound links are a fixed set of first party pages (privacy, terms, support) reached **behind a parental gate** (#32, `docs/COMPLIANCE-COPPA.md` §4), not arbitrary web navigation. |
| **Advertising** | **Yes** (declare) | The app is designed to show ads to free tier parents (`lib/ads.ts`). Even the default `house` self promo path is "advertising" for this question. Ads are **contextual only, non behavioral, no child data**, and do not raise the age band. Declaring Yes is the honest, conservative answer and stays consistent with #62 and #37. See flag R3 if you ship the first build with ads fully off. |

### 1g. In-App Controls

| Control | Answer | Justification |
| --- | --- | --- |
| **Parental Controls** | **Yes** (recommended) | A parental gate stands in front of purchases, external links, and settings (#32, COPPA §4). If the gate ships in the submitted build, declaring parental controls is accurate; if it is not yet wired in that build, answer No and fix before a Kids Category submission (flag R5). |
| **Age Assurance** | **No** | The app does not verify a user's age; it assumes a child audience and pushes all account actions to the adult (COPPA §2). |

### 1h. Resulting Apple band, and the Kids Category

- **Every content descriptor is None**, no messaging, no user content, no
  unrestricted web, no gambling. The only declared item is **Advertising**, which
  4+ permits. **Expected rating: 4+**, the lowest band, correctly.
- **Target the Kids Category?** Bedtime Quests fits the Kids Category and the
  **Ages 5 and under** age band that Apple offers there (the content spans
  toddlers through early readers; `story.ageBand` is `2-4`, `5-7`, or `8+`).
  Enrolling has a **cost**: under Apple guideline **1.3 / 5.1.4**, Kids Category
  apps **must not** include third party analytics or third party advertising
  outside Apple's narrow, contextual, human reviewed exceptions, and must not send
  personal or device data to third parties. Practically that means, if you enroll:
  - ship with **Google Analytics off** and ads restricted to the **`house`**
    (no third party) path or an Apple accepted kids ad solution;
  - keep RevenueCat (parent scoped subscription data only), which is generally
    acceptable as a service provider.
  This is the **Kids Category decision** (section 4, decision C2; mirrors
  privacy flag F1), where the recommendation is **yes, enroll** (the GA off +
  ads `house` only posture is already the planned safe first release). The 4+
  content rating itself is the same whether or not you join the Kids Category.

---

## 2. Google Play / IARC content rating

Play generates the rating from the **IARC** questionnaire. Answer each topic
truthfully; IARC then issues region specific ratings (ESRB, PEGI, USK, etc.) and
appends **interactive element** notices. Answers for Bedtime Quests:

| IARC topic | Answer | Justification |
| --- | --- | --- |
| **Violence** | **None** | No violence, combat, peril, blood, or harm in any story (`content/stories/*`, `AUTHORING.md`). |
| **Fear** | **None** | Warm bedtime tone throughout; scary or tense content is a forbidden content rule. The gentle surprise ending is a sleepy loop back, not a scare (see §1a). |
| **Sexual content / nudity** | **None** | No sexual content or nudity. |
| **Language** | **None** | No profanity or crude language; simple read aloud words. |
| **Controlled substances** (drugs, alcohol, tobacco) | **None** | None referenced; "warm cocoa" is not a controlled substance. |
| **Gambling** | **None** | No real or simulated gambling; no loot boxes or randomized rewards. |
| **Crude humor** | **None** | Gentle, kind humor at most (a giggle); nothing crude. |
| **Discrimination / hateful content** | **None** | None. Stories are inclusive and name only personalized; no gendered words even for the child (`AUTHORING.md` §3). |
| **Users Interact / communicate** | **No** | There is **no** chat, messaging, comments, multiplayer, or any user to user contact. Children cannot communicate with anyone. |
| **Shares user provided content** | **No** | Children create and share nothing; there is no user generated content. |
| **Shares location** | **No** | The app never collects or shares location (`docs/COMPLIANCE-COPPA.md` §2a; `db/schema.ts` has no location column). |
| **Digital purchases** | **Yes** (declare) | The app offers **in-app subscriptions** (RevenueCat + the app stores; $4.99 / month, $29.99 / year, free trial; issue #55). Declare digital purchases. |
| **Contains ads** | **Yes** (declare) | The app is designed to show ads to free tier parents (`lib/ads.ts`). Declare ads present. They are **contextual only, non behavioral, no child data, free tier only**. This is fully consistent with the "no third party tracking" claim in the listing; "no third party ads" in the marketing copy means no behavioral third party ad networks, not "no ads" (see cross check X3). See flag R3 if the first build ships with ads fully off. |
| **Suitable for young children / made for families** | **Yes** | Calm, age appropriate content for toddlers through early readers, read aloud by a parent. Opt in to **Designed for Families** (Play listing decision D2). |

**Expected IARC outcome:** the **lowest** rating in each region (ESRB
**Everyone**, PEGI **3**, USK **0**, and equivalents), with the interactive
element notices **Digital Purchases**, **In-App Ads**, and **Users Interact = No**.
Declaring digital purchases and ads does **not** raise the age rating; it only adds
the disclosure notices, which is exactly what an honest kids app should show.

---

## 3. Cross consistency check

The ratings answers must line up with the Data Safety / privacy labels (#62), the
ads work (#37), the subscriptions work (#55), and the families target age settings.
Checked:

| # | Claim in the ratings answers | Matches | Status |
| --- | --- | --- | --- |
| X1 | No user interaction / no chat / no UGC | Privacy #62 (no free text stored, no social), COPPA §2a, `db/schema.ts` | ✅ Consistent |
| X2 | No location, no personal data to third parties, no behavioral tracking | Privacy #62 §1c/§2c, `lib/analytics.ts`, `lib/ads.ts` | ✅ Consistent |
| X3 | **Contains ads = Yes** | #62 declares ads conditionally; #37 `house` default, contextual only. Marketing copy says "no **third party** ads / no **third party** tracking" (`docs/store/google-play-listing.md`), which is about behavioral third party networks, not first party house ads | ✅ Consistent, but see R3/R4 |
| X4 | **Digital purchases = Yes** | Subscriptions in #55 (`lib/revenuecat.ts`), RevenueCat parent scoped, Financial → Purchase history declared in #62 | ✅ Consistent |
| X5 | Suitable for young children; Families / Kids | COPPA child directed posture; Play Designed for Families (D2); Apple Kids Category eligible | ✅ Consistent (pending C1/C2) |
| X6 | Outbound links are not "unrestricted web access" | Fixed first party pages behind a parental gate (#32) | ⚠️ Depends on the gate shipping (R5) |

**Flags to resolve before you submit:**

- **R3 — What ships at first submission (ads on or off).** Privacy flag F2
  recommends the safe first release with **GA, Sentry, and ads all off**. The
  ratings questionnaires ask what the app **does**, and the app is **built** to
  show ads. Recommendation: **declare "contains ads = Yes"** on both stores
  regardless, because it does not raise the rating and avoids an under declaration
  if you later flip ads on (an ads change on Play requires re answering the
  questionnaire; Apple updates with the next version). Only declare ads = No if you
  are certain the app will **never** show even house ads. **Confirm the intent.**
- **R4 — Keep the ad wording consistent across surfaces.** The Play listing says
  "no third party ads" and "no third party tracking"; the ratings answers say
  "contains ads = Yes". These are consistent (house / contextual, non behavioral),
  but make sure the Data Safety form (#62), the listing copy, and this rating all
  describe ads the same way, so review does not read a contradiction.
- **R5 — Parental gate must back two answers.** The "no unrestricted web access"
  and "Parental Controls = Yes" answers, and Kids Category eligibility, all assume
  the **parental gate (#32)** is present in the submitted build. If the gate is not
  yet wired in that build, answer **Parental Controls = No**, keep
  **Unrestricted Web Access = No** (the links still are not a browser), and land
  the gate before a Kids Category submission.

No contradictions in app behavior were found. The only open items are the two
decisions in section 4 and the three flags above.

---

## 4. Where to enter each answer, and the decisions to confirm

### 4a. Entry checklist

**Apple — App Store Connect → your app → General → Age Rating → Edit:**
- [ ] Answer every questionnaire item per **section 1** (all descriptors **None**;
      **Advertising = Yes**; **Messaging / UGC / Social Media / Unrestricted Web =
      No**; **Parental Controls = Yes** if the gate ships, **Age Assurance = No**).
- [ ] Confirm the computed rating is **4+**.
- [ ] Decide the **Kids Category** (decision C2). If enrolling, also set the
      **Ages 5 and under** kids age band and ship with GA off + ads `house` only.
- [ ] Tracking / ATT is handled by the App Privacy section (#62), not here:
      **No tracking, no ATT prompt, no IDFA**.

**Google Play — Play Console → Policy → App content:**
- [ ] **Content rating** → start the IARC questionnaire, category **Reference,
      News, or Educational / App (not a game)** as appropriate, then answer every
      topic per **section 2** (all content topics **None**; **Users Interact =
      No**; **Shares location = No**; **Digital purchases = Yes**; **Contains ads =
      Yes**).
- [ ] **Ads** declaration → **Yes, my app contains ads** (matches the IARC ad
      answer and #62).
- [ ] **Target audience and content** → **Designed for Families = Yes**; select
      the target **age bands** (decision C1).
- [ ] Confirm the issued ratings are the lowest bands (ESRB Everyone, PEGI 3, etc.)
      with Digital Purchases and In-App Ads notices.

### 4b. Decisions you must confirm

- **C1 — Final target age bands (Play). Recommended: Ages 5 and under + Ages 6 to
  8.** The content spans toddlers through early readers (`ageBand` `2-4`, `5-7`,
  `8+`), so these two bands match the app's real audience. **Do not add Ages 9 to
  12** just for the single `8+` story ("The Castle of Slow Hours" is still calmly
  bedtime shaped and fits under 6 to 8); an older band dilutes the "for young
  children" signal and can pull the app out of the tightest Families treatment
  without a content reason. The **youngest** selected band drives the strictest
  COPPA and Families rules, which your no tracking, first name only design already
  satisfies. Apple's side is simply **4+**. *Confirm before submitting.*
- **C2 — Kids Category (Apple). Recommended: Yes, enroll.** Eligible and a natural
  fit, and the cost is a constraint you already accept: the Kids Category
  **forbids third party analytics and third party advertising** outside Apple's
  narrow kids exceptions (guideline 1.3 / 5.1.4), which means shipping **GA off and
  ads `house` only** (or an Apple accepted kids ad path such as SuperAwesome). That
  is exactly the safe first release already recommended in privacy flag F2, so
  enrolling takes nothing away from the launch plan while winning the Kids Category
  placement where parents actually browse. The only thing it defers is future third
  party GA4 or a third party ad network, both of which are behind vendor and LAWYER
  sign off anyway (COPPA §9). The 4+ rating is unchanged either way. *Confirm before
  submitting; mirrors privacy flag F1.*

---

## Sources

- [Apple Developer — Updated age ratings in App Store Connect](https://developer.apple.com/news/?id=ks775ehf) (new bands 4+, 9+, 13+, 16+, 18+; retirement of 12+/17+; new In-App Controls, Capabilities, Medical or Wellness questions)
- [Apple Developer — Age ratings values and definitions](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/) (full descriptor list and band thresholds)
- [Apple Developer — Age Rating Updates, upcoming requirements](https://developer.apple.com/news/upcoming-requirements/?id=07242025a) (deadlines for answering the new questions)
- [9to5Mac — Apple adds social media questions to the age rating questionnaire (July 2026)](https://9to5mac.com/2026/07/09/apple-adds-social-media-questions-to-app-store-connect-age-rating-questionnaire/)
- [Play Console Help — Content ratings questionnaire (IARC)](https://support.google.com/googleplay/android-developer/answer/9898843?hl=en)
- [Google Play Help — Apps & Games content ratings](https://support.google.com/googleplay/answer/6209544?hl=en)
- [IARC — International Age Rating Coalition (topics: violence, fear, sex, language, controlled substances, gambling, interactive elements)](https://en.wikipedia.org/wiki/International_Age_Rating_Coalition)
- Repo: `docs/AUTHORING.md`, `content/stories/*.ts`, `lib/ads.ts`, `docs/store/privacy-declarations.md` (#62), `docs/COMPLIANCE-COPPA.md` (#31), `docs/store/google-play-listing.md` (#61)
