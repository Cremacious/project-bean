// lib/og-image.tsx
// The shared social share card, rendered once here and re-exported by both
// app/opengraph-image.tsx and app/twitter-image.tsx so the two images stay
// byte-identical. On brand with the Paper Cut palette and the paper-boat mark
// (issue #46). 1200x630 is the standard Open Graph / summary_large_image size.
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { BRAND } from "@/lib/brand";

// No dashes in the alt text (app-wide UI rule 1).
export const alt = `${BRAND.name}. ${BRAND.slogan}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Literal Paper Cut hex, matching components/brand-mark.tsx and the generated
// icons, so the card renders identically everywhere regardless of CSS vars.
const NAVY = "#16283A";
const CREAM = "#FFF1DC";
const LEAF = "#2FB98A";

/** Render the share card. Returns an ImageResponse (a valid image route body). */
export async function renderOgImage(): Promise<ImageResponse> {
  // Embed the exact paper-boat mark (byte-identical to app/icon.svg and the
  // store assets in public/brand) as a data URI, so Satori draws it without the
  // paths being re-declared here.
  const markSvg = await readFile(join(process.cwd(), "public/brand/icon-rounded.svg"), "utf-8");
  const markSrc = `data:image/svg+xml;base64,${Buffer.from(markSvg).toString("base64")}`;

  // OpenDyslexic is the reading font loaded app-wide (app/layout.tsx); reuse it
  // so the card speaks in the product's voice. Satori accepts woff (not woff2).
  const fontDir = join(process.cwd(), "node_modules/@fontsource/opendyslexic/files");
  const [bold, regular] = await Promise.all([
    readFile(join(fontDir, "opendyslexic-latin-700-normal.woff")),
    readFile(join(fontDir, "opendyslexic-latin-400-normal.woff")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 44,
          padding: 80,
          background: `linear-gradient(160deg, #1d3752 0%, ${NAVY} 72%)`,
          fontFamily: "OpenDyslexic",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={markSrc} width={252} height={252} alt="" />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 82, fontWeight: 700, color: CREAM, letterSpacing: -1 }}>
            {BRAND.name}
          </div>
          <div style={{ fontSize: 38, fontWeight: 400, color: LEAF }}>{BRAND.slogan}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "OpenDyslexic", data: bold, weight: 700, style: "normal" },
        { name: "OpenDyslexic", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
