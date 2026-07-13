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
mkdirSync(BRAND_DIR, { recursive: true });

const NAVY = "#16283A";

// A paper boat sailing a sea of stars toward a crescent moon: quest (voyage) +
// choice + bedtime (moon). Authored in a 0..100 square. Literal Paper Cut hex
// (not CSS vars) so the raster files and the React component match exactly.
const INNER = `
  <circle cx="73" cy="27" r="13" fill="#FFF1DC"/>
  <circle cx="79" cy="23" r="10.5" fill="${NAVY}"/>
  <circle cx="24" cy="25" r="2" fill="#FFC24B"/>
  <circle cx="49" cy="18" r="1.4" fill="#FFF1DC"/>
  <circle cx="33" cy="45" r="1.3" fill="#FFC24B"/>
  <circle cx="88" cy="55" r="1.6" fill="#2FB98A"/>
  <path d="M27 61 L73 61 L64 74 L36 74 Z" fill="#FFF1DC"/>
  <path d="M8 78 Q24 72 40 78 T72 78 T96 78" fill="none" stroke="#2FB98A" stroke-width="3.4" stroke-linecap="round"/>
  <circle cx="22" cy="82" r="1.4" fill="#FFC24B"/>
  <circle cx="80" cy="82" r="1.4" fill="#FFF1DC"/>
  <path d="M40 61 L51 46 L61 61 Z" fill="#FFF1DC"/>
  <path d="M51 46 L51 61" stroke="#E14A2B" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <rect x="50.1" y="38.5" width="1.8" height="9" rx="0.9" fill="#FFF1DC"/>
  <path d="M51.9 39 L60 42 L51.9 45 Z" fill="#FF6B4A"/>
`;

const roundedSvg = (px: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 100 100" role="img" aria-label="Bedtime Quests">` +
  `<rect width="100" height="100" rx="22" fill="${NAVY}"/>${INNER}</svg>`;

const squareSvg = (px: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 100 100" role="img" aria-label="Bedtime Quests">` +
  `<rect width="100" height="100" fill="${NAVY}"/>${INNER}</svg>`;

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

  console.log("Regenerated icon set:");
  console.log("  app/icon.svg, app/favicon.ico, app/apple-icon.png");
  console.log("  public/brand/{icon-square.svg,icon-rounded.svg,app-store-ios-1024.png,google-play-512.png,icon-rounded-512.png,icon-192.png}");
  console.log("Remember: keep components/brand-mark.tsx in sync with INNER.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
