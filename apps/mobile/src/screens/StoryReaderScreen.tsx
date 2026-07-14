// apps/mobile/src/screens/StoryReaderScreen.tsx
//
// The story reader (ported from components/story/story-reader.tsx). It builds the
// StoryGraph from authored content via core's graphFromStoryInput, personalizes
// each page with the child's name ({{name}}), lets the reader tap choices, and on
// reaching an ending records it and shows the EndingView with progress. Reading
// font + size come from the child and persist on change. Premium stories are
// gated here too (defensive; the library already routes locked stories away).
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { graphFromStoryInput } from "@bedtime-quests/core/stories/from-input";
import { personalize } from "@bedtime-quests/core/stories/personalize";
import { initialSizeForMode, type ReadingFontId, type ReadingSizeId } from "@bedtime-quests/core/reading-prefs";
import { offlineUnavailableText } from "@bedtime-quests/core/offline";
import { colors, EDGE, radius, space } from "../theme/tokens";
import { readingFontFamily, size as sz, type } from "../theme/typography";
import { Screen } from "../ui/Screen";
import { useAppData, type EndingProgress } from "../data/store";
import { useConnectivity } from "../connectivity/context";
import { useNav } from "../navigation/Navigator";
import { EndingView } from "./EndingView";
import { ReadingSettingsSheet } from "./ReadingSettingsSheet";
import { PaywallScreen } from "./PaywallScreen";

// Native reading sizes (px) keyed to the core size ids. Mirrors the calm, large
// rem scale the web reader uses; kept legible on both phone sizes.
const READ_SIZE: Record<ReadingSizeId, { fontSize: number; lineHeight: number }> = {
  sm: { fontSize: 18, lineHeight: 28 },
  md: { fontSize: 20, lineHeight: 31 },
  lg: { fontSize: 24, lineHeight: 37 },
  xl: { fontSize: 28, lineHeight: 43 },
};

export function StoryReaderScreen({ slug }: { slug: string }) {
  const { getStory, activeChild, storyUnlocked, recordEnding, setReadingPrefs, noteStoryOpened } = useAppData();
  const { isOffline } = useConnectivity();
  const { goBack, navigate, resetToLibrary } = useNav();
  const story = getStory(slug);

  const built = useMemo(() => (story ? graphFromStoryInput(story) : null), [story]);

  // Warm the read-through offline cache with this story the moment it opens (issue
  // #66), so revisiting or finishing it works after a dropped connection.
  useEffect(() => {
    if (story) noteStoryOpened(slug);
  }, [slug, story, noteStoryOpened]);

  const [currentKey, setCurrentKey] = useState<string>(() => built?.startKey ?? "");
  const [progress, setProgress] = useState<EndingProgress | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [font, setFont] = useState<ReadingFontId>(activeChild?.readerFont ?? "rounded");
  const [size, setSize] = useState<ReadingSizeId>(
    initialSizeForMode(activeChild?.readingMode ?? "read_to_me", activeChild?.readerFontSize ?? "md"),
  );

  const pageData = built ? built.graph.pages[currentKey] ?? built.graph.pages[built.startKey] : null;

  // Record the ending the first time the reader lands on an ending page.
  useEffect(() => {
    if (!pageData || !activeChild || !pageData.isEnding) return;
    const p = recordEnding(activeChild.id, slug, pageData.key);
    if (p) setProgress(p);
    // Only re-run when the page changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey]);

  // Persist font/size for this child after a change (skip the first mount).
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (activeChild) setReadingPrefs(activeChild.id, font, size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [font, size]);

  if (!story || !built || !pageData || !activeChild) {
    // If we are offline and the story was never saved, say so calmly instead of a
    // bare error (issue #66). Today the launch library is bundled so this is rare,
    // but it is the right message once story content lives behind the API.
    return (
      <Screen center>
        <Text style={styles.missing}>
          {!story && isOffline ? "We cannot open that story right now" : "We could not open that story."}
        </Text>
        {!story && isOffline && <Text style={styles.missingBody}>{offlineUnavailableText()}</Text>}
        <Pressable onPress={resetToLibrary} accessibilityRole="button">
          <Text style={styles.missingLink}>Back to the library</Text>
        </Pressable>
      </Screen>
    );
  }

  // Defensive paywall gate (library normally routes locked stories to the paywall).
  if (story.premium !== false && !storyUnlocked(true)) {
    return <PaywallScreen storySlug={slug} storyTitle={story.title} />;
  }

  const canRead = activeChild.readingMode === "can_read";
  const goTo = (key: string) => {
    setProgress(null);
    setCurrentKey(key);
  };
  const readAgain = () => goTo(built.startKey);
  const readSize = READ_SIZE[size];

  return (
    <Screen padded={false}>
      {/* Reader header: back, title, reading settings. */}
      <View style={styles.header}>
        <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back to the library" hitSlop={8} style={styles.headerBack}>
          <Text style={styles.headerBackText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {story.title}
        </Text>
        <Pressable
          onPress={() => setSettingsOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Reading settings: text size and font"
          style={({ pressed }) => [styles.settingsBtn, pressed ? styles.pressed : null]}
        >
          <View style={styles.settingsBadge}>
            <Text style={styles.settingsBadgeText}>Aa</Text>
          </View>
          <Text style={styles.settingsLabel}>Reading settings</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {pageData.isEnding ? (
          <EndingView
            endingType={pageData.endingType}
            endingLabel={pageData.endingLabel}
            progress={progress}
            savedOffline={isOffline}
            onReadAgain={readAgain}
            onLibrary={resetToLibrary}
            onSeeEndings={() => navigate({ name: "Achievements" })}
          />
        ) : (
          <View style={styles.article}>
            <Text style={[styles.prose, { fontSize: readSize.fontSize, lineHeight: readSize.lineHeight, fontFamily: readingFontFamily(font) }]}>
              {personalize(pageData.body, activeChild.name)}
            </Text>

            {pageData.choices.length > 0 && (
              <View style={styles.choices}>
                <Text style={[styles.choicePrompt, { fontSize: canRead ? sz.lg : sz.sm }]}>
                  {canRead ? "Your turn. Pick one!" : "Let them choose what happens next."}
                </Text>
                {pageData.choices.map((choice, i) => (
                  <Pressable
                    key={`${choice.to}-${i}`}
                    onPress={() => goTo(choice.to)}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.choice,
                      { borderBottomColor: pressed ? "transparent" : colors.plumInk, transform: [{ translateY: pressed ? EDGE : 0 }] },
                      canRead ? styles.choiceLg : null,
                    ]}
                  >
                    <Text style={[styles.choiceText, { fontSize: canRead ? sz.lg : sz.base }]}>
                      {personalize(choice.label, activeChild.name)}
                    </Text>
                    <Text style={styles.choiceChevron}>›</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <ReadingSettingsSheet
        visible={settingsOpen}
        font={font}
        size={size}
        onFont={setFont}
        onSize={setSize}
        onClose={() => setSettingsOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.sky,
  },
  headerBack: { paddingRight: space.xs },
  headerBackText: { ...type.display, fontSize: 28, color: colors.plumInk },
  headerTitle: { ...type.display, fontSize: sz.lg, color: colors.ink, flex: 1 },
  settingsBtn: { flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, borderBottomWidth: 4, paddingVertical: space.xs + 2, paddingLeft: space.xs + 2, paddingRight: space.md },
  pressed: { opacity: 0.7 },
  settingsBadge: { width: 28, height: 28, borderRadius: radius.sm, backgroundColor: colors.plum, alignItems: "center", justifyContent: "center" },
  settingsBadgeText: { ...type.display, fontSize: sz.xs, color: colors.onDark },
  settingsLabel: { ...type.display, fontSize: sz.xs, color: colors.ink },

  body: { padding: space.lg, paddingBottom: space.xxl, flexGrow: 1, justifyContent: "center" },
  article: { width: "100%", maxWidth: 620, alignSelf: "center" },
  prose: { ...type.body, color: colors.ink, marginBottom: space.xxl },
  choices: { gap: space.md },
  choicePrompt: { ...type.display, color: colors.ink },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    backgroundColor: colors.plum,
    borderRadius: radius.lg,
    borderBottomWidth: EDGE,
    borderBottomColor: colors.plumInk,
    padding: space.lg,
  },
  choiceLg: { padding: space.xl },
  choiceText: { ...type.display, color: colors.onDark, flex: 1 },
  choiceChevron: { ...type.display, fontSize: sz.xl, color: "rgba(255,255,255,0.85)" },

  missing: { ...type.display, fontSize: sz.lg, color: colors.ink, marginBottom: space.md, textAlign: "center" },
  missingBody: { ...type.body, fontSize: sz.sm, color: colors.ink, textAlign: "center", maxWidth: 340, marginBottom: space.md },
  missingLink: { ...type.display, fontSize: sz.base, color: colors.plumInk, textDecorationLine: "underline" },
});
