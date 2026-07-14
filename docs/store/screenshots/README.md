# Google Play screenshots — spec and export guide (issue #61)

The native Expo frames cannot be captured in the tooling that wrote the listing copy, so
this is the **spec** for producing them plus exactly where to drop the exported PNGs. The
seven benefit captions are shared with the App Store set (#60) so both stores stay
consistent. All caption text is **dash free** and high contrast (UI rules 1 and 3).

## Play requirements (verified 2026)

- **Format:** 24 bit PNG or JPEG, **no alpha channel**.
- **Size:** each side between **320 px and 3840 px**; the longest side must be at most **2x** the shortest.
- **Count:** phone **2 to 8** (ship all 7); tablet **up to 8** per form factor (optional).

## Target dimensions

| Form factor | Dimensions | Orientation | Notes |
| --- | --- | --- | --- |
| Phone (required) | **1080 x 1920** | Portrait | Standard Full HD; renders cleanly on all phones. |
| 7 inch tablet (optional, D6) | **1600 x 2560** | Portrait | Re render the same 7 frames. |
| 10 inch tablet (optional, D6) | **1600 x 2560** | Portrait | Re render the same 7 frames. |

## The 7 frames (order matters; 1 to 3 do most of the selling)

| # | Screen to capture | Headline | Supporting line |
| --- | --- | --- | --- |
| 1 (hero) | A story scene mid read, name visible | Choose your own goodnight | Interactive bedtime stories for kids |
| 2 | Story text with the child's first name highlighted | Every story stars their name | Their first name, woven right into the tale |
| 3 | A choose the path choice moment | They choose what happens next | Every choice leads somewhere new |
| 4 | An ending / endings collection view | Discover every happy ending | Read again to find them all |
| 5 | Achievements / collection page | Celebrate every win | Badges and a collection that grows with them |
| 6 | Library with the monthly quest | A new quest every month | Calm, cozy stories made for winding down |
| 7 (trust) | Parent friendly safety / settings screen | Safe for little ones | First name only. No chat. No tracking. |

## Framing guidance

- Put each **headline** large near the top and the **supporting line** just under it, on a
  navy `#16283A` band or a Paper Cut cream panel, with the app screen below. High contrast
  text only (cream `#FFF1DC` or navy ink), never faint.
- Keep text inside a safe margin (about 10 percent) so nothing is cropped.
- Use real app UI (no dark mode, no debug overlays). Personalize with a friendly sample name.
- No dashes in any caption (UI rule 1).

## How to capture

1. Run the native app: `cd apps/mobile` and start it on a device or emulator at a 1080x1920 (or scaled) portrait resolution.
2. Navigate to each screen above, using a sample child profile.
3. Capture the frame, then compose the headline + supporting line over it (any image tool, or a simple HTML/Canvas template following the Paper Cut tokens in `app/globals.css`).
4. Export as 24 bit PNG (no alpha) at the exact target size.

## Where to save the exported PNGs

```
apps/mobile/store-assets/
  phone/    01-hero.png … 07-safe.png        (1080x1920)
  tablet/   01-hero.png … 07-safe.png        (1600x2560, optional)
```

Name files `01-…` to `07-…` so upload order matches the table above. These raster exports
are intentionally not committed as generated brand files; commit them once produced, or keep
them out of git and upload directly in the Play Console (decide alongside D6).
