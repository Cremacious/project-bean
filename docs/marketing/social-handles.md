# Social handles checklist — Bedtime Quests (issue #70)

A one-time checklist so you reserve **one consistent handle** across every platform
that matters for a parent-facing kids' app. Reserving the same name everywhere (even
where you will not post yet) protects the brand and makes the press kit, footer, and
store listings all point to the same place.

Product: **Bedtime Quests**, an interactive bedtime story app for young children, read
aloud by a parent. Domains you already own: **bedtimequests.com** / **bedtimequests.app**.
All displayed copy stays dash free (WORKFLOW.md UI rule 1).

---

## Placeholders to fill (do this once, then wire up)

- [ ] **Chosen handle:** `__________` (pick from the recommendation below)
- [ ] **Brand / support email:** `__________` (see [§4](#4-email))
- [ ] **Press / media email:** `__________` (can be the same as support at launch)

Once reserved, fill the **Actual handle** and **URL** columns in [§3](#3-reserve-these-platforms-fill-as-you-go),
then wire them up ([§5](#5-after-you-reserve-wire-them-up)).

---

## 1. Recommended handle

Pick the first that is free on the **most** platforms, and reserve that same string
everywhere for consistency. Check availability across all platforms **before** committing,
because a handle is only useful if it is the same one on each.

| Priority | Handle | Notes |
| --- | --- | --- |
| **1 (recommended)** | `bedtimequests` | Exact brand match, matches the domains. Best case. |
| 2 (fallback) | `bedtimequestsapp` | Common app convention; use the same one everywhere if `bedtimequests` is taken on a key platform. |
| 3 (fallback) | `playbedtimequests` | Verb-led, reads as a call to action. |
| 4 (fallback) | `bedtimequestsco` | "co" suffix; last resort. |

**Rule of thumb:** consistency beats perfection. If `bedtimequests` is taken on even one
high-value platform ([§2](#2-which-platforms-matter-most)), prefer whichever fallback is free
across **all** of them rather than mixing (`bedtimequests` here, `bedtimequests_app` there).
Mixed handles break recognition and make the press kit harder to write.

Display name on every platform: **Bedtime Quests**. Bio line (reuse the slogan): **Choose
your own goodnight. Interactive bedtime stories for kids.** Link in bio: **bedtimequests.com**.

---

## 2. Which platforms matter most

For a parent-facing kids' app, value is concentrated. Reserve everywhere for brand
protection, but spend your effort where parents actually are.

| Tier | Platforms | Why |
| --- | --- | --- |
| **Highest value** | **Instagram**, **Facebook**, **TikTok** | Where parents of young kids discover apps. Visual, shareable, and where cozy bedtime content and reviews live. Post here first. |
| **High value** | **YouTube**, **Pinterest** | YouTube for demos / "how it works" and app-review coverage; Pinterest indexes well for "bedtime routine", "toddler stories", and parenting searches. |
| **Reserve (lower effort)** | **X (Twitter)**, **Threads**, **Bluesky** | Reserve for brand protection and press mentions; low posting priority for this audience. |
| **Reserve (housekeeping)** | **LinkedIn** (company page), **Reddit** (username) | LinkedIn for company legitimacy in the press kit; a Reddit username avoids impersonation. |

> **Kids' privacy note:** these are the brand's own marketing accounts, run by you for
> parents. Never solicit, collect, or repost content from children, and keep the accounts
> aimed at the parent who buys and reads, consistent with the app's COPPA-friendly design.

---

## 3. Reserve these platforms (fill as you go)

Reserve the chosen handle on each. Fill the **Actual handle** and **URL** once done.

| Platform | Reserve? | Suggested URL pattern | Actual handle | URL |
| --- | --- | --- | --- | --- |
| Instagram | [ ] | `instagram.com/<handle>` | `__________` | `__________` |
| Facebook (Page) | [ ] | `facebook.com/<handle>` | `__________` | `__________` |
| TikTok | [ ] | `tiktok.com/@<handle>` | `__________` | `__________` |
| YouTube | [ ] | `youtube.com/@<handle>` | `__________` | `__________` |
| Pinterest | [ ] | `pinterest.com/<handle>` | `__________` | `__________` |
| X (Twitter) | [ ] | `x.com/<handle>` | `__________` | `__________` |
| Threads | [ ] | `threads.net/@<handle>` | `__________` | `__________` |
| Bluesky | [ ] | `<handle>.bsky.social` | `__________` | `__________` |
| LinkedIn (Company) | [ ] | `linkedin.com/company/<handle>` | `__________` | `__________` |
| Reddit (username) | [ ] | `reddit.com/user/<handle>` | `__________` | `__________` |

> Tip: a free tool like Namechecker / Namecheckr shows availability across many
> platforms at once. Confirm on each platform directly before relying on it.

---

## 4. Email

Set up a brand email on your `bedtimequests.com` domain so press and support both reach
a monitored inbox. Keep it consistent with what the store listings already reference.

| Purpose | Suggested address | Status |
| --- | --- | --- |
| Support (already referenced in the store listings) | `support@bedtimequests.com` | [ ] Create + verify |
| Press / media (surface in the press kit) | `press@bedtimequests.com` | [ ] Create (can forward to support at launch) |
| General / hello | `hello@bedtimequests.com` | [ ] Optional |

> `support@bedtimequests.com` is the suggested support address in
> [docs/STORE-ACCOUNTS.md](../STORE-ACCOUNTS.md) and the Play listing, and is still a
> `[SUPPORT EMAIL]` placeholder in [lib/legal.ts](../../lib/legal.ts). Create the mailbox,
> then fill it there and in [docs/marketing/press-kit.md](./press-kit.md).

---

## 5. After you reserve, wire them up

Once the handles are live, surface them consistently:

- [ ] Add the handles to the **press kit** ([docs/marketing/press-kit.md](./press-kit.md) → "Find us" / contact).
- [ ] Add social links to the **site footer** ([components/site-footer.tsx](../../components/site-footer.tsx)) so every page links out.
- [ ] Add the X handle to the site's **Twitter card metadata** (`twitter.site` / `twitter.creator` in [app/layout.tsx](../../app/layout.tsx)) so shared links attribute to the account. It is intentionally unset until a handle exists.
- [ ] Cross-link the accounts to each other (same display name, same bio, same link) and add the app store links to each bio at launch.
- [ ] Consider adding the accounts to the site's `Organization` structured data (`sameAs`) in [app/layout.tsx](../../app/layout.tsx).

Nothing above is created automatically. Account creation is yours to do; this checklist
exists so you do it once, consistently.
