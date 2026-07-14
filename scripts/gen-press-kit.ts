// scripts/gen-press-kit.ts
// Assembles the downloadable press-kit asset folder at public/press-kit/ for the
// media kit (issue #70). It COPIES the canonical, already-generated brand rasters
// and vectors out of public/brand/ under press-friendly names, so a journalist,
// blogger, or app-review site can grab one self-contained folder.
//
// This never hand-edits a brand file: every asset here is a byte-for-byte mirror
// of a file produced by `npm run gen:icons` / `npm run gen:feature-graphic` from
// the ONE shared paper-boat art. If you change the logo, rerun those scripts and
// then rerun this one:
//
//   npm run gen:icons          # regenerates public/brand/* from the shared art
//   npm run gen:feature-graphic
//   npm run gen:press-kit       # remirrors them into public/press-kit/
//
// Run with: npm run gen:press-kit
import { copyFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const BRAND_DIR = join(ROOT, "public", "brand");
const OUT_DIR = join(ROOT, "public", "press-kit");

// [canonical file in public/brand] -> [press-friendly name in public/press-kit].
// Descriptive names help press pick the right file; the mapping is documented in
// public/press-kit/README.md.
const ASSETS: ReadonlyArray<readonly [string, string]> = [
  // App icon in its store forms (full-bleed square, no alpha; the stores mask
  // their own corners).
  ["app-store-ios-1024.png", "app-icon-ios-1024.png"],
  ["google-play-512.png", "app-icon-android-512.png"],
  // The logo mark, rounded (as it appears in-app and as the web favicon).
  ["icon-rounded-512.png", "logo-rounded-512.png"],
  ["icon-rounded.svg", "logo-rounded.svg"],
  // The logo mark, square vector (scales to any size for print / articles).
  ["icon-square.svg", "logo-square.svg"],
  // Small raster mark for inline / favicon-sized use.
  ["icon-192.png", "logo-192.png"],
  // Wide brand banner (navy sky, paper boat, name + slogan) for article headers.
  ["google-play-feature-1024x500.png", "brand-banner-1024x500.png"],
];

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const [from, to] of ASSETS) {
    copyFileSync(join(BRAND_DIR, from), join(OUT_DIR, to));
    console.log(`  brand/${from}  ->  press-kit/${to}`);
  }
  console.log(`\nMirrored ${ASSETS.length} brand assets into public/press-kit/.`);
}

main();
