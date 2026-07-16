// scripts/gen-feature-graphic.ts
// Generates the Google Play "Feature graphic" (1024x500) for the Bedtime Quests
// store listing (issue #61). It REUSES the one shared paper-boat art (NAVY +
// INNER) exported by scripts/gen-icons.ts, so the wide banner stays byte-for-byte
// on-brand with the app icon / splash / favicon. Do NOT hand-edit the generated
// PNG; change the art in gen-icons.ts (INNER) and rerun both scripts.
//
// Run with: npm run gen:feature-graphic
//
// Play's spec (verified 2026): 1024x500, JPEG or 24-bit PNG, NO alpha channel.
// The center can be overlaid with a play button when a promo video is attached,
// and the outer edges may be cropped on some surfaces, so all text + the mark are
// kept inside a safe band and away from the dead center.
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { NAVY, FOREGROUND, WAVE } from "./gen-icons";

const ROOT = resolve(__dirname, "..");
const BRAND_DIR = join(ROOT, "public", "brand");

const CREAM = "#FFF1DC";
const SUN = "#FFC24B";

// Literal Paper Cut hex, high-contrast on navy. Text is set in a bold system sans
// stack; librsvg (bundled in sharp) resolves it to the platform's default sans.
const FONT = "Arial, 'Segoe UI', 'Helvetica Neue', Helvetica, sans-serif";

// The mark (the A2f rounded icon, authored in a 0..100 box) placed left-of-center
// and vertically centered: scale 3.4 -> 340px tall, inset 80px top/bottom of the
// 500. Rendered as a self-contained rounded badge (its own navy tile blends into
// the navy banner) so the wave is clipped to the corners instead of bleeding
// across the banner as a green block. The clip id is banner-local.
const mark =
  `<g transform="translate(96 80) scale(3.4)">` +
  `<rect width="100" height="100" rx="22" fill="${NAVY}"/>` +
  `<clipPath id="featTile"><rect width="100" height="100" rx="22"/></clipPath>` +
  `${FOREGROUND}` +
  `<g clip-path="url(#featTile)">${WAVE}</g>` +
  `</g>`;

// A few brand-color stars echoing the "sea of stars", kept sparse and clear of
// the wordmark so contrast stays high.
const stars = `
  <circle cx="628" cy="96" r="3.5" fill="${SUN}"/>
  <circle cx="946" cy="150" r="3" fill="${CREAM}"/>
  <circle cx="700" cy="430" r="3" fill="${CREAM}"/>
  <circle cx="980" cy="380" r="3.5" fill="#2FB98A"/>
`;

const FEATURE_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500" role="img" aria-label="Bedtime Quests">` +
  `<rect width="1024" height="500" fill="${NAVY}"/>` +
  stars +
  mark +
  // Wordmark on two lines so it stays large and inside the safe band.
  `<text x="470" y="212" font-family="${FONT}" font-weight="800" font-size="104" fill="${CREAM}">Bedtime</text>` +
  `<text x="470" y="318" font-family="${FONT}" font-weight="800" font-size="104" fill="${CREAM}">Quests</text>` +
  // Slogan (dash-free per UI rule 1).
  `<text x="474" y="388" font-family="${FONT}" font-weight="700" font-size="38" fill="${SUN}">Choose your own goodnight</text>` +
  `</svg>`;

async function main() {
  // Emit the editable SVG source alongside the raster (mirrors gen-icons.ts).
  writeFileSync(join(BRAND_DIR, "google-play-feature-1024x500.svg"), FEATURE_SVG + "\n");

  // Full-bleed, NO alpha (Play requirement). Background is already navy, so
  // flatten + removeAlpha is belt-and-suspenders.
  await sharp(Buffer.from(FEATURE_SVG))
    .resize(1024, 500)
    .flatten({ background: NAVY })
    .removeAlpha()
    .png()
    .toFile(join(BRAND_DIR, "google-play-feature-1024x500.png"));

  console.log("Regenerated Google Play feature graphic:");
  console.log("  public/brand/google-play-feature-1024x500.svg");
  console.log("  public/brand/google-play-feature-1024x500.png (1024x500, no alpha)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
