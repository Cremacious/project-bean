// apps/mobile/src/screens/ReadingSettingsSheet.tsx
//
// The reader's accessibility panel (ported from components/story/reading-
// settings.tsx) as a native bottom sheet: pick text size and reading font. The
// font + size option lists come straight from core (READING_FONTS / READING_SIZES)
// so web and native offer the exact same choices. Copy is verbatim.
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { READING_FONTS, READING_SIZES, type ReadingFontId, type ReadingSizeId } from "@bedtime-quests/core/reading-prefs";
import { colors, EDGE, radius, space } from "../theme/tokens";
import { readingFontFamily, size as sz, type } from "../theme/typography";
import { PaperButton } from "../ui/PaperButton";

const SIZE_PREVIEW = [16, 22, 28, 34];

export function ReadingSettingsSheet({
  visible,
  font,
  size,
  onFont,
  onSize,
  onClose,
}: {
  visible: boolean;
  font: ReadingFontId;
  size: ReadingSizeId;
  onFont: (f: ReadingFontId) => void;
  onSize: (s: ReadingSizeId) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.title}>Reading settings</Text>

          <Text style={styles.section}>Text size</Text>
          <View style={styles.sizeRow}>
            {READING_SIZES.map((s, i) => {
              const selected = size === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => onSize(s.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${s.label} text`}
                  style={({ pressed }) => [
                    styles.sizeTile,
                    selected ? styles.tileSelected : styles.tileIdle,
                    { borderBottomColor: pressed ? "transparent" : selected ? colors.plum : colors.line, transform: [{ translateY: pressed ? EDGE : 0 }] },
                  ]}
                >
                  <Text style={[styles.sizeA, { fontSize: SIZE_PREVIEW[i], color: selected ? colors.plumInk : colors.ink }]}>A</Text>
                  <Text style={styles.sizeLabel}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.section}>Reading font</Text>
          <View style={styles.fontList}>
            {READING_FONTS.map((f) => {
              const selected = font === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => onFont(f.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.fontRow,
                    selected ? styles.tileSelected : styles.tileIdle,
                    { borderBottomColor: pressed ? "transparent" : selected ? colors.plum : colors.line, transform: [{ translateY: pressed ? EDGE : 0 }] },
                  ]}
                >
                  <View style={styles.fontInfo}>
                    <Text style={styles.fontLabel}>{f.label}</Text>
                    <Text style={styles.fontNote}>{f.note}</Text>
                  </View>
                  <Text style={[styles.sample, { fontFamily: readingFontFamily(f.id) }]}>Bean</Text>
                  <View style={[styles.check, selected ? styles.checkOn : styles.checkOff]}>
                    {selected && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <PaperButton label="Done" onPress={onClose} style={styles.done} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: "rgba(22,40,58,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.xl, paddingBottom: space.xxl, gap: space.sm },
  grabber: { alignSelf: "center", width: 40, height: 5, borderRadius: 999, backgroundColor: colors.line, marginBottom: space.sm },
  title: { ...type.display, fontSize: sz.lg, color: colors.ink },
  section: { ...type.display, fontSize: sz.xs, color: colors.sub, textTransform: "uppercase", letterSpacing: 1, marginTop: space.md },

  sizeRow: { flexDirection: "row", gap: space.sm },
  sizeTile: { flex: 1, borderWidth: 2, borderBottomWidth: EDGE, borderRadius: radius.md, alignItems: "center", justifyContent: "center", paddingVertical: space.md, gap: space.xs },
  tileIdle: { borderColor: colors.line, backgroundColor: colors.card },
  tileSelected: { borderColor: colors.plum, backgroundColor: colors.accent },
  sizeA: { ...type.display },
  sizeLabel: { ...type.display, fontSize: 10, color: colors.ink, textTransform: "uppercase" },

  fontList: { gap: space.sm },
  fontRow: { flexDirection: "row", alignItems: "center", gap: space.md, borderWidth: 2, borderBottomWidth: EDGE, borderRadius: radius.md, padding: space.md },
  fontInfo: { flex: 1 },
  fontLabel: { ...type.display, fontSize: sz.sm, color: colors.ink },
  fontNote: { ...type.body, fontSize: sz.xs, color: colors.sub },
  sample: { ...type.body, fontSize: sz.lg, color: colors.ink },
  check: { width: 24, height: 24, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  checkOn: { backgroundColor: colors.plum },
  checkOff: { borderWidth: 2, borderColor: colors.line },
  checkMark: { color: colors.onDark, fontSize: sz.sm, ...type.display },
  done: { marginTop: space.lg },
});
