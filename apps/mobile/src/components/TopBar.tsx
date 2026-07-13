// apps/mobile/src/components/TopBar.tsx
//
// The app header, distilled from components/app-header.tsx for native. In home
// mode it shows the brand, a Collection link, and the current reader with Switch
// + Sign out. In sub mode (onBack given) it shows a Back control and a title.
// Every control is a real Paper Cut affordance (UI rule 2) with high-contrast
// text (UI rule 3).
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, space } from "../theme/tokens";
import { size, type } from "../theme/typography";
import { BrandMark } from "./BrandMark";
import { useAppData } from "../data/store";
import { useNav } from "../navigation/Navigator";

export function TopBar({ onBack, title }: { onBack?: () => void; title?: string }) {
  const { activeChild, clearActiveChild, signOut } = useAppData();
  const { navigate } = useNav();

  if (onBack) {
    return (
      <View style={styles.subBar}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to the library" hitSlop={8} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        {!!title && <Text style={styles.subTitle}>{title}</Text>}
        <View style={styles.backSpacer} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.brandRow}>
          <BrandMark size={32} />
          <Text style={styles.brand}>Bedtime Quests</Text>
        </View>
        <Pressable
          onPress={() => navigate({ name: "Achievements" })}
          accessibilityRole="button"
          accessibilityLabel="My Collection"
          style={({ pressed }) => [styles.collection, pressed ? styles.pressed : null]}
        >
          <Text style={styles.collectionText}>Collection</Text>
        </Pressable>
      </View>

      {activeChild && (
        <View style={styles.readerRow}>
          <Text style={styles.reader} numberOfLines={1}>
            Reading: <Text style={styles.readerName}>{activeChild.name}</Text>
          </Text>
          <View style={styles.readerActions}>
            <Pressable onPress={clearActiveChild} accessibilityRole="button" style={({ pressed }) => [styles.chip, pressed ? styles.pressed : null]}>
              <Text style={styles.chipText}>Switch</Text>
            </Pressable>
            <Pressable onPress={signOut} accessibilityRole="button" style={({ pressed }) => [styles.chip, pressed ? styles.pressed : null]}>
              <Text style={styles.chipText}>Sign out</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md, marginBottom: space.sm },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  brand: { ...type.display, fontSize: size.lg, color: colors.ink },
  collection: { backgroundColor: colors.sun, borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: space.sm, borderBottomWidth: 3, borderBottomColor: colors.sunInk },
  collectionText: { ...type.display, fontSize: size.sm, color: colors.ink },
  pressed: { opacity: 0.7 },

  readerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm },
  reader: { ...type.body, fontSize: size.sm, color: colors.sub, flexShrink: 1 },
  readerName: { ...type.display, color: colors.ink },
  readerActions: { flexDirection: "row", gap: space.sm },
  chip: { backgroundColor: colors.card, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, paddingHorizontal: space.md, paddingVertical: space.xs + 2 },
  chipText: { ...type.display, fontSize: size.xs, color: colors.ink },

  subBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.md },
  backBtn: { paddingVertical: space.xs, paddingRight: space.md },
  backText: { ...type.display, fontSize: size.base, color: colors.plumInk },
  subTitle: { ...type.display, fontSize: size.base, color: colors.ink, flexShrink: 1 },
  backSpacer: { width: 60 },
});
