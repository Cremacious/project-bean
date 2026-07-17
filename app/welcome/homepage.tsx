"use client";

// app/welcome/homepage.tsx
//
// The public marketing homepage, ported 1:1 from the approved Claude Design
// ("Bedtime Quests Homepage"). It is a Client Component because the design is
// interactive: scroll reveals, a hero "fork" the visitor can tap, a live story
// map that drives a reader card, and a name field that writes the child's name
// into the story. The source expressed all of that in a small DCLogic script;
// here it is idiomatic React state.
//
// Faithfulness notes:
//  - The source used literal Paper Cut hex. Those map exactly onto the app's
//    --pc-* tokens (see app/globals.css), so we reference the tokens for the
//    named palette and keep literal hex only for the few one-off shades the
//    palette does not name (deep-navy shadow, the teal choice chip, etc.).
//  - The source loaded Baloo 2 + Nunito Sans from the Google Fonts CDN. The app
//    already self-hosts both via next/font, and the CSP forbids external fonts,
//    so display/body type is referenced through --font-display / --font-sans.
//  - The desktop-first export had no responsive rules; the column collapse,
//    the one keyframe, and the pressable affordance live in globals.css under
//    the "Marketing homepage" block.
// All copy is dash free (UI rule 1), every clickable element presses down and
// shows a focus ring (UI rule 2), and all text is high contrast (UI rule 3).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { CookieSettingsLink } from "@/components/consent/cookie-settings-link";

// Named Paper Cut palette (tokens) + the two font families, gathered so the JSX
// below reads close to the source markup.
const C = {
  ink: "var(--pc-ink)", // #16283A
  cream: "var(--pc-cream)", // #FFF1DC
  sub: "var(--pc-sub)", // #3C5172
  line: "var(--pc-line)", // #9FB2D2
  accent: "var(--pc-accent)", // #E6EAFB
  plum: "var(--pc-plum)", // #6C5CE7
  plumInk: "var(--pc-plum-ink)", // #574BC0
  sun: "var(--pc-sun)", // #FFC24B
  sunInk: "var(--pc-sun-ink)", // #D99A1C
  leaf: "var(--pc-leaf)", // #2FB98A
  leafInk: "var(--pc-leaf-ink)", // #1E8F6A
  poppy: "var(--pc-poppy)", // #FF6B4A
  poppyInk: "var(--pc-poppy-ink)", // #E14A2B
  sky: "var(--pc-sky)", // #BCCAE2
  disp: "var(--font-display)",
  sans: "var(--font-sans)",
} as const;

// One-off shades the palette does not name.
const NAVY_SHADOW = "#06131f";
const TEAL = "#159DB8";
const TEAL_INK = "#0C6F84";
const SUN_TEXT = "#3A2D00";
const TAN = "#D9C7A6";

// Turn a raw name into the display name used inside the story lines.
function storyName(raw: string): string {
  const t = raw.trim();
  return t || "your child";
}

// ---------------------------------------------------------------------------
// The story map + reader. The chart's node buttons and the reader card share one
// selected node, so the whole two-column band lives in this component.
// ---------------------------------------------------------------------------
type MapNode = {
  text: string;
  choices?: ReadonlyArray<{ label: string; to: string }>;
  ending?: "happy" | "over";
};

const MAP_NODES: Record<string, MapNode> = {
  start: {
    text: "The little paper boat reaches a fork in the dark water. To the left, a great whale hums a lullaby. To the right, a lighthouse blinks warm and gold.",
    choices: [
      { label: "Sail to the singing whale", to: "sceneA" },
      { label: "Climb the lighthouse stairs", to: "sceneB" },
    ],
  },
  fork: {
    text: "Two lights glow across the water. Every quest branches here, and again at every stop, so no two readings are alike.",
    choices: [
      { label: "Sail to the singing whale", to: "sceneA" },
      { label: "Climb the lighthouse stairs", to: "sceneB" },
    ],
  },
  sceneA: {
    text: "A great whale rises beside the boat, humming a lullaby, and dips a wide, kind fin like a bridge.",
    choices: [
      { label: "Ride across the moonlit bay", to: "endA1" },
      { label: "Wave goodnight and drift home", to: "endA2" },
    ],
  },
  sceneB: {
    text: "A sleepy keeper waves from the lantern room and lowers a rope woven out of caught starlight.",
    choices: [
      { label: "Climb up for the starlight jar", to: "endB1" },
      { label: "Curl up in the boat instead", to: "endB2" },
    ],
  },
  endA1: {
    text: "The whale carries them across the glowing bay to a reef that sings them softly to sleep.",
    ending: "happy",
  },
  endA2: {
    text: "The boat bobs gently home before the whale can answer, and everyone shares a big, sleepy yawn.",
    ending: "over",
  },
  endB1: {
    text: "They light the whole harbor home, and every little boat sails safely in for the night.",
    ending: "happy",
  },
  endB2: {
    text: "The lantern dims, the keeper whispers goodnight, and the story rests until tomorrow.",
    ending: "over",
  },
};

const CHART_PATHS = [
  "M8 50 L30 50",
  "M30 50 C40 50 44 24 52 24",
  "M30 50 C40 50 44 76 52 76",
  "M52 24 C66 24 70 12 78 12",
  "M52 24 C66 24 70 38 78 38",
  "M52 76 C66 76 70 64 78 64",
  "M52 76 C66 76 70 88 78 88",
];

type Marker = {
  id: string;
  left: string;
  top: string;
  label: string;
  labelSize: number;
  style: React.CSSProperties;
  children: React.ReactNode;
};

const DOT = <span style={{ width: 12, height: 12, borderRadius: "50%", background: C.cream }} />;

const MARKERS: ReadonlyArray<Marker> = [
  {
    id: "start",
    left: "8%",
    top: "50%",
    label: "Start",
    labelSize: 11,
    style: {
      width: 50,
      height: 50,
      borderRadius: "50%",
      border: `3px solid ${C.ink}`,
      background: C.sun,
      boxShadow: `0 4px 0 ${C.ink}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 0,
    },
    children: (
      <svg width="26" height="22" viewBox="0 0 100 100" aria-hidden>
        <path d="M50 18 L50 58" stroke={C.ink} strokeWidth="6" strokeLinecap="round" />
        <path d="M50 18 L72 30 L50 42 Z" fill={C.poppyInk} />
        <path d="M20 58 L80 58 L68 78 L32 78 Z" fill={C.ink} />
      </svg>
    ),
  },
  {
    id: "fork",
    left: "30%",
    top: "50%",
    label: "Choose",
    labelSize: 11,
    style: {
      width: 44,
      height: 44,
      borderRadius: "50%",
      border: `3px solid ${C.ink}`,
      background: "#fff",
      boxShadow: `0 4px 0 ${C.ink}`,
      color: C.ink,
      fontFamily: C.disp,
      fontWeight: 800,
      fontSize: 20,
      padding: 0,
    },
    children: "?",
  },
  {
    id: "sceneA",
    left: "52%",
    top: "24%",
    label: "Whale",
    labelSize: 11,
    style: {
      width: 44,
      height: 44,
      borderRadius: "50%",
      border: `3px solid ${C.ink}`,
      background: C.plum,
      boxShadow: `0 4px 0 ${C.ink}`,
      padding: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    children: DOT,
  },
  {
    id: "sceneB",
    left: "52%",
    top: "76%",
    label: "Lighthouse",
    labelSize: 11,
    style: {
      width: 44,
      height: 44,
      borderRadius: "50%",
      border: `3px solid ${C.ink}`,
      background: C.poppy,
      boxShadow: `0 4px 0 ${C.ink}`,
      padding: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    children: DOT,
  },
  {
    id: "endA1",
    left: "78%",
    top: "12%",
    label: "Happy",
    labelSize: 10,
    style: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      border: `3px solid ${C.ink}`,
      background: C.leaf,
      boxShadow: `0 4px 0 ${C.ink}`,
      color: C.ink,
      fontWeight: 800,
      fontSize: 16,
      padding: 0,
    },
    children: "★",
  },
  {
    id: "endA2",
    left: "78%",
    top: "38%",
    label: "Game over",
    labelSize: 10,
    style: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      border: `3px solid ${C.ink}`,
      background: C.plum,
      boxShadow: `0 4px 0 ${C.ink}`,
      fontSize: 15,
      padding: 0,
    },
    children: "🌙",
  },
  {
    id: "endB1",
    left: "78%",
    top: "64%",
    label: "Happy",
    labelSize: 10,
    style: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      border: `3px solid ${C.ink}`,
      background: C.leaf,
      boxShadow: `0 4px 0 ${C.ink}`,
      color: C.ink,
      fontWeight: 800,
      fontSize: 16,
      padding: 0,
    },
    children: "★",
  },
  {
    id: "endB2",
    left: "78%",
    top: "88%",
    label: "Game over",
    labelSize: 10,
    style: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      border: `3px solid ${C.ink}`,
      background: C.plum,
      boxShadow: `0 4px 0 ${C.ink}`,
      fontSize: 15,
      padding: 0,
    },
    children: "🌙",
  },
];

const readerChoiceStyle: React.CSSProperties = {
  cursor: "pointer",
  textAlign: "left",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  background: C.plum,
  color: "#fff",
  border: "none",
  fontFamily: C.disp,
  fontWeight: 800,
  fontSize: 17,
  padding: "17px 18px",
  borderRadius: 20,
  boxShadow: `0 5px 0 ${C.plumInk}`,
};

function StoryMap() {
  const [nodeId, setNodeId] = useState("start");
  const node = MAP_NODES[nodeId];
  const ending = node.ending;
  const promptText = ending
    ? ending === "happy"
      ? "Happy ending"
      : "Gentle game over, never scary"
    : "Your turn. Pick one!";
  const promptColor = ending === "happy" ? C.leafInk : ending === "over" ? C.plumInk : C.ink;

  return (
    <div className="bq-map-grid" style={{ maxWidth: 1040, margin: "40px auto 0" }}>
      {/* The night-sea chart. */}
      <div
        data-reveal="scale"
        style={{
          position: "relative",
          background: C.ink,
          borderRadius: 26,
          boxShadow: `0 14px 0 ${NAVY_SHADOW}`,
          overflow: "hidden",
          minHeight: 410,
        }}
      >
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <span style={{ position: "absolute", left: "20%", top: "14%", width: 4, height: 4, borderRadius: "50%", background: C.cream, animation: "bq-twinkle 3s infinite" }} />
          <span style={{ position: "absolute", left: "66%", top: "20%", width: 3, height: 3, borderRadius: "50%", background: C.sun, animation: "bq-twinkle 2.6s .4s infinite" }} />
          <span style={{ position: "absolute", left: "44%", top: "70%", width: 4, height: 4, borderRadius: "50%", background: C.cream, animation: "bq-twinkle 3.4s .8s infinite" }} />
          <span style={{ position: "absolute", left: "86%", top: "54%", width: 3, height: 3, borderRadius: "50%", background: C.plum, animation: "bq-twinkle 3s 1s infinite" }} />
        </div>
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }} aria-hidden>
          <g fill="none" stroke={C.leafInk} strokeWidth="7" strokeLinecap="round" vectorEffect="non-scaling-stroke">
            {CHART_PATHS.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <g fill="none" stroke={C.cream} strokeWidth="1.6" strokeLinecap="round" strokeDasharray="0.4 5" opacity="0.7" vectorEffect="non-scaling-stroke">
            {CHART_PATHS.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </svg>
        {MARKERS.map((m) => (
          <div key={m.id} style={{ position: "absolute", left: m.left, top: m.top, transform: "translate(-50%,-50%)", textAlign: "center" }}>
            <button
              type="button"
              data-node={m.id}
              onClick={() => setNodeId(m.id)}
              aria-pressed={nodeId === m.id}
              className="bq-press"
              style={{
                cursor: "pointer",
                ...m.style,
                ...(nodeId === m.id ? { outline: `3px solid ${C.sun}`, outlineOffset: "3px" } : {}),
              }}
            >
              {m.children}
            </button>
            <div style={{ fontFamily: C.disp, marginTop: 5, fontWeight: 800, fontSize: m.labelSize, color: C.cream }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* The live reader card. */}
      <div data-reveal="right" data-delay="120" style={{ display: "flex" }}>
        <div
          style={{
            alignSelf: "stretch",
            width: "100%",
            background: "#fff",
            border: `1px solid ${C.line}`,
            borderRadius: 26,
            boxShadow: `0 5px 0 ${C.line}`,
            padding: 26,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <p style={{ margin: 0, fontFamily: C.sans, fontWeight: 600, fontSize: 19, lineHeight: 1.6, color: C.ink, textWrap: "pretty" } as React.CSSProperties}>
            {node.text}
          </p>
          <p style={{ margin: "26px 0 14px", fontFamily: C.disp, fontWeight: 800, fontSize: 18, color: promptColor }}>{promptText}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ending ? (
              <button type="button" className="bq-press" style={readerChoiceStyle} onClick={() => setNodeId("start")}>
                <span>Read it again</span>
                <span style={{ opacity: 0.8 }}>{"›"}</span>
              </button>
            ) : (
              node.choices!.map((c) => (
                <button key={c.to} type="button" className="bq-press" style={readerChoiceStyle} onClick={() => setNodeId(c.to)}>
                  <span>{c.label}</span>
                  <span style={{ opacity: 0.8 }}>{"›"}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stepping stones ("How bedtime sails along").
// ---------------------------------------------------------------------------
type Stone = {
  n: string;
  title: string;
  body: string;
  bg: string;
  shadow: string;
  rotate: number;
  marginTop: number;
  badgeBg: string;
  badgeColor: string;
  icon: React.ReactNode;
};

const STONES: ReadonlyArray<Stone> = [
  {
    n: "1",
    title: "Set up once",
    body: "Add your child by first name and pick Read to me or I can read.",
    bg: C.poppy,
    shadow: C.poppyInk,
    rotate: -4,
    marginTop: 0,
    badgeBg: C.ink,
    badgeColor: C.cream,
    icon: (
      <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
      </svg>
    ),
  },
  {
    n: "2",
    title: "Pick a quest",
    body: "Browse short, gentle stories by age band. Ages 2 to 4 and up.",
    bg: C.sun,
    shadow: C.sunInk,
    rotate: 3,
    marginTop: 66,
    badgeBg: C.ink,
    badgeColor: C.cream,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={SUN_TEXT} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="5" y="3.5" width="14" height="17" rx="2" />
        <path d="M9 8h6M9 12h6" />
      </svg>
    ),
  },
  {
    n: "3",
    title: "Read together",
    body: "One calm scene at a time, with their name woven into the story.",
    bg: C.leaf,
    shadow: C.leafInk,
    rotate: -3,
    marginTop: 6,
    badgeBg: C.ink,
    badgeColor: C.cream,
    icon: (
      <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 6.5C10.5 5 8 4.5 4.5 5v12c3.5-.5 6 0 7.5 1.5" />
        <path d="M12 6.5C13.5 5 16 4.5 19.5 5v12c-3.5-.5-6 0-7.5 1.5" />
      </svg>
    ),
  },
  {
    n: "4",
    title: "They choose the path",
    body: "Big, tappable choices branch the story. They steer where it goes.",
    bg: C.plum,
    shadow: C.plumInk,
    rotate: 4,
    marginTop: 72,
    badgeBg: C.ink,
    badgeColor: C.cream,
    icon: (
      <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 20V9" />
        <path d="M12 9C12 6 9.5 4 6 4M12 9c0-3 2.5-5 6-5" />
        <path d="M3.5 6.5 6 4l2.5 2.5M15.5 4.5 18 4l.6 2.6" />
      </svg>
    ),
  },
  {
    n: "5",
    title: "Find an ending, replay",
    body: "Celebrate the ending you found, then choose differently to collect the rest.",
    bg: C.ink,
    shadow: NAVY_SHADOW,
    rotate: -4,
    marginTop: 12,
    badgeBg: C.poppy,
    badgeColor: "#fff",
    icon: (
      <svg width="42" height="42" viewBox="0 0 24 24" fill={C.sun} stroke={C.sun} strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
        <path d="M12 3.5l2.4 5.2 5.6.6-4.2 3.8 1.2 5.6L12 15.8 6.8 18.9 8 13.1 3.8 9.3l5.6-.6z" />
      </svg>
    ),
  },
];

// ---------------------------------------------------------------------------
// Reassurance items ("Bedtime you can feel good about").
// ---------------------------------------------------------------------------
type Reassure = {
  title: string;
  body: string;
  bg: string;
  shadow: string;
  rotate: number;
  icon: React.ReactNode;
};

const REASSURE: ReadonlyArray<Reassure> = [
  {
    title: "First name only, nothing else",
    body: "No ads, and we never track your child. COPPA conscious by design.",
    bg: C.leaf,
    shadow: C.leafInk,
    rotate: -3,
    icon: (
      <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3l7 3v5c0 4.5-3 7.4-7 9-4-1.6-7-4.5-7-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Gentle by design, never scary",
    body: "Happy endings and soft game overs. A true wind down before sleep.",
    bg: C.plum,
    shadow: C.plumInk,
    rotate: 3,
    icon: (
      <svg width="27" height="27" viewBox="0 0 24 24" fill={C.sun} stroke="none" aria-hidden>
        <path d="M20.5 14.2A8 8 0 1 1 9.8 3.5a6.5 6.5 0 0 0 10.7 10.7z" />
      </svg>
    ),
  },
  {
    title: "Reads their way",
    body: "Bigger text, a dyslexia friendly font, and read to me or I can read modes.",
    bg: C.poppy,
    shadow: C.poppyInk,
    rotate: -3,
    icon: <span style={{ color: "#fff", fontWeight: 800, fontSize: 21, fontFamily: C.disp }}>Aa</span>,
  },
  {
    title: "You stay in control",
    body: "Grown up actions sit behind a simple parent gate. You run the account.",
    bg: C.sun,
    shadow: C.sunInk,
    rotate: 3,
    icon: (
      <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke={SUN_TEXT} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" />
        <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
      </svg>
    ),
  },
];

// Reusable link/button styles for the primary calls to action.
const heroPrimaryCta: React.CSSProperties = {
  background: C.sun,
  color: SUN_TEXT,
  fontWeight: 800,
  fontSize: 18,
  padding: "16px 28px",
  borderRadius: 16,
  boxShadow: `0 6px 0 ${C.sunInk}`,
  display: "inline-flex",
  alignItems: "center",
  gap: 9,
  fontFamily: C.disp,
};

const navLinkStyle: React.CSSProperties = {
  color: "#fff",
  fontWeight: 700,
  fontSize: 15,
  padding: "8px 14px",
  borderRadius: 999,
};

export function WelcomeHome() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("Mia");
  // The hero fork: null until the visitor taps a choice, then 1 or 2.
  const [forkChoice, setForkChoice] = useState<1 | 2 | null>(null);

  // Scroll reveal, ported from the source's componentDidMount. Honors reduced
  // motion by leaving everything in its natural, fully visible state.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const map: Record<string, string> = {
      up: "translateY(30px)",
      left: "translateX(-36px)",
      right: "translateX(36px)",
      scale: "scale(.9)",
      fade: "none",
    };
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    els.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = map[el.dataset.reveal || "up"] || "translateY(30px)";
      el.style.transition = "opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1)";
      el.style.willChange = "opacity, transform";
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          const d = parseInt(el.dataset.delay || "0", 10);
          window.setTimeout(() => {
            el.style.opacity = "1";
            el.style.transform = "none";
          }, d);
          io.unobserve(el);
        });
      },
      { threshold: 0.14 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const displayName = storyName(name);
  const forkLine =
    forkChoice === 1
      ? `A great whale rises, humming a lullaby, and carries ${displayName} across the moonlit bay.`
      : forkChoice === 2
        ? `${displayName} climbs to the lantern room, where a sleepy keeper pours out a jar of caught starlight.`
        : null;
  const nameLine = `And so ${displayName} sailed on, braver than the tide, toward a goodnight all their own.`;

  return (
    <div ref={rootRef} style={{ overflow: "hidden", background: C.sky, color: C.ink, fontFamily: C.sans }}>
      {/* ============ HEADER ============ */}
      <header style={{ background: C.plum, color: "#fff" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, flex: "none" }}>
            <BrandMark size={38} />
            <span style={{ fontFamily: C.disp, fontWeight: 800, fontSize: 22, letterSpacing: "-.01em", whiteSpace: "nowrap" }}>Bedtime Quests</span>
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <a href="#voyage" className="bq-focus" style={navLinkStyle}>
              How it works
            </a>
            <a href="#families" className="bq-focus" style={navLinkStyle}>
              For families
            </a>
            <Link href="/sign-in" className="bq-focus" style={navLinkStyle}>
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="bq-press"
              style={{ background: C.sun, color: SUN_TEXT, fontFamily: C.disp, fontWeight: 800, fontSize: 15, padding: "11px 20px", borderRadius: 14, boxShadow: `0 5px 0 ${C.sunInk}` }}
            >
              Create free account
            </Link>
          </nav>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section style={{ position: "relative", background: C.plum, overflow: "hidden" }}>
        <div style={{ position: "relative", maxWidth: 1160, margin: "0 auto", padding: "58px 28px 70px" }}>
          <div className="bq-hero-grid">
            {/* copy */}
            <div data-reveal="up" style={{ paddingBottom: 56 }}>
              <h1 className="bq-hero-h1" style={{ margin: 0, fontFamily: C.disp, fontWeight: 800, color: "#fff", letterSpacing: "-.015em" }}>
                Tonight, they<br />choose where<br />the story{" "}
                <span style={{ color: C.sun, display: "inline-block", transform: "rotate(-2deg)" }}>sails.</span>
              </h1>
              <p style={{ margin: "24px 0 0", fontSize: 20, lineHeight: 1.55, color: C.cream, fontWeight: 700, maxWidth: "32ch" }}>
                A choose your own adventure bedtime story you read aloud together, starring your child by name.
              </p>
              <div style={{ display: "flex", gap: 16, marginTop: 32, alignItems: "center", flexWrap: "wrap" }}>
                <Link href="/sign-up" className="bq-press" style={heroPrimaryCta}>
                  Create your free account <span style={{ fontSize: 20 }}>{"→"}</span>
                </Link>
                <a
                  href="#voyage"
                  className="bq-press"
                  style={{ background: "#fff", color: C.ink, fontFamily: C.disp, fontWeight: 800, fontSize: 17, padding: "15px 24px", borderRadius: 16, border: `2px solid ${C.plumInk}`, boxShadow: `0 5px 0 ${C.plumInk}` }}
                >
                  See how it works
                </a>
              </div>
              <p style={{ margin: "20px 0 0", fontSize: 15, color: C.accent, fontWeight: 700 }}>Free to start &middot; on the web now, iOS and Android on the way</p>
            </div>

            {/* the fork scene */}
            <div data-reveal="scale" data-delay="140" className="bq-hero-scene" style={{ position: "relative", alignSelf: "stretch" }}>
              <svg viewBox="0 0 420 440" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" style={{ position: "absolute", inset: 0 }} aria-hidden>
                <path d="M210 440 Q210 380 210 320 Q210 250 120 190 Q60 150 60 74" fill="none" stroke={C.leafInk} strokeWidth="40" strokeLinecap="round" />
                <path d="M210 440 Q210 380 210 320 Q210 250 300 190 Q360 150 360 74" fill="none" stroke={C.leafInk} strokeWidth="40" strokeLinecap="round" />
                <path d="M210 440 Q210 380 210 320 Q210 250 120 190 Q60 150 60 74" fill="none" stroke={C.leaf} strokeWidth="28" strokeLinecap="round" />
                <path d="M210 440 Q210 380 210 320 Q210 250 300 190 Q360 150 360 74" fill="none" stroke={C.leaf} strokeWidth="28" strokeLinecap="round" />
              </svg>
              <button
                type="button"
                onClick={() => setForkChoice(1)}
                className="bq-focus"
                style={{ cursor: "pointer", position: "absolute", left: 4, top: 20, textAlign: "left", border: `2px solid ${C.ink}`, background: TEAL, color: "#fff", fontFamily: C.disp, fontWeight: 800, fontSize: 15, padding: "12px 15px", borderRadius: 14, boxShadow: `0 5px 0 ${TEAL_INK}`, transform: "rotate(-3deg)", maxWidth: 170 }}
              >
                Sail to the singing whale
              </button>
              <button
                type="button"
                onClick={() => setForkChoice(2)}
                className="bq-focus"
                style={{ cursor: "pointer", position: "absolute", right: 4, top: 20, textAlign: "left", border: `2px solid ${C.ink}`, background: C.poppy, color: "#fff", fontFamily: C.disp, fontWeight: 800, fontSize: 15, padding: "12px 15px", borderRadius: 14, boxShadow: `0 5px 0 ${C.poppyInk}`, transform: "rotate(3deg)", maxWidth: 170 }}
              >
                Climb the lighthouse stairs
              </button>
              {forkLine && (
                <div
                  role="status"
                  style={{ position: "absolute", left: "50%", bottom: 8, transform: "translateX(-50%)", width: 320, maxWidth: "92%", background: "#fff", borderRadius: 16, padding: "12px 16px", boxShadow: "0 8px 22px -10px rgba(22,40,58,.5)", border: `1px solid ${C.accent}` }}
                >
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, fontWeight: 700, color: C.ink }}>
                    <span style={{ color: C.sunInk }}>{"★"}</span> {forkLine}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* wavy paper divider into the periwinkle band */}
        <svg viewBox="0 0 1440 70" width="100%" height="56" preserveAspectRatio="none" style={{ display: "block", position: "absolute", left: 0, bottom: -1 }} aria-hidden>
          <path d="M0 40 Q180 4 360 30 T720 30 T1080 30 T1440 24 L1440 70 L0 70 Z" fill={C.sky} />
        </svg>
      </section>

      {/* ============ STORY MAP ============ */}
      <section id="voyage" style={{ background: C.sky, padding: "26px 28px 72px", scrollMarginTop: 12 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 data-reveal="up" data-delay="60" style={{ margin: "16px 0 0", fontFamily: C.disp, fontSize: 42, fontWeight: 800, color: C.ink }}>
            Never the same bedtime twice
          </h2>
          <p data-reveal="up" data-delay="120" style={{ margin: "12px auto 0", maxWidth: "54ch", fontSize: 19, color: C.sub, fontWeight: 700 }}>
            Every tap sends the story down a new path. One quest holds many scenes, happy endings, and gentle game overs that are never scary. Tap a stop on the chart to play it in the reader.
          </p>
        </div>
        <StoryMap />
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section style={{ position: "relative", background: C.cream, padding: "0 0 70px" }}>
        <svg viewBox="0 0 1440 60" width="100%" height="46" preserveAspectRatio="none" style={{ display: "block" }} aria-hidden>
          <path d="M0 0 L1440 0 L1440 30 Q1080 60 720 34 T0 34 Z" fill={C.cream} />
        </svg>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 28px" }}>
          <h2 data-reveal="up" style={{ margin: 0, textAlign: "center", fontFamily: C.disp, fontSize: 40, fontWeight: 800, color: C.ink }}>
            How bedtime sails along
          </h2>
          <p data-reveal="up" data-delay="60" style={{ margin: "12px auto 0", maxWidth: "46ch", textAlign: "center", fontSize: 18, color: C.sub, fontWeight: 700 }}>
            Set it up once, then it is the same cozy loop every night: read a scene, let them choose, sail on.
          </p>
          <div style={{ position: "relative", marginTop: 60 }}>
            <svg viewBox="0 0 1000 300" width="100%" height="100%" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, zIndex: 0 }} aria-hidden>
              <path d="M40 90 C 200 30, 240 150, 320 150 S 460 60, 540 120 S 700 240, 780 180 S 940 90, 970 150" fill="none" stroke={TAN} strokeWidth="4" strokeLinecap="round" strokeDasharray="2 15" />
            </svg>
            <div className="bq-steps" style={{ position: "relative", zIndex: 1 }}>
              {STONES.map((s) => (
                <div key={s.n} data-reveal="up" data-delay={String((Number(s.n) - 1) * 90)} style={{ flex: 1, textAlign: "center", marginTop: s.marginTop }}>
                  <div style={{ position: "relative", width: 88, height: 88, margin: "0 auto" }}>
                    <div style={{ width: "100%", height: "100%", borderRadius: 24, background: s.bg, boxShadow: `0 6px 0 ${s.shadow}`, transform: `rotate(${s.rotate}deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {s.icon}
                    </div>
                    <span style={{ position: "absolute", top: -10, right: -10, width: 30, height: 30, borderRadius: "50%", background: s.badgeBg, color: s.badgeColor, fontFamily: C.disp, fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${C.cream}` }}>
                      {s.n}
                    </span>
                  </div>
                  <h3 style={{ margin: "18px 0 0", fontFamily: C.disp, color: C.ink, fontSize: 20, fontWeight: 800 }}>{s.title}</h3>
                  <p style={{ margin: "6px 0 0", color: C.sub, fontWeight: 700, fontSize: 15, lineHeight: 1.5 }}>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <svg viewBox="0 0 1440 60" width="100%" height="46" preserveAspectRatio="none" style={{ display: "block", position: "absolute", bottom: 0, left: 0 }} aria-hidden>
          <path d="M0 60 L1440 60 L1440 20 Q1080 -10 720 26 T0 26 Z" fill={C.sky} />
        </svg>
      </section>

      {/* ============ PERSONALIZATION + TRUST ============ */}
      <section id="families" style={{ background: C.sky, padding: "22px 28px 74px", scrollMarginTop: 12 }}>
        <div className="bq-families-grid" style={{ maxWidth: 1120, margin: "0 auto" }}>
          {/* LEFT: the name moment */}
          <div data-reveal="left">
            <h2 style={{ margin: 0, fontFamily: C.disp, fontSize: 40, lineHeight: 1.06, fontWeight: 800, color: C.ink }}>
              The hero is always <span style={{ color: C.plumInk }}>your child.</span>
            </h2>
            <p style={{ margin: "12px 0 0", fontSize: 18, color: C.sub, fontWeight: 700, lineHeight: 1.5, maxWidth: "36ch" }}>
              Type a first name and watch the story make them the star. First name only, nothing else.
            </p>
            <div style={{ position: "relative", margin: "28px 0 0", maxWidth: 460 }}>
              <div style={{ position: "absolute", inset: "10px 10px -10px 10px", borderRadius: 24, background: TAN, transform: "rotate(1.5deg)" }} />
              <div style={{ position: "relative", background: "#fff", borderRadius: 24, padding: 26, boxShadow: "0 20px 44px -22px rgba(22,40,58,.45)", transform: "rotate(-1deg)" }}>
                <label htmlFor="bq-name" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 }}>
                  Your child&apos;s first name
                </label>
                <input
                  id="bq-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your child's name"
                  maxLength={24}
                  autoComplete="off"
                  className="bq-focus"
                  style={{ width: "100%", textAlign: "center", fontFamily: C.disp, fontWeight: 800, fontSize: 21, color: C.ink, padding: "13px 14px", border: `2px solid ${C.ink}`, borderRadius: 14, background: "#fff", boxShadow: `0 4px 0 ${TAN}` }}
                />
                <p style={{ margin: "20px 0 0", fontSize: 22, lineHeight: 1.5, fontWeight: 700, color: C.ink, fontFamily: C.disp, textAlign: "center" }}>{nameLine}</p>
              </div>
            </div>
          </div>

          {/* RIGHT: reassurance list */}
          <div data-reveal="right" data-delay="120">
            <h3 style={{ margin: 0, fontFamily: C.disp, fontSize: 28, fontWeight: 800, color: C.ink }}>Bedtime you can feel good about</h3>
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 22 }}>
              {REASSURE.map((r) => (
                <div key={r.title} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ flex: "none", width: 54, height: 54, borderRadius: 16, background: r.bg, boxShadow: `0 5px 0 ${r.shadow}`, transform: `rotate(${r.rotate}deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {r.icon}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 18, color: C.ink }}>{r.title}</p>
                    <p style={{ margin: "4px 0 0", fontWeight: 700, fontSize: 15, color: C.sub, lineHeight: 1.45 }}>{r.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section id="start" style={{ position: "relative", background: C.plum, overflow: "hidden", padding: "66px 28px 74px", scrollMarginTop: 12 }}>
        <span style={{ position: "absolute", left: "9%", top: "22%", width: 4, height: 4, borderRadius: "50%", background: C.cream, animation: "bq-twinkle 3s infinite" }} />
        <span style={{ position: "absolute", left: "32%", top: "70%", width: 3, height: 3, borderRadius: "50%", background: C.sun, animation: "bq-twinkle 2.6s .5s infinite" }} />
        <span style={{ position: "absolute", left: "78%", top: "30%", width: 4, height: 4, borderRadius: "50%", background: C.cream, animation: "bq-twinkle 3.4s .9s infinite" }} />
        <span style={{ position: "absolute", left: "90%", top: "66%", width: 3, height: 3, borderRadius: "50%", background: C.cream, animation: "bq-twinkle 3s 1.1s infinite" }} />
        <div style={{ position: "relative", maxWidth: 1160, margin: "0 auto", textAlign: "center" }}>
          <h2 data-reveal="up" style={{ margin: "0 auto", maxWidth: "20ch", fontFamily: C.disp, fontSize: 46, fontWeight: 800, color: "#fff", lineHeight: 1.05 }}>
            Give tonight a happy ending you find <span style={{ color: C.sun }}>together.</span>
          </h2>
          <Link
            href="/sign-up"
            data-reveal="up"
            data-delay="150"
            className="bq-press"
            style={{ display: "inline-flex", marginTop: 30, background: C.sun, color: SUN_TEXT, fontFamily: C.disp, fontWeight: 800, fontSize: 19, padding: "17px 32px", borderRadius: 16, boxShadow: `0 6px 0 ${C.sunInk}` }}
          >
            Create your free account
          </Link>
          <p data-reveal="fade" data-delay="210" style={{ margin: "18px 0 0", color: C.cream, fontWeight: 700, fontSize: 15 }}>
            Free to start. Read your first quest in minutes.
          </p>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ background: C.plum, color: "#fff" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "26px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BrandMark size={30} />
            <span style={{ fontFamily: C.disp, fontWeight: 800, fontSize: 17, whiteSpace: "nowrap" }}>Bedtime Quests</span>
            <span style={{ color: C.accent, fontWeight: 700, fontSize: 14, marginLeft: 6 }}>Choose your own goodnight.</span>
          </div>
          <nav style={{ display: "flex", gap: 18, fontWeight: 700, fontSize: 14, flexWrap: "wrap", alignItems: "center" }}>
            <Link href="/privacy" className="bq-focus" style={{ color: "#fff" }}>
              Privacy
            </Link>
            <Link href="/terms" className="bq-focus" style={{ color: "#fff" }}>
              Terms
            </Link>
            <Link href="/support" className="bq-focus" style={{ color: "#fff" }}>
              Support
            </Link>
            <CookieSettingsLink className="bq-focus cursor-pointer border-0 bg-transparent p-0 text-sm font-bold text-white" />
          </nav>
        </div>
      </footer>
    </div>
  );
}
