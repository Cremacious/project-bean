// apps/mobile/src/components/UpdateReadyNotice.tsx
//
// The optional, on-brand "update ready" notice (issue #67, requirement 2). It
// renders NOTHING unless a downloaded OTA update is pending, so it has zero visual
// impact in the normal case. When one is ready it shows a calm, high-contrast Paper
// Cut card that reassures the reader the update will be added automatically on the
// next open, and offers an OPTIONAL "add them now" action. It never forces a reload
// and is placed only on the Library (the calm home base), never inside a story, so a
// bedtime session is never interrupted mid-read.
//
// The card itself is non-interactive (a flat <Card> with no bottom edge and the
// default affordance), so it never masquerades as tappable (UI rule 2); the single
// clear affordance is the <PaperButton>. Copy is dash-free (UI rule 1) and ink on a
// light surface (UI rule 3).
import { StyleSheet, Text, View } from "react-native";
import { colors, space } from "../theme/tokens";
import { size, type } from "../theme/typography";
import { Card } from "../ui/Card";
import { PaperButton } from "../ui/PaperButton";
import { useAppUpdates } from "../updates/context";
import { updateReadyCopy } from "../updates/config";

export function UpdateReadyNotice() {
  const { isUpdateReady, applyNow } = useAppUpdates();
  if (!isUpdateReady) return null;

  return (
    <Card style={styles.card}>
      <View accessibilityLiveRegion="polite" style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.emoji}>{updateReadyCopy.emoji}</Text>
          <Text style={styles.title}>{updateReadyCopy.title}</Text>
        </View>
        <Text style={styles.body}>{updateReadyCopy.body}</Text>
        <PaperButton
          label={updateReadyCopy.action}
          variant="secondary"
          size="md"
          fullWidth={false}
          onPress={() => {
            void applyNow();
          }}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: space.lg },
  inner: { gap: space.sm },
  header: { flexDirection: "row", alignItems: "center", gap: space.sm },
  emoji: { fontSize: 22 },
  title: { ...type.display, fontSize: size.lg, color: colors.ink, flex: 1 },
  // High-contrast ink on the light card surface (UI rule 3); wraps rather than clips.
  body: { ...type.body, fontSize: size.sm, color: colors.ink, lineHeight: 20 },
});
