// apps/mobile/src/ui/Pill.tsx
//
// A small rounded label (age band, Free / Premium, badges). Purely decorative;
// it is never tappable, so it carries no bottom edge. Colors come in tone
// presets that mirror the web badges. All tone text clears WCAG AA (UI rule 3).
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, space } from "../theme/tokens";
import { size, type } from "../theme/typography";

export type PillTone = "age" | "free" | "premium" | "action";

const TONES: Record<PillTone, { bg: string; fg: string }> = {
  age: { bg: colors.accent, fg: colors.plumInk },
  free: { bg: "#E6F7F0", fg: colors.leafInk },
  premium: { bg: "#FFE7DC", fg: colors.poppyInk },
  action: { bg: "#FFF3D6", fg: colors.sunInk },
};

export function Pill({ label, tone = "age" }: { label: string; tone?: PillTone }) {
  const t = TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 1,
    alignSelf: "flex-start",
  },
  text: { ...type.display, fontSize: size.xs },
});
