// apps/mobile/src/components/ReadingModeToggle.tsx
//
// The "Read to me" / "I can read" selector, shared by the add-reader form and
// the first-reader onboarding (ported from components/profiles/*). Each option
// is a Paper Cut selectable card: it carries the chunky bottom edge + press
// compression so it reads as tappable (UI rule 2), and shows a filled check when
// chosen. Copy is dash-free (UI rule 1).
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, EDGE, radius, space } from "../theme/tokens";
import { size, type } from "../theme/typography";
import type { ReadingMode } from "../data/types";

const OPTIONS: { id: ReadingMode; label: string; note: string; who: string; best: string; icon: string }[] = [
  {
    id: "read_to_me",
    label: "Read to me",
    note: "A grown up reads aloud and taps the choices",
    who: "A grown up reads the story out loud and taps the choices.",
    best: "Best for little ones who are not reading yet.",
    icon: "💬",
  },
  {
    id: "can_read",
    label: "I can read",
    note: "Your child reads and taps, with bigger text",
    who: "Your child reads and taps the choices all on their own.",
    best: "Text starts bigger. Best for new readers finding their feet.",
    icon: "📖",
  },
];

export function ReadingModeToggle({
  value,
  onChange,
  rich = false,
}: {
  value: ReadingMode;
  onChange: (mode: ReadingMode) => void;
  /** Rich layout (onboarding) shows the who + best lines; compact shows the note. */
  rich?: boolean;
}) {
  return (
    <View style={styles.list}>
      {OPTIONS.map((opt) => {
        const selected = value === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
            style={({ pressed }) => [
              styles.option,
              selected ? styles.optionSelected : styles.optionIdle,
              { borderBottomColor: pressed ? "transparent" : selected ? colors.plum : colors.line, transform: [{ translateY: pressed ? EDGE : 0 }] },
            ]}
          >
            <View style={styles.optionHeader}>
              <Text style={styles.optionLabel}>
                {rich ? `${opt.icon}  ` : ""}
                {opt.label}
              </Text>
              <View style={[styles.check, selected ? styles.checkOn : styles.checkOff]}>
                {selected && <Text style={styles.checkMark}>✓</Text>}
              </View>
            </View>
            {rich ? (
              <>
                <Text style={styles.who}>{opt.who}</Text>
                <Text style={styles.best}>{opt.best}</Text>
              </>
            ) : (
              <Text style={styles.note}>{opt.note}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.sm },
  option: {
    borderRadius: radius.md,
    borderWidth: 2,
    borderBottomWidth: EDGE,
    padding: space.lg,
    gap: space.xs,
  },
  optionIdle: { borderColor: colors.line, backgroundColor: colors.card },
  optionSelected: { borderColor: colors.plum, backgroundColor: colors.accent },
  optionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  optionLabel: { ...type.display, fontSize: size.base, color: colors.ink },
  note: { ...type.body, fontSize: size.sm, color: colors.sub },
  who: { ...type.body, fontSize: size.sm, color: colors.ink },
  best: { ...type.bodyRegular, fontSize: size.sm, color: colors.sub },
  check: { width: 24, height: 24, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  checkOn: { backgroundColor: colors.plum },
  checkOff: { borderWidth: 2, borderColor: colors.line },
  checkMark: { color: colors.onDark, fontSize: size.sm, ...type.display },
});
