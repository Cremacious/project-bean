# Monthly story cadence

This is the repeatable playbook for adding new stories to Bedtime Quests after launch. Follow it each month so the library keeps growing without re deciding the process every time.

This doc covers **when** stories ship, **how many**, and **how a story travels from idea to live**. It does not repeat how a story is written. For that, see [AUTHORING.md](AUTHORING.md), which is the source of truth for craft, the personalization rules, and the pre publish checklist. This doc points at that guide and never duplicates it.

The three app wide copy and UI rules in [WORKFLOW.md](WORKFLOW.md) still apply to every story: no dashes in displayed copy, every clickable thing looks clickable, all text high contrast.

---

## 1. Cadence and volume

**Target: four new stories per month.** That is roughly one a week, which a solo author can sustain alongside everything else. Treat four as the goal, three as an acceptable floor in a busy month, and five as a good month. Do not chase volume at the cost of the AUTHORING checklist. A smaller number of stories that read beautifully beats a pile of rushed ones.

Each story is small (a handful of short pages, two to four good endings), so four a month is realistic once the pipeline below is a habit.

### A suggested monthly calendar

Run the month in weekly windows so drafting, QA, and publishing never pile up at the end:

| Week | Window | What happens |
| --- | --- | --- |
| Week 1 | **Plan and draft** | Pick the month's four ideas (see balance below). Draft story one and story two per AUTHORING.md. |
| Week 2 | **Draft and QA** | Draft story three and story four. Run the QA read aloud pass on stories one and two. |
| Week 3 | **QA and publish** | QA stories three and four. Publish the batch once every story passes. |
| Week 4 | **Buffer and seasonal** | Catch up on anything that slipped, prep next month's seasonal idea, and update the balance ledger. |

The point is a steady rhythm, not the exact days. If drafting and QA happen every week, the publish step at the end of week 3 is quick and low stress.

---

## 2. Balance goals

The library should stay balanced across **age bands** and **cover motifs** as it grows, so every child finds something and no theme goes stale.

**Age bands** (from AUTHORING.md section 5): `2-4`, `5-7`, `8+`, or none. Aim to keep the three real bands roughly even over time rather than letting one band race ahead. A simple habit: each month, include at least one story in whichever band is currently thinnest.

**Cover motifs** (from `lib/stories/covers.ts`): `ocean`, `night`, `forest`, `space`, `castle`, `meadow`. These six paper cut scenes double as theme buckets. Spread new stories across them so the library card wall stays varied. When a story omits `coverMotif`, the app derives one from the slug, so pin `coverMotif` deliberately when you want to fill a thin bucket.

### Track it with a lightweight ledger

Keep a running tally so gaps are obvious before they grow. A few lines in the monthly issue (see section 6) is enough:

```
Age bands:  2-4 = N   5-7 = N   8+ = N   none = N
Motifs:     ocean = N  night = N  forest = N  space = N  castle = N  meadow = N
```

Before locking the month's four ideas, glance at the tally and steer the new stories toward the thinnest band and the thinnest motifs. You do not need perfect balance every month, only a gentle pull toward even coverage over the year.

To rebuild the tally from the source files at any time:

```
grep -h "ageBand:\|coverMotif:" content/stories/*.ts | sort | uniq -c
```

---

## 3. The pipeline for one story, start to live

Every story travels the same path. Steps one through four are craft and belong to [AUTHORING.md](AUTHORING.md); this doc owns how the finished story ships (steps five and six).

1. **Idea.** Pick a cozy premise and a companion character. Note the target age band and the motif bucket it fills.
2. **Draft.** Write the story to [AUTHORING.md](AUTHORING.md): short pages, two or three choices per decision page, two to four good endings, zero to two gentle surprise endings, `{{name}}` only and never a pronoun for the child.
3. **Self check.** Walk the AUTHORING pre publish checklist (section 8 there). Confirm no dashes, no child pronouns, at least one good ending, and every choice pointing at a real page.
4. **QA read aloud pass (issue #27 process).** Read the whole story out loud, path by path. Confirm validation is clean, choices make sense and lead where expected, every ending feels right, and the words flow when spoken to a child. Fix anything that stumbles.
5. **Publish.** Choose one of the two ship paths below. Either way the story lands in the database with `published = true`, a start page set, and a cover assigned (an explicit `coverMotif` or the slug derived default).
6. **Verify in production.** Open the live library, confirm the new story card appears with the right cover and age band, open it, and walk at least one path to an ending.

### Two ways a story ships

Both paths validate the same way (`lib/stories/validate.ts`) and write to the same Neon database. Pick per story:

- **Seed script (code first, best for batches).** Author the story as a TypeScript file in `content/stories/` using `defineStory` (see any existing file such as `content/stories/starlight-sail.ts` as a template). Then run `npm run db:seed`. The script loads every story file, validates each one, and upserts it with `published = true`, replacing that story's pages and choices cleanly. This is the recommended path for the monthly batch because the stories live in version control and ship together in one command.
- **Admin builder (in app, best for a one off).** Build the story in the `/admin` builder as described in AUTHORING.md section 6: create a draft, add pages, set the start page, clear the live validation summary, preview, then press **Publish**. Good for a quick single story or an edit without touching the repo.

### How stories reach production

`npm run db:seed` writes to whichever Neon database `DATABASE_URL` points at, so it publishes to production only when it runs against the production database. Keep the story `.ts` files in the repo, and run the seed against the production database as the publish step for the batch. The admin builder publishes directly to whatever database the running site is connected to, so publishing through the builder on the live site reaches production immediately. Do not read or print `.env.local`.

### The native app: publish the batch over the air

The two paths above ship a story to the **web** app. The **native** app (`apps/mobile`) bundles the same authored `content/stories/*.ts` files, so a new story is a content only change that reaches installed phones **over the air**, with no App Store or Play review, via EAS Update (issue #67). The full command list, channels, rollback, and the OTA vs new build boundary live in [OTA-UPDATES.md](OTA-UPDATES.md); the short version for the monthly batch, once the stories are seeded to the web database:

1. From `apps/mobile`, publish to the preview channel and smoke test on a preview build: `eas update --branch preview --message "<month> stories" --environment preview`.
2. Promote the tested bundle to production: `eas update:republish --destination-channel production --message "<month> stories"`.
3. Verify with `eas update:list --branch production` and by opening a production or TestFlight build cold twice so it downloads then applies the new story cards.
4. If anything is wrong, roll back with `eas update:roll-back-to-embedded --channel production` and fix forward.

Adding a story does not change the native runtime version, so every installed production build is eligible; a normal monthly batch never needs a store submission.

---

## 4. Seasonal and themed content

Seasonal stories keep the library feeling alive and give a reason to come back. Fold them into the normal cadence rather than treating them as extra work.

- **Reserve one slot.** In a month with a holiday or a clear season, make one of the four stories the seasonal one. It still follows every AUTHORING rule and stays gentle and bedtime shaped. No scary Halloween, no frantic holiday rush.
- **Draft one month ahead.** Use the week 4 buffer window to prep the next month's seasonal idea so it is not a scramble. A winter story wants to be ready in late autumn.
- **Lean on motifs.** The six motifs carry season well: `night` and `meadow` for the long summer, `forest` and `castle` for cozy autumn and winter, `ocean` for summer, `space` for a starry any time story. Pin `coverMotif` so the seasonal card looks the part.
- **Keep them evergreen where you can.** A story about a snowy night reads well every winter, not just once. Prefer seasonal feelings over dated references so the library keeps paying off.

---

## 5. The monthly checklist

Copy this into the month's tracking issue and work down it:

```
Monthly story batch: <month year>

Plan
[ ] Read the balance ledger; note the thinnest age band and thinnest motifs
[ ] Pick four story ideas that fill those gaps (one seasonal if the month calls for it)
[ ] Record target age band and motif for each of the four

Draft (per docs/AUTHORING.md)
[ ] Story 1 drafted
[ ] Story 2 drafted
[ ] Story 3 drafted
[ ] Story 4 drafted

QA read aloud pass (issue #27 process)
[ ] Story 1 read aloud, validation clean, endings correct
[ ] Story 2 read aloud, validation clean, endings correct
[ ] Story 3 read aloud, validation clean, endings correct
[ ] Story 4 read aloud, validation clean, endings correct

Publish
[ ] Story files added to content/stories/ (or built in /admin)
[ ] Ran npm run test and npm run build clean
[ ] Seeded to production (npm run db:seed against the production database) or published via /admin
[ ] Native app: published the batch over the air (eas update to preview, then republish to production; see OTA-UPDATES.md)
[ ] Updated the balance ledger with the four new stories

Verify
[ ] Each new story appears in the live library with the right cover and age band
[ ] Walked at least one path to an ending in each new story
[ ] Native app: opened a production or TestFlight build cold twice and confirmed the new story cards appear (OTA applied)

Done: new stories live and verified in the library
```

---

## 6. Tie in to the issue driven workflow

Keep the cadence visible in GitHub so it stays tracked and never silently slips.

- **File one issue per monthly batch.** Send a message that begins with `issue:` describing the batch, for example: `issue: Story batch for March 2027, four new stories with balance and QA`. That files an issue on `Cremacious/project-bean` with the `enhancement` or `content` framing, per the WORKFLOW capture rule.
- **Put the checklist in the issue body.** Paste section 5 into the issue so the whole cycle lives in one place, including the balance ledger snapshot.
- **Work it as its own session.** Per WORKFLOW, each issue is worked one at a time in a fresh Claude Code session from a paste ready prompt. Work directly on `master`, do not branch, and hold the commit until the batch is approved. Then commit closing the issue with `Closes #N`.
- **Close when verified.** The issue is done only when the last checklist line is true: new stories live and verified in the library.
