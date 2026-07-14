// apps/mobile/src/components/OfflineNotice.tsx
//
// The calm, on-brand offline banner (issue #66, requirement 3). It renders NOTHING
// while online, so it has zero visual impact in the normal case; when the device is
// offline it shows a warm, high-contrast Paper Cut strip reassuring the reader that
// saved stories still work. It is deliberately NON-interactive: a flat card with no
// bottom edge and the default cursor, so it never masquerades as tappable (UI rule
// 2). Copy comes from core (dash-free, UI rule 1) and is unit-tested there.
//
// Rendered once inside <Screen>, so every screen surfaces the same state below the
// safe area without each screen wiring it up.
import { StyleSheet, Text, View } from "react-native";
import { offlineBannerText } from "@bedtime-quests/core/offline";
import { colors, radius, space } from "../theme/tokens";
import { size, type } from "../theme/typography";
import { useConnectivity } from "../connectivity/context";

export function OfflineNotice() {
  const { isOffline } = useConnectivity();
  if (!isOffline) return null;

  return (
    <View style={styles.wrap} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <View style={styles.banner}>
        <Text style={styles.emoji}>☁️</Text>
        <Text style={styles.text}>{offlineBannerText()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Its own gutter so it lines up with screen content and never touches the edges.
  wrap: { paddingHorizontal: space.lg, paddingTop: space.sm },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  emoji: { fontSize: 20 },
  // High-contrast ink on the light muted surface (UI rule 3), and it flexes so the
  // full sentence wraps rather than truncating.
  text: { ...type.body, fontSize: size.sm, color: colors.ink, flex: 1 },
});
