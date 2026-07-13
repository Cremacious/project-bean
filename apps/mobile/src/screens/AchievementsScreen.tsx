// apps/mobile/src/screens/AchievementsScreen.tsx
//
// The collection / achievements view (ported from components/gameplay/*). Shows
// the active reader's stats, per-story progress, and badges. All of it is
// computed by core's buildCollection (via the store), the same builder the web
// app uses, so the numbers and badges match. Copy is verbatim and dash-free.
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Badge } from "@bedtime-quests/core/gameplay/progress";
import type { CollectionStory } from "@bedtime-quests/core/gameplay/collection";
import { colors, radius, space } from "../theme/tokens";
import { size, type } from "../theme/typography";
import { Screen } from "../ui/Screen";
import { Card, PressableCard } from "../ui/Card";
import { StoryCover } from "../components/StoryCover";
import { TopBar } from "../components/TopBar";
import { useAppData } from "../data/store";
import { useNav } from "../navigation/Navigator";

export function AchievementsScreen() {
  const { activeChild, getCollection } = useAppData();
  const { goBack, resetToLibrary, navigate } = useNav();

  const collection = useMemo(
    () => (activeChild ? getCollection(activeChild.id) : null),
    [activeChild, getCollection],
  );

  if (!activeChild || !collection) {
    return (
      <Screen center>
        <Text style={styles.h1}>No reader selected</Text>
      </Screen>
    );
  }

  const started = collection.stories.filter((s) => s.goodFound > 0 || s.complete || s.surprises > 0);

  return (
    <Screen scroll>
      <TopBar onBack={goBack} />

      <Text style={styles.h1}>{activeChild.name}'s Collection</Text>

      <View style={styles.stats}>
        <Stat value={collection.stats.endingsFound} label="Endings found" />
        <Stat value={collection.stats.storiesCompleted} label="Stories finished" />
        <Stat value={collection.stats.surprises} label="Surprises found" />
      </View>

      <Text style={styles.section}>Your stories</Text>
      {started.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📖</Text>
          <Text style={styles.emptyTitle}>No adventures yet</Text>
          <Text style={styles.emptyBody}>Pick a story and finish it to fill your collection with endings and badges.</Text>
          <Text style={styles.emptyLink} accessibilityRole="button" onPress={resetToLibrary}>
            Find a story
          </Text>
        </View>
      ) : (
        <View style={styles.storyList}>
          {started.map((s) => (
            <StoryProgress key={s.slug} story={s} onOpen={() => navigate({ name: "Reader", slug: s.slug })} />
          ))}
        </View>
      )}

      <Text style={styles.section}>Badges</Text>
      <View style={styles.badgeGrid}>
        {collection.badges.map((b) => (
          <BadgeTile key={b.id} badge={b} />
        ))}
      </View>
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <Card style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function StoryProgress({ story, onOpen }: { story: CollectionStory; onOpen: () => void }) {
  const pct = story.goodTotal > 0 ? Math.round((story.goodFound / story.goodTotal) * 100) : 0;
  const surprise =
    story.surprises > 0 ? `${story.surprises} ${story.surprises === 1 ? "surprise" : "surprises"} found` : null;
  return (
    <PressableCard
      onPress={onOpen}
      accessibilityLabel={`${story.title}. ${story.goodFound} of ${story.goodTotal} good endings`}
      background={story.complete ? "#E6F7EF" : colors.card}
      style={styles.progressCard}
    >
      <View style={styles.thumbWrap}>
        <StoryCover slug={story.slug} motif={story.coverMotif} style={styles.thumb} />
        {story.complete && (
          <View style={styles.completeBadge}>
            <Text style={styles.completeMark}>✓</Text>
          </View>
        )}
      </View>
      <View style={styles.progressBody}>
        <View style={styles.progressTop}>
          <Text style={styles.progressTitle} numberOfLines={1}>
            {story.title}
          </Text>
          <Text style={styles.progressCount}>
            {story.goodFound}/{story.goodTotal}
          </Text>
        </View>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: story.complete ? colors.leaf : colors.plum }]} />
        </View>
        {surprise && <Text style={styles.surprise}>{surprise}</Text>}
      </View>
    </PressableCard>
  );
}

function BadgeTile({ badge }: { badge: Badge }) {
  return (
    <Card style={styles.badgeTile}>
      <View style={[styles.badgeIcon, { backgroundColor: badge.earned ? colors.sun : colors.line }]}>
        <Text style={styles.badgeEmoji}>{badge.earned ? badge.icon : "🔒"}</Text>
      </View>
      <Text style={styles.badgeLabel}>{badge.label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  h1: { ...type.display, fontSize: size.xxl, color: colors.ink, marginBottom: space.lg },
  stats: { flexDirection: "row", gap: space.sm },
  statTile: { flex: 1, alignItems: "center", gap: space.xs, paddingVertical: space.lg },
  statValue: { ...type.display, fontSize: size.xxl, color: colors.plumInk },
  statLabel: { ...type.body, fontSize: size.xs, color: colors.sub, textAlign: "center" },

  section: { ...type.display, fontSize: size.lg, color: colors.ink, marginTop: space.xl, marginBottom: space.md },
  storyList: { gap: space.md },
  progressCard: { flexDirection: "row", gap: space.md, alignItems: "center" },
  thumbWrap: { position: "relative" },
  thumb: { width: 62, height: 62, borderRadius: radius.md },
  completeBadge: { position: "absolute", top: -6, right: -6, width: 24, height: 24, borderRadius: 999, backgroundColor: colors.leaf, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.card },
  completeMark: { color: colors.onDark, ...type.display, fontSize: size.xs },
  progressBody: { flex: 1, gap: space.sm },
  progressTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm },
  progressTitle: { ...type.display, fontSize: size.base, color: colors.ink, flex: 1 },
  progressCount: { ...type.display, fontSize: size.sm, color: colors.sub },
  bar: { height: 8, borderRadius: 999, backgroundColor: colors.line, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 999 },
  surprise: { ...type.body, fontSize: size.xs, color: colors.sub },

  empty: { alignItems: "center", gap: space.sm, paddingVertical: space.xl },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { ...type.display, fontSize: size.lg, color: colors.ink },
  emptyBody: { ...type.body, fontSize: size.sm, color: colors.sub, textAlign: "center", maxWidth: 340 },
  emptyLink: { ...type.display, fontSize: size.base, color: colors.plumInk, textDecorationLine: "underline", marginTop: space.xs },

  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  badgeTile: { width: "47%", alignItems: "center", gap: space.sm, paddingVertical: space.lg },
  badgeIcon: { width: 56, height: 56, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  badgeEmoji: { fontSize: 26 },
  badgeLabel: { ...type.display, fontSize: size.sm, color: colors.ink, textAlign: "center" },
});
