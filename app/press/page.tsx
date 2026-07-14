// app/press/page.tsx
//
// Public press / media page (issue #70). A lightweight, on-brand landing spot for
// journalists, bloggers, and app-review sites: the boilerplate, the fact sheet,
// and download links to the brand assets in public/press-kit/. It reuses the real
// name, subtitle, and slogan from lib/brand.ts and the boilerplate from
// docs/marketing/press-kit.md, so positioning stays consistent everywhere.
//
// Public route: allowlisted in proxy.ts and listed in lib/seo.ts so crawlers reach
// and index it. Uses the shared LegalChrome shell (same public header/footer as the
// legal + support pages) so a signed out visitor gets brand chrome and footer links.
// All copy is dash free (UI rule 1), every download looks clickable with a pointer
// cursor (UI rule 2), and all text is high contrast (UI rule 3).
import type { Metadata } from "next";
import { LegalChrome } from "@/components/legal/legal-chrome";
import { BRAND } from "@/lib/brand";

const DESCRIPTION =
  "Press and media kit for Bedtime Quests: boilerplate, fact sheet, logos, brand colors, and downloadable assets.";

// Fill before launch. Kept here as visible placeholders (they render as bracketed
// tokens) so they are impossible to miss on the live page. The real values live in
// docs/marketing/press-kit.md; mirror them here when you fill them.
const MEDIA_CONTACT = "[MEDIA CONTACT EMAIL]";
const LAUNCH_DATE = "[LAUNCH DATE]";
const MAKER = "[MAKER]";

export const metadata: Metadata = {
  title: "Press",
  description: DESCRIPTION,
  alternates: { canonical: "/press" },
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: `${BRAND.name} — Press`,
    description: DESCRIPTION,
    url: "/press",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — Press`,
    description: DESCRIPTION,
  },
};

const ONE_LINER =
  "Bedtime Quests is an interactive bedtime story app where your child chooses the path and stars by name in every tale.";

const SHORT_DESC =
  "Bedtime Quests turns story time into a ritual you build together. You read aloud, your child chooses what happens next, and their own first name is woven into every tale. Each choice leads somewhere new, so every quest can be read again with a different happy ending. Safe, calm, and made for young children.";

const FEATURES: ReadonlyArray<{ title: string; body: string }> = [
  { title: "Your child stars by name", body: "Their first name is woven into every story, so they are the hero." },
  { title: "They choose the path", body: "Every choice leads somewhere new, so each quest is replayable with a different happy ending." },
  { title: "Read aloud together", body: "Short, cozy scenes made to be shared at bedtime, with a read to me mode and an I can read mode." },
  { title: "Reads your way", body: "Four text sizes and a choice of reading fonts, including a dyslexia friendly option." },
  { title: "Safe and COPPA friendly", body: "First name only. No chat, no third party ads, and no third party tracking of your child." },
  { title: "Always growing", body: "Calm, cozy stories made for winding down, with new quests added every month." },
];

const FACTS: ReadonlyArray<{ label: string; value: string }> = [
  { label: "Product name", value: BRAND.name },
  { label: "Full name", value: BRAND.fullName },
  { label: "Slogan", value: BRAND.slogan },
  { label: "Maker", value: MAKER },
  { label: "Category", value: "Kids / Education (interactive stories)" },
  { label: "Platforms", value: "Web now; iOS and Android on the way" },
  { label: "Price", value: "Free to start; Premium $4.99 per month or $29.99 per year, 7 day free trial" },
  { label: "Age range", value: "Young children, toddlers through early readers" },
  { label: "Release date", value: LAUNCH_DATE },
  { label: "Website", value: "bedtimequests.com" },
  { label: "Media contact", value: MEDIA_CONTACT },
];

const COLORS: ReadonlyArray<{ name: string; hex: string; ink?: boolean }> = [
  { name: "Poppy", hex: "#FF6B4A" },
  { name: "Sun", hex: "#FFC24B" },
  { name: "Leaf", hex: "#2FB98A" },
  { name: "Cream", hex: "#FFF1DC" },
  { name: "Navy", hex: "#16283A", ink: true },
];

const ASSETS: ReadonlyArray<{ label: string; href: string; note: string }> = [
  { label: "App icon (iOS)", href: "/press-kit/app-icon-ios-1024.png", note: "1024x1024 PNG" },
  { label: "App icon (Android)", href: "/press-kit/app-icon-android-512.png", note: "512x512 PNG" },
  { label: "Logo, rounded (PNG)", href: "/press-kit/logo-rounded-512.png", note: "512x512 PNG" },
  { label: "Logo, rounded (SVG)", href: "/press-kit/logo-rounded.svg", note: "Vector" },
  { label: "Logo, square (SVG)", href: "/press-kit/logo-square.svg", note: "Vector" },
  { label: "Brand banner", href: "/press-kit/brand-banner-1024x500.png", note: "1024x500 PNG" },
];

// Chunky, clearly clickable download affordance (UI rule 2): solid bottom edge,
// press-down on active, visible focus ring, pointer cursor.
const downloadClass =
  "flex items-center justify-between gap-3 rounded-2xl border-2 border-[var(--pc-line)] bg-white p-4 shadow-[0_5px_0_var(--pc-line)] outline-none transition-transform hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5";

function Boilerplate({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-4 rounded-2xl border-2 border-[var(--pc-line)] bg-white p-5 shadow-[0_5px_0_var(--pc-line)]">
      <p className="font-display text-sm font-extrabold uppercase tracking-wide text-[var(--pc-plum-ink)]">
        {label}
      </p>
      <p className="mt-2 text-base font-medium leading-relaxed text-[var(--pc-ink)]">
        {text}
      </p>
    </div>
  );
}

export default function PressPage() {
  return (
    <LegalChrome>
      <article className="legal-prose">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--pc-ink)] sm:text-4xl">
          Press and media kit
        </h1>
        <p className="mt-3 max-w-2xl text-base font-medium text-[var(--pc-ink)]">
          Everything you need to write about {BRAND.name}. For anything else, reach us at{" "}
          <span className="font-bold">{MEDIA_CONTACT}</span>.
        </p>

        {/* Boilerplate */}
        <h2 className="mt-10 font-display text-2xl font-extrabold text-[var(--pc-ink)]">
          Boilerplate
        </h2>
        <Boilerplate label="One line" text={ONE_LINER} />
        <Boilerplate label="Short" text={SHORT_DESC} />

        {/* Features */}
        <h2 className="mt-10 font-display text-2xl font-extrabold text-[var(--pc-ink)]">
          Key features
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border-2 border-[var(--pc-line)] bg-white p-4 shadow-[0_5px_0_var(--pc-line)]"
            >
              <h3 className="font-display text-base font-extrabold text-[var(--pc-ink)]">
                {f.title}
              </h3>
              <p className="mt-1 text-sm font-medium leading-relaxed text-[var(--pc-ink)]">
                {f.body}
              </p>
            </div>
          ))}
        </div>

        {/* Fact sheet */}
        <h2 className="mt-10 font-display text-2xl font-extrabold text-[var(--pc-ink)]">
          Fact sheet
        </h2>
        <dl className="mt-4 overflow-hidden rounded-2xl border-2 border-[var(--pc-line)] bg-white shadow-[0_5px_0_var(--pc-line)]">
          {FACTS.map((fact, i) => (
            <div
              key={fact.label}
              className={`flex flex-col gap-1 p-4 sm:flex-row sm:gap-4 ${
                i > 0 ? "border-t border-[var(--pc-line)]" : ""
              }`}
            >
              <dt className="font-display text-sm font-extrabold text-[var(--pc-ink)] sm:w-40 sm:shrink-0">
                {fact.label}
              </dt>
              <dd className="text-sm font-medium text-[var(--pc-ink)]">{fact.value}</dd>
            </div>
          ))}
        </dl>

        {/* Assets */}
        <h2 className="mt-10 font-display text-2xl font-extrabold text-[var(--pc-ink)]">
          Download assets
        </h2>
        <p className="mt-2 text-sm font-medium text-[var(--pc-ink)]">
          Logos and the app icon in web ready formats. Please use them as is; do not recolor
          or redraw the mark.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ASSETS.map((asset) => (
            <a key={asset.href} href={asset.href} download className={downloadClass}>
              <span className="font-display text-base font-extrabold text-[var(--pc-ink)]">
                {asset.label}
              </span>
              <span className="text-xs font-bold text-[var(--pc-plum-ink)]">{asset.note}</span>
            </a>
          ))}
        </div>

        {/* Brand colors */}
        <h2 className="mt-10 font-display text-2xl font-extrabold text-[var(--pc-ink)]">
          Brand colors
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {COLORS.map((c) => (
            <div
              key={c.name}
              className="overflow-hidden rounded-2xl border-2 border-[var(--pc-line)] bg-white shadow-[0_5px_0_var(--pc-line)]"
            >
              <div className="h-16 w-full" style={{ backgroundColor: c.hex }} />
              <div className="p-3">
                <p className="font-display text-sm font-extrabold text-[var(--pc-ink)]">{c.name}</p>
                <p className="text-xs font-bold uppercase text-[var(--pc-ink)]">{c.hex}</p>
              </div>
            </div>
          ))}
        </div>

        {/* How to refer to us */}
        <h2 className="mt-10 font-display text-2xl font-extrabold text-[var(--pc-ink)]">
          How to refer to us
        </h2>
        <ul className="mt-3 space-y-2">
          <li>
            It is <strong>Bedtime Quests</strong>, two words, both capitalized. The full form
            for headlines is <strong>{BRAND.fullName}</strong>.
          </li>
          <li>Slogan: {BRAND.slogan}</li>
          <li>
            Logo do: use the supplied files as is and keep clear space around the mark, on the
            navy night sky or a high contrast background.
          </li>
          <li>
            Logo do not: do not recolor, rotate, stretch, add effects to, or redraw the mark.
          </li>
          <li>
            Voice: warm, calm, and parent facing, with no dashes in copy about us. It is an
            interactive story app, not a game or a phonics program.
          </li>
        </ul>
      </article>
    </LegalChrome>
  );
}
