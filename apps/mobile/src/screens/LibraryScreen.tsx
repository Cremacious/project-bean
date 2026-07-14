// apps/mobile/src/screens/LibraryScreen.tsx
//
// The story library (ported from components/library.tsx). Shows the catalog as
// Paper Cut cards with native covers, an age-band filter, and Free / Premium
// badges. Tapping a free or unlocked story opens the reader; tapping a locked
// premium story opens the paywall, exactly as the web reader route gates on the
// server. Entitlement is decided by core's isStoryUnlocked via the store.
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, space } from "../theme/tokens";
import { size, type } from "../theme/typography";
import { Screen } from "../ui/Screen";
import { PressableCard } from "../ui/Card";
import { Pill } from "../ui/Pill";
import { StoryCover } from "../components/StoryCover";
import { TopBar } from "../components/TopBar";
import { UpdateReadyNotice } from "../components/UpdateReadyNotice";
import { useAppData } from "../data/store";
import { useNav } from "../navigation/Navigator";

const FILTERS: { key: string | null; label: string }[] = [
  { key: null, label: "All" },
  { key: "2-4", label: "Ages 2 to 4" },
  { key: "5-7", label: "Ages 5 to 7" },
  { key: "8+", label: "Ages 8 and up" },
];

function ageLabel(band: string | null): string | null {
  switch (band) {
    case "2-4":
      return "Ages 2 to 4";
    case "5-7":
      return "Ages 5 to 7";
    case "8+":
      return "Ages 8 and up";
    default:
      return null;
  }
}

export function LibraryScreen() {
  const { catalog, activeChild, storyUnlocked } = useAppData();
  const { navigate } = useNav();
  const [filter, setFilter] = useState<string | null>(null);

  const shown = useMemo(() => (filter ? catalog.filter((s) => s.ageBand === filter) : catalog), [catalog, filter]);
  const name = activeChild?.name ?? "friend";

  return (
    <Screen scroll>
      <TopBar />

      {/* Optional OTA "update ready" notice (#67): shows only when an update was
          downloaded in the background and will apply on the next cold start. It lives
          here on the calm library, never inside a story, and never forces a reload. */}
      <UpdateReadyNotice />

      <Text style={styles.h1}>
        What shall we read, <Text style={styles.h1Name}>{name}</Text>?
      </Text>

      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.label}
              onPress={() => setFilter(f.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [styles.filter, active ? styles.filterActive : styles.filterIdle, pressed ? styles.filterPressed : null]}
            >
              <Text style={[styles.filterText, active ? styles.filterTextActive : null]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {shown.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>No stories in this age group yet</Text>
          <Text style={styles.emptyBody}>Try a different age, or peek at all of the stories we have so far.</Text>
          <Text style={styles.emptyLink} accessibilityRole="button" onPress={() => setFilter(null)}>
            See all stories
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {shown.map((story) => {
            const unlocked = storyUnlocked(story.premium);
            const onOpen = () =>
              story.premium && !unlocked
                ? navigate({ name: "Paywall", storySlug: story.slug, storyTitle: story.title })
                : navigate({ name: "Reader", slug: story.slug });
            const age = ageLabel(story.ageBand);
            return (
              <PressableCard
                key={story.slug}
                onPress={onOpen}
                accessibilityLabel={`${story.title}. ${story.premium ? "Premium" : "Free"}`}
                style={styles.card}
              >
                <StoryCover slug={story.slug} motif={story.coverMotif} style={styles.cover} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{story.title}</Text>
                  {!!story.description && (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {story.description}
                    </Text>
                  )}
                  <View style={styles.badges}>
                    {age && <Pill label={age} tone="age" />}
                    {story.premium ? <Pill label="🔒 Premium" tone="premium" /> : <Pill label="Free" tone="free" />}
                    <Pill label={story.premium ? "★ Tap to unlock" : "★ Tap to read"} tone="action" />
                  </View>
                </View>
              </PressableCard>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...type.display, fontSize: size.xxl, color: colors.ink, marginTop: space.md, marginBottom: space.lg },
  h1Name: { color: colors.plumInk },

  filters: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginBottom: space.lg },
  filter: { borderRadius: radius.pill, borderWidth: 2, paddingHorizontal: space.lg, paddingVertical: space.sm, minHeight: 44, justifyContent: "center" },
  filterIdle: { borderColor: colors.line, backgroundColor: colors.card },
  filterActive: { borderColor: colors.plum, backgroundColor: colors.accent },
  filterPressed: { opacity: 0.7 },
  filterText: { ...type.display, fontSize: size.sm, color: colors.ink },
  filterTextActive: { color: colors.plumInk },

  list: { gap: space.lg },
  card: { padding: 0, overflow: "hidden" },
  cover: { width: "100%", height: 128, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  cardBody: { padding: space.lg, gap: space.sm },
  cardTitle: { ...type.display, fontSize: size.lg, color: colors.ink },
  cardDesc: { ...type.body, fontSize: size.sm, color: colors.sub },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.xs },

  empty: { alignItems: "center", gap: space.sm, paddingVertical: space.xxl },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { ...type.display, fontSize: size.lg, color: colors.ink },
  emptyBody: { ...type.body, fontSize: size.sm, color: colors.sub, textAlign: "center", maxWidth: 360 },
  emptyLink: { ...type.display, fontSize: size.base, color: colors.plumInk, textDecorationLine: "underline", marginTop: space.xs },
});
