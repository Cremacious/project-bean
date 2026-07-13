// apps/mobile/src/components/StoryCover.tsx
//
// Native equivalent of the web StoryCover (components/story/story-cover.tsx).
// The web version composes SVG paper-cut scenes; this build ships no SVG library
// (dependency-light), so it recreates each of the six motifs from plain Views:
// a sky fill, arched ground bands (big top-radius rectangles), a corner sun or
// crescent moon, seeded star dots, and a simple focal shape. Same palette and
// same motif resolution (resolveMotif from core), so a story looks consistent
// with web and identical across every place its cover appears. Decorative only,
// so it is marked non-interactive; the surrounding card is the tappable element.
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { resolveMotif, hashSlug, type MotifKey } from "@bedtime-quests/core/stories/covers";
import { colors } from "../theme/tokens";

// Local seeded RNG (mirrors the web cover's rng) for star scatter, keyed by slug.
function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function Triangle({ w, h, color }: { w: number; h: number; color: string }) {
  // Upward triangle via the classic transparent-border trick.
  return (
    <View
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: w / 2,
        borderRightWidth: w / 2,
        borderBottomWidth: h,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: color,
      }}
    />
  );
}

/** A full-width arched ground band anchored to the bottom edge. */
function Band({ color, heightPct, bottomPct = 0 }: { color: string; heightPct: number; bottomPct?: number }) {
  return (
    <View
      style={{
        position: "absolute",
        left: "-20%",
        right: "-20%",
        width: "140%",
        bottom: `${bottomPct}%`,
        height: `${heightPct}%`,
        backgroundColor: color,
        borderTopLeftRadius: 400,
        borderTopRightRadius: 400,
      }}
    />
  );
}

function Sun({ pos, sizePct = 22 }: { pos: ViewStyle; sizePct?: number }) {
  return <View style={[styles.disc, { backgroundColor: colors.sun, width: `${sizePct}%`, aspectRatio: 1 }, pos]} />;
}

/** Crescent moon: a cream disc with the sky carved out by an overlaid sky disc. */
function Moon({ pos, sky, sizePct = 24 }: { pos: ViewStyle; sky: string; sizePct?: number }) {
  return (
    <View style={[styles.moon, { width: `${sizePct}%`, aspectRatio: 1 }, pos]}>
      <View style={[styles.moonInner, { backgroundColor: sky }]} />
    </View>
  );
}

function Stars({ seed, tones }: { seed: number; tones: string[] }) {
  const rand = rng(seed);
  const n = 4 + (seed % 3); // 4 to 6, matching web
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const left = 6 + rand() * 82;
        const top = 6 + rand() * 40;
        const s = 3 + Math.round(rand() * 2);
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: `${top}%`,
              width: s,
              height: s,
              borderRadius: s,
              backgroundColor: tones[i % tones.length],
            }}
          />
        );
      })}
    </>
  );
}

/** The paper boat used by the ocean + night motifs (hull, sail, flag). */
function Boat() {
  return (
    <View style={styles.boatWrap} pointerEvents="none">
      <Triangle w={26} h={22} color={colors.cream} />
      <View style={styles.flag} />
      <View style={styles.hull} />
    </View>
  );
}

type Scene = { sky: string; render: (seed: number) => React.ReactNode };

const SCENES: Record<MotifKey, Scene> = {
  ocean: {
    sky: "#BFE3FF",
    render: () => (
      <>
        <Sun pos={{ position: "absolute", right: "12%", top: "12%" }} sizePct={22} />
        <Band color="#7FD8FF" heightPct={34} />
        <Band color={colors.leaf} heightPct={22} />
        <Boat />
      </>
    ),
  },
  night: {
    sky: colors.ink,
    render: (seed) => (
      <>
        <Moon pos={{ position: "absolute", right: "12%", top: "12%" }} sky={colors.ink} sizePct={26} />
        <Stars seed={seed} tones={[colors.sun, colors.cream, colors.leaf]} />
        <Band color="#123A4E" heightPct={32} />
        <Band color={colors.leaf} heightPct={16} />
        <Boat />
      </>
    ),
  },
  forest: {
    sky: "#DCF5EA",
    render: () => (
      <>
        <Sun pos={{ position: "absolute", left: "12%", top: "14%" }} sizePct={20} />
        <Band color="#8FD9B8" heightPct={42} />
        <Band color={colors.leaf} heightPct={26} />
        <View style={styles.trees} pointerEvents="none">
          <Triangle w={30} h={40} color={colors.leafInk} />
          <Triangle w={38} h={52} color={colors.leafInk} />
        </View>
      </>
    ),
  },
  space: {
    sky: "#2A2350",
    render: (seed) => (
      <>
        <Moon pos={{ position: "absolute", right: "14%", top: "14%" }} sky="#2A2350" sizePct={20} />
        <Stars seed={seed} tones={[colors.sun, colors.cream]} />
        <Band color="#3A3468" heightPct={16} />
        <View style={styles.planetWrap} pointerEvents="none">
          <View style={styles.planet} />
          <View style={styles.ring} />
        </View>
      </>
    ),
  },
  castle: {
    sky: "#EDE7FF",
    render: () => (
      <>
        <Moon pos={{ position: "absolute", right: "13%", top: "13%" }} sky="#EDE7FF" sizePct={22} />
        <Band color="#B7A9F2" heightPct={40} />
        <Band color={colors.plum} heightPct={22} />
        <View style={styles.castleWrap} pointerEvents="none">
          <View style={styles.turret} />
          <View style={styles.keep} />
          <View style={styles.turret} />
        </View>
      </>
    ),
  },
  meadow: {
    sky: "#FFF1CC",
    render: (seed) => {
      const rand = rng(seed);
      return (
        <>
          <Sun pos={{ position: "absolute", right: "12%", top: "12%" }} sizePct={26} />
          <Band color="#8FD9A8" heightPct={40} />
          <Band color={colors.leaf} heightPct={24} />
          {Array.from({ length: 3 }, (_, i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                left: `${18 + rand() * 60}%`,
                bottom: `${6 + rand() * 12}%`,
                width: "8%",
                aspectRatio: 1,
                borderRadius: 999,
                backgroundColor: colors.poppy,
                borderWidth: 2,
                borderColor: colors.sun,
              }}
            />
          ))}
        </>
      );
    },
  },
};

export function StoryCover({
  slug,
  motif,
  style,
}: {
  slug: string;
  motif?: string | null;
  style?: StyleProp<ViewStyle>;
}) {
  const key = resolveMotif(slug, motif);
  const scene = SCENES[key];
  const seed = hashSlug(slug);
  return (
    <View style={[styles.cover, { backgroundColor: scene.sky }, style]} pointerEvents="none" accessible={false}>
      {scene.render(seed)}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { overflow: "hidden", position: "relative" },
  disc: { position: "absolute", borderRadius: 999 },
  moon: { position: "absolute", borderRadius: 999, overflow: "hidden", backgroundColor: colors.cream },
  moonInner: { position: "absolute", right: "-24%", top: "-8%", width: "88%", aspectRatio: 1, borderRadius: 999 },
  boatWrap: { position: "absolute", bottom: "18%", left: 0, right: 0, alignItems: "center" },
  hull: { width: "38%", height: 12, backgroundColor: colors.cream, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, marginTop: 1 },
  flag: { position: "absolute", top: 0, marginLeft: 24, width: 12, height: 8, backgroundColor: colors.poppy },
  trees: { position: "absolute", bottom: "14%", left: 0, right: 0, flexDirection: "row", justifyContent: "center", alignItems: "flex-end", gap: 6 },
  planetWrap: { position: "absolute", bottom: "16%", left: 0, right: 0, alignItems: "center", justifyContent: "center" },
  planet: { width: "26%", aspectRatio: 1, borderRadius: 999, backgroundColor: colors.poppy },
  ring: { position: "absolute", width: "46%", height: "16%", borderRadius: 999, borderWidth: 2.4, borderColor: colors.sun, transform: [{ rotate: "-18deg" }] },
  castleWrap: { position: "absolute", bottom: "12%", left: 0, right: 0, flexDirection: "row", justifyContent: "center", alignItems: "flex-end", gap: 2 },
  keep: { width: "22%", height: 34, backgroundColor: colors.plumInk },
  turret: { width: "9%", height: 26, backgroundColor: colors.plumInk },
});
