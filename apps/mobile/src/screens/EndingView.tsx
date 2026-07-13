// apps/mobile/src/screens/EndingView.tsx
//
// The ending screen (ported from components/story/ending-screen.tsx). Two paths:
// a gentle "game over" (a surprise ending, cheerfully framed as try again) and a
// celebratory good ending with the "X of Y good endings" progress dots. Copy is
// verbatim and dash-free (UI rule 1).
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, space } from "../theme/tokens";
import { size, type } from "../theme/typography";
import { PaperButton } from "../ui/PaperButton";

type Progress = { goodFound: number; goodTotal: number; complete: boolean };

export function EndingView({
  endingType,
  endingLabel,
  progress,
  onReadAgain,
  onLibrary,
  onSeeEndings,
}: {
  endingType: string;
  endingLabel: string | null;
  progress: Progress | null;
  onReadAgain: () => void;
  onLibrary: () => void;
  onSeeEndings: () => void;
}) {
  if (endingType === "game_over") {
    return (
      <View style={styles.wrap}>
        <View style={[styles.emojiTile, { backgroundColor: colors.sky }]}>
          <Text style={styles.emoji}>🦉</Text>
        </View>
        <Text style={styles.kicker}>The End</Text>
        <Text style={styles.headline}>Oh no! Let's try again</Text>
        <View style={styles.note}>
          <Text style={styles.noteText}>Surprise ending found!</Text>
        </View>
        <View style={styles.actions}>
          <PaperButton label="Try again" onPress={onReadAgain} />
          <PaperButton label="Back to the library" variant="secondary" onPress={onLibrary} />
        </View>
      </View>
    );
  }

  const complete = progress?.complete ?? false;
  const headline = complete ? "You finished the whole story!" : "You found a good ending!";

  return (
    <View style={styles.wrap}>
      <View style={[styles.emojiTile, { backgroundColor: colors.sun }]}>
        <Text style={styles.emoji}>🎉</Text>
      </View>
      <Text style={styles.kicker}>The End</Text>
      {!!endingLabel && <Text style={styles.headline}>{endingLabel}</Text>}
      <Text style={styles.subhead}>{headline}</Text>

      {progress && (
        <>
          <View style={styles.note}>
            <Text style={styles.noteText}>
              That's{" "}
              <Text style={styles.noteStrong}>
                {progress.goodFound} of {progress.goodTotal}
              </Text>{" "}
              good endings.
            </Text>
          </View>
          <View style={styles.dots}>
            {Array.from({ length: progress.goodTotal }).map((_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: i < progress.goodFound ? colors.leaf : colors.line }]} />
            ))}
          </View>
        </>
      )}

      <View style={styles.actions}>
        <PaperButton label="See my endings" onPress={onSeeEndings} />
        <PaperButton label="Read again" variant="secondary" onPress={onReadAgain} />
        <PaperButton label="Back to the library" variant="secondary" onPress={onLibrary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: space.xl, gap: space.sm },
  emojiTile: { width: 80, height: 80, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", marginBottom: space.sm },
  emoji: { fontSize: 40 },
  kicker: { ...type.display, fontSize: size.base, color: colors.sub, textTransform: "uppercase", letterSpacing: 4 },
  headline: { ...type.display, fontSize: size.xxl, color: colors.ink, textAlign: "center" },
  subhead: { ...type.display, fontSize: size.xl, color: colors.ink, textAlign: "center" },
  note: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: space.lg, paddingVertical: space.md, marginTop: space.sm },
  noteText: { ...type.body, fontSize: size.sm, color: colors.ink },
  noteStrong: { ...type.display, color: colors.poppyInk },
  dots: { flexDirection: "row", gap: space.sm, marginTop: space.md },
  dot: { width: 12, height: 12, borderRadius: 999 },
  actions: { alignSelf: "stretch", gap: space.sm, marginTop: space.lg, maxWidth: 340, width: "100%", alignItems: "stretch" },
});
