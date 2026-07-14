# Bedtime Quests press-kit assets

Downloadable brand assets for press, bloggers, and app-review sites. The written
kit (boilerplate, fact sheet, usage guidance) lives in
[docs/marketing/press-kit.md](../../docs/marketing/press-kit.md).

**These files are generated, not hand-edited.** They are byte-for-byte mirrors of
the canonical brand files in [`public/brand/`](../brand/), produced from the one
shared paper-boat art. To refresh them after a logo change, rerun
`npm run gen:icons` (and `npm run gen:feature-graphic`) then `npm run gen:press-kit`.
See [scripts/gen-press-kit.ts](../../scripts/gen-press-kit.ts).

When the site is live, each file is served from `https://bedtimequests.com/press-kit/<name>`.

| File | What it is | Format | Copied from |
| --- | --- | --- | --- |
| `app-icon-ios-1024.png` | App icon, iOS store form (full bleed square, no alpha) | 1024x1024 PNG | `brand/app-store-ios-1024.png` |
| `app-icon-android-512.png` | App icon, Android store form (full bleed square, no alpha) | 512x512 PNG | `brand/google-play-512.png` |
| `logo-rounded-512.png` | Logo mark, rounded (as it appears in app and as the web favicon) | 512x512 PNG | `brand/icon-rounded-512.png` |
| `logo-rounded.svg` | Logo mark, rounded, vector (scales to any size) | SVG | `brand/icon-rounded.svg` |
| `logo-square.svg` | Logo mark, square, vector (for print or full bleed) | SVG | `brand/icon-square.svg` |
| `logo-192.png` | Small logo mark for inline or favicon-sized use | 192x192 PNG | `brand/icon-192.png` |
| `brand-banner-1024x500.png` | Wide brand banner: navy night sky, paper boat, name and slogan | 1024x500 PNG | `brand/google-play-feature-1024x500.png` |

## Brand colors (Paper Cut palette)

| Name | Hex |
| --- | --- |
| Poppy | `#FF6B4A` |
| Sun | `#FFC24B` |
| Leaf | `#2FB98A` |
| Cream | `#FFF1DC` |
| Navy | `#16283A` |

## Screenshots

App screenshots are specified in
[docs/store/screenshots/README.md](../../docs/store/screenshots/README.md) with
the shared captions. Export them from the app, then drop the phone set here as
`screenshot-01.png` through `screenshot-07.png` (or link the Play/App Store
listing) so the kit is complete.
