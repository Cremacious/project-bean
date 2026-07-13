// components/story/story-cover.tsx
// Deterministic paper-cut cover art for a story. Renders one reusable scene so
// a story looks identical on the library card, the collection card, and the
// admin list. Priority: a real illustration (imageUrl) wins; otherwise a
// generated scene, pinned by `motif` or derived from the slug.
//
// The scene is built from edge-anchored layers (sky fill, bottom bands, corner
// moon/sun, a centred focal shape) rather than one fixed-viewBox image, so it
// adapts to every shape a cover appears in: a wide card header, a tall side
// strip, and a small square thumbnail. It is purely decorative and never looks
// clickable (the surrounding card is the interactive element, UI rule 2).
import { resolveMotif, hashSlug, type MotifKey } from "@/lib/stories/covers";

type Props = {
  slug: string;
  motif?: string | null;
  imageUrl?: string | null;
  className?: string;
};

export function StoryCover({ slug, motif, imageUrl, className = "" }: Props) {
  if (imageUrl && imageUrl.trim()) {
    return (
      <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
        {/* Author-supplied illustration at an arbitrary admin-entered URL, so a
            plain <img> (not next/image, which would need per-host remotePatterns).
            Lazy + async so an offscreen card's cover never blocks first paint or
            the main thread. eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
      </div>
    );
  }

  const key = resolveMotif(slug, motif);
  const scene = SCENES[key];
  const h = hashSlug(slug);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: scene.sky }}
      aria-hidden="true"
    >
      {scene.render(h)}
    </div>
  );
}

// --- Deterministic randomness (stars, small variation between same-motif covers). ---
function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// --- Reusable layers. ---
type Pos = { left?: string; right?: string; top?: string; bottom?: string };

/** A full-width band anchored to the bottom edge; its top edge is `path`. */
function Band({ color, height, bottom = 0, path }: { color: string; height: number; bottom?: number; path: string }) {
  return (
    <svg
      className="absolute inset-x-0 w-full"
      style={{ bottom: `${bottom}%`, height: `${height}%` }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={path} fill={color} />
    </svg>
  );
}

const WAVE = "M0 28 Q25 12 50 28 T100 28 V100 H0 Z";
const HILL = "M0 46 Q50 8 100 46 V100 H0 Z";
const HILL_LOW = "M0 60 Q50 34 100 60 V100 H0 Z";

/** Sun disc. */
function Sun({ pos, size = 24 }: { pos: Pos; size?: number }) {
  return <span className="absolute rounded-full" style={{ ...pos, height: `${size}%`, aspectRatio: "1", background: "#FFC24B" }} />;
}

/** Crescent moon: a cream disc with the sky carved out of it. */
function Moon({ pos, sky, size = 26 }: { pos: Pos; sky: string; size?: number }) {
  return (
    <span className="absolute" style={{ ...pos, height: `${size}%`, aspectRatio: "1" }}>
      <span className="relative block h-full w-full overflow-hidden rounded-full" style={{ background: "#FFF1DC" }}>
        <span className="absolute rounded-full" style={{ height: "88%", aspectRatio: "1", right: "-24%", top: "-8%", background: sky }} />
      </span>
    </span>
  );
}

/** A handful of star dots scattered across the upper sky, seeded by the slug. */
function Stars({ h, colors }: { h: number; colors: string[] }) {
  const rand = rng(h);
  const n = 4 + (h % 3); // 4 to 6
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const left = 6 + rand() * 86;
        const top = 6 + rand() * 44;
        const size = 3 + Math.round(rand() * 2);
        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, background: colors[i % colors.length] }}
          />
        );
      })}
    </>
  );
}

/** A centred, aspect-locked focal shape that sits above the ground band. */
function Focal({ viewBox, aspect, height, bottom, children }: {
  viewBox: string; aspect: number; height: string; bottom: string; children: React.ReactNode;
}) {
  return (
    <svg
      className="absolute left-1/2 -translate-x-1/2"
      style={{ bottom, height, aspectRatio: `${aspect}` }}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** The paper boat, mirroring the brand mark. */
function Boat() {
  return (
    <Focal viewBox="0 0 60 50" aspect={1.2} height="36%" bottom="16%">
      <path d="M8 30 L52 30 L45 43 L15 43 Z" fill="#FFF1DC" />
      <path d="M24 30 L32 12 L40 30 Z" fill="#FFF1DC" />
      <path d="M32 12 L32 30" stroke="#E14A2B" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="31.1" y="6.5" width="1.8" height="6.5" rx="0.9" fill="#FFF1DC" />
      <path d="M32.9 7 L41 10 L32.9 13 Z" fill="#FF6B4A" />
    </Focal>
  );
}

// --- One scene per motif. `sky` fills the container; `render` draws the rest. ---
const SCENES: Record<MotifKey, { sky: string; render: (h: number) => React.ReactNode }> = {
  ocean: {
    sky: "#BFE3FF",
    render: () => (
      <>
        <Sun pos={{ right: "12%", top: "12%" }} size={22} />
        <Band color="#7FD8FF" height={34} path={WAVE} />
        <Band color="#2FB98A" height={24} path={WAVE} />
        <Boat />
      </>
    ),
  },
  night: {
    sky: "#16283A",
    render: (h) => (
      <>
        <Moon pos={{ right: "12%", top: "12%" }} sky="#16283A" size={26} />
        <Stars h={h} colors={["#FFC24B", "#FFF1DC", "#2FB98A"]} />
        <Band color="#123A4E" height={32} path={WAVE} />
        <Band color="#2FB98A" height={18} path={WAVE} />
        <Boat />
      </>
    ),
  },
  forest: {
    sky: "#DCF5EA",
    render: () => (
      <>
        <Sun pos={{ left: "12%", top: "14%" }} size={20} />
        <Band color="#8FD9B8" height={44} path={HILL} />
        <Band color="#2FB98A" height={28} path={HILL_LOW} />
        <Focal viewBox="0 0 60 40" aspect={1.5} height="42%" bottom="10%">
          <path d="M14 34 L22 12 L30 34 Z" fill="#1E8F6A" />
          <rect x="20.5" y="32" width="3" height="6" fill="#1E8F6A" />
          <path d="M32 34 L40 16 L48 34 Z" fill="#1E8F6A" />
          <rect x="38.5" y="32" width="3" height="6" fill="#1E8F6A" />
        </Focal>
      </>
    ),
  },
  space: {
    sky: "#2A2350",
    render: (h) => (
      <>
        <Moon pos={{ right: "14%", top: "14%" }} sky="#2A2350" size={20} />
        <Stars h={h} colors={["#FFC24B", "#FFF1DC"]} />
        <Band color="#3A3468" height={16} path={HILL_LOW} />
        <Focal viewBox="0 0 50 50" aspect={1} height="40%" bottom="14%">
          <circle cx="25" cy="27" r="13" fill="#FF6B4A" />
          <ellipse cx="25" cy="27" rx="22" ry="6" fill="none" stroke="#FFC24B" strokeWidth="2.4" transform="rotate(-18 25 27)" />
        </Focal>
      </>
    ),
  },
  castle: {
    sky: "#EDE7FF",
    render: () => (
      <>
        <Moon pos={{ right: "13%", top: "13%" }} sky="#EDE7FF" size={22} />
        <Band color="#B7A9F2" height={40} path={HILL} />
        <Band color="#6C5CE7" height={24} path={HILL_LOW} />
        <Focal viewBox="0 0 60 46" aspect={1.3} height="44%" bottom="12%">
          <rect x="14" y="22" width="32" height="22" fill="#574BC0" />
          <rect x="10" y="16" width="8" height="28" fill="#574BC0" />
          <rect x="42" y="16" width="8" height="28" fill="#574BC0" />
          <path d="M10 16 L14 10 L18 16 Z" fill="#574BC0" />
          <path d="M42 16 L46 10 L50 16 Z" fill="#574BC0" />
          <rect x="27" y="30" width="6" height="14" fill="#FFC24B" />
          <rect x="19" y="27" width="4" height="4" fill="#FFF1DC" />
          <rect x="37" y="27" width="4" height="4" fill="#FFF1DC" />
        </Focal>
      </>
    ),
  },
  meadow: {
    sky: "#FFF1CC",
    render: (h) => {
      const rand = rng(h);
      return (
        <>
          <Sun pos={{ right: "12%", top: "12%" }} size={26} />
          <Band color="#8FD9A8" height={42} path={HILL} />
          <Band color="#2FB98A" height={26} path={HILL_LOW} />
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} className="absolute rounded-full" style={{
              left: `${18 + rand() * 64}%`, bottom: `${6 + rand() * 12}%`,
              height: "7%", aspectRatio: "1", background: "#FF6B4A",
              boxShadow: "inset 0 0 0 2px #FFC24B",
            }} />
          ))}
        </>
      );
    },
  },
};
