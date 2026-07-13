// apps/mobile/src/screens/ChildPickerScreen.tsx
//
// "Who is reading tonight" (ported from components/profiles/child-picker.tsx and
// first-reader-onboarding.tsx). With no readers yet it shows the warm first
// reader onboarding; otherwise a grid of reader cards, an add-reader form, and
// rename. Picking a reader sets the active child, which the Navigator watches to
// advance to the library. All copy is verbatim from web and dash-free.
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, space } from "../theme/tokens";
import { size, type } from "../theme/typography";
import { Screen } from "../ui/Screen";
import { PaperButton } from "../ui/PaperButton";
import { PressableCard } from "../ui/Card";
import { ReadingModeToggle } from "../components/ReadingModeToggle";
import { useAppData } from "../data/store";
import type { ChildProfile, ReadingMode } from "../data/types";

const AVATAR_COLORS = [colors.poppy, colors.leaf, colors.plum, colors.sun];
const avatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

export function ChildPickerScreen() {
  const { children, createChild, updateChild, setActiveChild } = useAppData();
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState<ChildProfile | null>(null);

  if (children.length === 0) {
    return <FirstReaderOnboarding onCreate={(name, mode) => createChild(name, mode)} />;
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.starTile}>
          <Text style={styles.starEmoji}>⭐</Text>
        </View>
        <Text style={styles.h1}>Who stars in tonight's story?</Text>
        <Text style={styles.lead}>
          Pick your child and they become the hero of the story, starring by their own name. Each child keeps their own
          collection.
        </Text>
      </View>

      <View style={styles.grid}>
        {children.map((child) => (
          <View key={child.id} style={styles.gridItem}>
            <PressableCard
              onPress={() => setActiveChild(child.id)}
              accessibilityLabel={`${child.name}. Star in the story`}
              style={styles.childCard}
            >
              <View style={[styles.avatar, { backgroundColor: avatarColor(child.id) }]}>
                <Text style={styles.avatarInitial}>{child.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.childName} numberOfLines={1}>
                {child.name}
              </Text>
              <Text style={styles.starLink}>Star in the story</Text>
            </PressableCard>
            <Pressable
              onPress={() => setRenaming(child)}
              accessibilityLabel={`Rename ${child.name}`}
              hitSlop={8}
              style={styles.pencil}
            >
              <Text style={styles.pencilIcon}>✏️</Text>
            </Pressable>
          </View>
        ))}

        <View style={styles.gridItem}>
          <Pressable
            onPress={() => setAdding(true)}
            accessibilityRole="button"
            accessibilityLabel="Add a reader"
            style={({ pressed }) => [styles.addCard, pressed ? styles.addPressed : null]}
          >
            <Text style={styles.addPlus}>+</Text>
            <Text style={styles.addLabel}>Add a reader</Text>
          </Pressable>
        </View>
      </View>

      <AddReaderModal
        visible={adding}
        onClose={() => setAdding(false)}
        onCreate={(name, mode) => {
          createChild(name, mode);
          setAdding(false);
        }}
      />
      <RenameModal
        child={renaming}
        onClose={() => setRenaming(null)}
        onSave={(name) => {
          if (renaming) updateChild(renaming.id, { name });
          setRenaming(null);
        }}
      />
    </Screen>
  );
}

function FirstReaderOnboarding({ onCreate }: { onCreate: (name: string, mode: ReadingMode) => void }) {
  const [name, setName] = useState("");
  const [mode, setMode] = useState<ReadingMode>("read_to_me");
  const [error, setError] = useState(false);

  const trimmed = name.trim();

  function submit() {
    if (!trimmed) {
      setError(true);
      return;
    }
    onCreate(trimmed, mode);
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.starTile}>
          <Text style={styles.starEmoji}>⭐</Text>
        </View>
        <Text style={styles.h1}>Let's add your first reader</Text>
        <Text style={styles.lead}>
          Add your child and choose how you will read together. Their name becomes the star of every bedtime quest.
        </Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Your child's name</Text>
        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          value={name}
          onChangeText={(t) => {
            setName(t);
            if (error) setError(false);
          }}
          placeholder="Type their name"
          placeholderTextColor={colors.sub}
          autoCapitalize="words"
        />
        <Text style={styles.explain}>
          Your child is a character in the story. We use this name for the hero, so every quest is about them by name.
        </Text>

        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Your child in the story</Text>
          {trimmed ? (
            <Text style={styles.previewText}>
              <Text style={styles.previewName}>{trimmed}</Text> tiptoes into the Whispering Woods, and a little fox waves
              hello.
            </Text>
          ) : (
            <Text style={styles.previewText}>Type a name above to watch your child step into the story.</Text>
          )}
        </View>

        <Text style={styles.legend}>How will {trimmed || "you"} read tonight?</Text>
        <ReadingModeToggle value={mode} onChange={setMode} rich />

        {error && <Text style={styles.fieldError}>Please enter a name.</Text>}

        <PaperButton label="Add reader" onPress={submit} style={styles.formSubmit} />
      </View>
    </Screen>
  );
}

function AddReaderModal({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, mode: ReadingMode) => void;
}) {
  const [name, setName] = useState("");
  const [mode, setMode] = useState<ReadingMode>("read_to_me");
  const [error, setError] = useState(false);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(true);
      return;
    }
    onCreate(trimmed, mode);
    setName("");
    setMode("read_to_me");
    setError(false);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetScrim}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (error) setError(false);
            }}
            placeholder="Their name"
            placeholderTextColor={colors.sub}
            autoCapitalize="words"
          />
          <Text style={[styles.legend, styles.legendTop]}>Reading mode</Text>
          <ReadingModeToggle value={mode} onChange={setMode} />
          {error && <Text style={styles.fieldError}>Please enter a name so we can personalize the stories.</Text>}
          <View style={styles.sheetActions}>
            <PaperButton label="Add reader" onPress={submit} />
            <PaperButton label="Cancel" variant="secondary" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function RenameModal({
  child,
  onClose,
  onSave,
}: {
  child: ChildProfile | null;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState(false);

  // The field is seeded from the child via the modal's onShow below.
  const open = child !== null;

  function submit() {
    if (!name.trim()) {
      setError(true);
      return;
    }
    onSave(name.trim());
    setName("");
    setError(false);
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose} onShow={() => setName(child?.name ?? "")}>
      <View style={styles.dialogScrim}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>Rename {child?.name}</Text>
          <Text style={styles.dialogDesc}>This is the name that stars in their stories.</Text>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (error) setError(false);
            }}
            autoCapitalize="words"
          />
          {error && <Text style={styles.fieldError}>Please enter a name.</Text>}
          <View style={styles.sheetActions}>
            <PaperButton label="Save" onPress={submit} />
            <PaperButton label="Cancel" variant="secondary" onPress={() => { setName(""); setError(false); onClose(); }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", gap: space.sm, marginBottom: space.xl },
  starTile: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.sun, alignItems: "center", justifyContent: "center" },
  starEmoji: { fontSize: 30 },
  h1: { ...type.display, fontSize: size.xxl, color: colors.ink, textAlign: "center" },
  lead: { ...type.body, fontSize: size.base, color: colors.sub, textAlign: "center", maxWidth: 460 },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: space.md },
  gridItem: { width: "47%", position: "relative", marginBottom: space.md },
  childCard: { alignItems: "center", gap: space.sm, paddingVertical: space.xl },
  avatar: { width: 60, height: 60, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  avatarInitial: { ...type.display, fontSize: size.xl, color: colors.onDark },
  childName: { ...type.display, fontSize: size.lg, color: colors.ink },
  starLink: { ...type.display, fontSize: size.sm, color: colors.plumInk },
  pencil: { position: "absolute", top: space.sm, right: space.sm, width: 32, height: 32, borderRadius: 999, backgroundColor: colors.sky, alignItems: "center", justifyContent: "center" },
  pencilIcon: { fontSize: size.sm },

  addCard: {
    borderWidth: 2,
    borderColor: colors.line,
    borderStyle: "dashed",
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
    paddingVertical: space.xl,
    minHeight: 150,
  },
  addPressed: { opacity: 0.6 },
  addPlus: { ...type.display, fontSize: size.huge, color: colors.plumInk },
  addLabel: { ...type.display, fontSize: size.base, color: colors.ink },

  formCard: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.xl, gap: space.sm },
  label: { ...type.display, fontSize: size.sm, color: colors.ink },
  input: {
    ...type.body,
    fontSize: size.base,
    color: colors.ink,
    backgroundColor: colors.sky,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  inputError: { borderColor: colors.poppyInk },
  explain: { ...type.bodyRegular, fontSize: size.sm, color: colors.sub },
  preview: { backgroundColor: colors.accent, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: space.lg, gap: space.xs },
  previewLabel: { ...type.display, fontSize: size.xs, color: colors.plumInk, textTransform: "uppercase", letterSpacing: 1 },
  previewText: { ...type.body, fontSize: size.base, color: colors.ink, lineHeight: 24 },
  previewName: { ...type.display, color: colors.plumInk },
  legend: { ...type.display, fontSize: size.base, color: colors.ink },
  legendTop: { marginTop: space.sm },
  fieldError: { ...type.body, fontSize: size.sm, color: colors.poppyInk },
  formSubmit: { marginTop: space.sm },

  sheetScrim: { flex: 1, backgroundColor: "rgba(22,40,58,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.xl, paddingBottom: space.xxl, gap: space.sm },
  grabber: { alignSelf: "center", width: 40, height: 5, borderRadius: 999, backgroundColor: colors.line, marginBottom: space.sm },
  sheetActions: { gap: space.sm, marginTop: space.lg },

  dialogScrim: { flex: 1, backgroundColor: "rgba(22,40,58,0.55)", justifyContent: "center", padding: space.xl },
  dialog: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.xl, gap: space.sm },
  dialogTitle: { ...type.display, fontSize: size.xl, color: colors.ink },
  dialogDesc: { ...type.bodyRegular, fontSize: size.sm, color: colors.sub, marginBottom: space.sm },
});
