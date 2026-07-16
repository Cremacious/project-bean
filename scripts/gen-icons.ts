// scripts/gen-icons.ts
// Regenerates the full Bedtime Quests icon set from ONE shared paper-boat art
// definition, so every surface (favicon, apple-icon, store icons, the inline
// BrandMark) stays byte-identical. Run with: npm run gen:icons
//
// If you change the logo, edit INNER below AND paste the same paths into the
// `<BrandMark>` SVG in components/brand-mark.tsx (it renders the identical art
// inline for the navbar/footer/auth), then rerun this script.
//
// Conventions baked in here (do not "fix" without reason):
//   - Rounded surfaces (web favicon, in-app mark) use rx=22 on a 0..100 square.
//   - Apple + app-store rasters are FULL-BLEED SQUARE (rx=0) and have NO alpha,
//     because iOS/Play apply their own corner masking and Apple rejects alpha.
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const BRAND_DIR = join(ROOT, "public", "brand");
const MOBILE_ASSETS = join(ROOT, "apps", "mobile", "assets");

export const NAVY = "#16283A";

// === Approved icon art (variant A2f) =====================================
// An origami paper boat with a pennant flag sailing a green "sea of stars"
// toward a crescent moon on a deep-navy night sky. Flat cut-paper, literal
// Paper Cut hex (NOT CSS vars) so every raster and the inline <BrandMark>
// render identically. Authored in a 0..100 square.
//
// The art is split into FOREGROUND (boat + moon + star, all inside the x:8-92,
// y:8-92 safe area) and WAVE (the sea). The WAVE deliberately bleeds to the
// tile edges and down to y:100, so it must be CLIPPED to the rounded corners on
// rounded variants (favicon/navbar) yet reach the square edge on the full-bleed
// no-alpha variants (apple/store/iOS). Keeping them separate is what lets ONE
// art definition satisfy both. Do NOT pull the wave back inside the safe area;
// the bleed is intentional (see docs/BRAND-ASSETS.md, variant A2f).

// Crescent moon: a sun-yellow disc with a navy disc carved out via a mask.
const MOON =
  `<mask id="mF"><rect width="100" height="100" fill="#FFFFFF"/><circle cx="72" cy="24" r="10.5" fill="#000000"/></mask>` +
  `<circle cx="77" cy="24" r="12" fill="#FFC24B" mask="url(#mF)"/>`;
// A single cream star in the night sky.
const STAR = `<path d="M21 25 L24 32 L31 35 L24 38 L21 45 L18 38 L11 35 L18 32 Z" fill="#FFF1DC"/>`;
// Origami boat: cream mast, poppy sail, two cream sail folds, deep-poppy hull.
const BOAT =
  `<path d="M50 28 L50 62" stroke="#FFF1DC" stroke-width="3.5" stroke-linecap="round"/>` +
  `<path d="M50 28 L68 35 L50 42 Z" fill="#FF6B4A"/>` +
  `<path d="M50 42 L50 62 L30 62 Z" fill="#FFF1DC"/>` +
  `<path d="M50 42 L70 62 L50 62 Z" fill="#FFF1DC"/>` +
  `<path d="M22 62 L78 62 L67 78 L33 78 Z" fill="#E14A2B"/>`;
// The sea. Bleeds full width and down to y:100; clipped to the tile on rounded
// variants, allowed to reach the square edge on full-bleed variants.
export const WAVE = `<path d="M0 76 Q25 70 50 73 Q75 76 100 71 L100 100 L0 100 Z" fill="#2FB98A"/>`;

// Safe-area foreground (never bleeds). Drawn first; WAVE is composed on top of
// it per-variant so the sea sits over the hull's lower edge (no navy wedge).
export const FOREGROUND = MOON + STAR + BOAT;

// Back-compat: the full art (foreground + wave) as one string, mirrored by
// components/brand-mark.tsx. Consumers that place it on a rounded tile must
// clip the wave (see roundedSvg); on a square tile the wave bleeds to the edge.
export const INNER = FOREGROUND + WAVE;

// Rounded tile (favicon, navbar, manifest, splash): navy rounded rect, safe
// foreground, then the wave CLIPPED to the rounded corners so the sea follows
// the tile edge instead of poking sharp corners past it.
const roundedSvg = (px: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 100 100" role="img" aria-label="Bedtime Quests">` +
  `<rect width="100" height="100" rx="22" fill="${NAVY}"/>` +
  `<clipPath id="tileF"><rect width="100" height="100" rx="22"/></clipPath>` +
  `${FOREGROUND}` +
  `<g clip-path="url(#tileF)">${WAVE}</g>` +
  `</svg>`;

// Full-bleed square tile (apple, store, iOS): NO rounded clip, wave runs to the
// square edge. iOS and Play apply their own corner mask, so we must not round.
const squareSvg = (px: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 100 100" role="img" aria-label="Bedtime Quests">` +
  `<rect width="100" height="100" fill="${NAVY}"/>${FOREGROUND}${WAVE}</svg>`;

// --- Native (Expo) assets -------------------------------------------------
// Transparent-background wrapper for the adaptive layers and the monochrome art.
const artSvg = (px: number, inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 100 100" role="img" aria-label="Bedtime Quests">${inner}</svg>`;

// Android adaptive icons are a 108dp canvas cropped to a ~66-unit circle at the
// center. So the icon ships as TWO layers (issue #87): the boat + moon + star
// ride in the FOREGROUND scaled to 0.7 about center (nothing critical enters
// the crop), while the navy tile + full-bleed WAVE live in the BACKGROUND. A
// single scaled-down INNER would have shrunk the sea into a floating stripe;
// splitting it lets the wave read as the sea under the masked circle.
const androidForeground = artSvg(1024, `<g transform="translate(15 15) scale(0.7)">${FOREGROUND}</g>`);
const androidBackground =
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 100 100"><rect width="100" height="100" fill="${NAVY}"/>${WAVE}</svg>`;

// Monochrome art, safe-zoned for the Android 13+ themed icon: the launcher
// recolors it via the wallpaper, so only shape/alpha matter. White silhouette
// of boat + sail + flag + mast + carved moon + the one wave; the background
// stars are dropped because they vanish once tinted small.
const safeZone = (inner: string) =>
  `<g transform="translate(18 18) scale(0.64)">${inner}</g>`;

const MONO =
  `<mask id="mMono"><rect width="100" height="100" fill="#FFFFFF"/><circle cx="72" cy="24" r="10.5" fill="#000000"/></mask>` +
  `<g fill="#FFFFFF">` +
  `<circle cx="77" cy="24" r="12" mask="url(#mMono)"/>` +
  `<path d="M50 28 L68 35 L50 42 Z"/>` +
  `<path d="M50 42 L50 62 L30 62 Z"/>` +
  `<path d="M50 42 L70 62 L50 62 Z"/>` +
  `<path d="M22 62 L78 62 L67 78 L33 78 Z"/>` +
  `<path d="M0 76 Q25 70 50 73 Q75 76 100 71 L100 100 L0 100 Z"/>` +
  `</g>` +
  `<path d="M50 28 L50 62" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round"/>`;

// Multi-size .ico is hand-built: an ICONDIR header + one ICONDIRENTRY per image,
// each wrapping a full PNG (the modern .ico form all current browsers read).
function buildIco(images: { size: number; png: Buffer }[]): Buffer {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  const entries: Buffer[] = [];
  const datas: Buffer[] = [];
  let offset = 6 + count * 16;
  for (const im of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(im.size >= 256 ? 0 : im.size, 0);
    e.writeUInt8(im.size >= 256 ? 0 : im.size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(im.png.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += im.png.length;
    entries.push(e);
    datas.push(im.png);
  }
  return Buffer.concat([header, ...entries, ...datas]);
}

async function main() {
  mkdirSync(BRAND_DIR, { recursive: true });
  mkdirSync(MOBILE_ASSETS, { recursive: true });

  const roundedBuf = Buffer.from(roundedSvg(512));
  const squareBuf = Buffer.from(squareSvg(1024));

  // Editable vector sources + the web favicon.
  writeFileSync(join(ROOT, "app", "icon.svg"), roundedSvg(512) + "\n");
  writeFileSync(join(BRAND_DIR, "icon-rounded.svg"), roundedSvg(512) + "\n");
  writeFileSync(join(BRAND_DIR, "icon-square.svg"), squareSvg(1024) + "\n");

  // favicon.ico at 16/32/48 (rounded, transparent corners kept).
  const icoImgs: { size: number; png: Buffer }[] = [];
  for (const size of [16, 32, 48]) {
    const png = await sharp(roundedBuf).resize(size, size).png().toBuffer();
    icoImgs.push({ size, png });
  }
  writeFileSync(join(ROOT, "app", "favicon.ico"), buildIco(icoImgs));

  // apple-icon 180 + store rasters: full-bleed square, NO alpha.
  const noAlpha = (buf: Buffer, px: number) =>
    sharp(buf).resize(px, px).flatten({ background: NAVY }).removeAlpha().png();

  await noAlpha(squareBuf, 180).toFile(join(ROOT, "app", "apple-icon.png"));
  await noAlpha(squareBuf, 1024).toFile(join(BRAND_DIR, "app-store-ios-1024.png"));
  await noAlpha(squareBuf, 512).toFile(join(BRAND_DIR, "google-play-512.png"));

  // Rounded 512 preview (docs / social).
  await sharp(roundedBuf).resize(512, 512).png().toFile(join(BRAND_DIR, "icon-rounded-512.png"));

  // Web app manifest "any" icon at 192 (issue #47). The manifest reuses
  // icon-rounded-512.png for the 512 "any" slot and the full-bleed no-alpha
  // google-play-512.png for "maskable"; only this 192 rounded size was missing.
  await sharp(roundedBuf).resize(192, 192).png().toFile(join(BRAND_DIR, "icon-192.png"));

  // --- Native (Expo) app icons + splash, issues #57 + #87 -----------------
  // Same A2f art, emitted into apps/mobile/assets and wired in
  // apps/mobile/app.json. iOS wants a full-bleed 1024 square with NO alpha
  // (Apple rejects transparency and applies its own corner mask); Android's
  // adaptive icon is a transparent foreground (boat + moon + star, scaled to
  // survive the circular crop) over a navy + wave background, plus a monochrome
  // layer for Android 13+ themed icons.
  const monochromeBuf = Buffer.from(artSvg(1024, safeZone(MONO)));

  // iOS + legacy Android + top-level icon: full-bleed square, no alpha.
  await noAlpha(squareBuf, 1024).toFile(join(MOBILE_ASSETS, "icon.png"));
  // Android adaptive foreground: boat + moon + star on transparency, scaled 0.7
  // about center so the mast top and flag survive the launcher's circular crop.
  await sharp(Buffer.from(androidForeground)).resize(1024, 1024).png().toFile(join(MOBILE_ASSETS, "android-icon-foreground.png"));
  // Android adaptive background: navy tile + the full-bleed wave, no alpha.
  await noAlpha(Buffer.from(androidBackground), 1024).toFile(join(MOBILE_ASSETS, "android-icon-background.png"));
  // Android 13+ themed (monochrome) layer: white silhouette on transparency.
  await sharp(monochromeBuf).resize(1024, 1024).png().toFile(join(MOBILE_ASSETS, "android-icon-monochrome.png"));
  // Splash mark: the rounded app icon; its navy tile blends into the navy splash
  // backgroundColor, centered small via expo-splash-screen's imageWidth.
  await sharp(roundedBuf).resize(1024, 1024).png().toFile(join(MOBILE_ASSETS, "splash-icon.png"));
  // Expo web favicon (rounded, matches the web app).
  await sharp(roundedBuf).resize(48, 48).png().toFile(join(MOBILE_ASSETS, "favicon.png"));

  console.log("Regenerated icon set:");
  console.log("  app/icon.svg, app/favicon.ico, app/apple-icon.png");
  console.log("  public/brand/{icon-square.svg,icon-rounded.svg,app-store-ios-1024.png,google-play-512.png,icon-rounded-512.png,icon-192.png}");
  console.log("  apps/mobile/assets/{icon.png,android-icon-foreground.png,android-icon-background.png,android-icon-monochrome.png,splash-icon.png,favicon.png}");
  console.log("Remember: keep components/brand-mark.tsx in sync with FOREGROUND + WAVE.");
}

// Only regenerate when run directly (`npm run gen:icons`); importing this module
// (e.g. from scripts/gen-feature-graphic.ts to reuse NAVY/INNER) must not write files.
if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
