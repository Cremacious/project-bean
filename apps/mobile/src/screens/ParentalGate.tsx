// apps/mobile/src/screens/ParentalGate.tsx
//
// The native parental gate (issue #32). It reuses the CHALLENGE logic from core
// (generateGateChallenge / checkGateAnswer) unchanged and only builds the native
// UI around it: a modal that spells three numbers as words and asks the grown up
// to type the digits. A pre reading child cannot; an adult does it in a second.
import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TextInput, View } from "react-native";
import { generateGateChallenge, checkGateAnswer, type GateChallenge } from "@bedtime-quests/core/parental-gate";
import { colors, radius, space } from "../theme/tokens";
import { size, type } from "../theme/typography";
import { PaperButton } from "../ui/PaperButton";

export function ParentalGate({
  visible,
  onPass,
  onCancel,
}: {
  visible: boolean;
  onPass: () => void;
  onCancel: () => void;
}) {
  const [challenge, setChallenge] = useState<GateChallenge>(() => generateGateChallenge());
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  // Fresh numbers every time the gate opens.
  useEffect(() => {
    if (visible) {
      setChallenge(generateGateChallenge());
      setInput("");
      setError(false);
    }
  }, [visible]);

  const submit = () => {
    if (checkGateAnswer(challenge, input)) {
      onPass();
      return;
    }
    // Wrong: new numbers to try (matches web copy + behavior).
    setChallenge(generateGateChallenge());
    setInput("");
    setError(true);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.scrim}>
        <View style={styles.dialog} accessibilityViewIsModal accessibilityLabel="Grown ups only">
          <Text style={styles.title}>Grown ups only</Text>
          <Text style={styles.desc}>A quick check that a grown up is here. If you are a kid, ask a grown up.</Text>

          <Text style={styles.label}>Enter these numbers</Text>
          <Text style={styles.numbers}>{challenge.words.join(", ")}</Text>

          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            keyboardType="number-pad"
            inputMode="numeric"
            placeholder="like 472"
            placeholderTextColor={colors.sub}
            accessibilityLabel={`Enter these numbers: ${challenge.words.join(", ")}`}
            returnKeyType="done"
            onSubmitEditing={submit}
            autoFocus
          />

          {error && (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              That was not quite right. Here are new numbers to try.
            </Text>
          )}

          <View style={styles.actions}>
            <PaperButton label="Continue" onPress={submit} />
            <PaperButton label="Go back" variant="secondary" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: "rgba(22,40,58,0.55)", justifyContent: "center", padding: space.xl },
  dialog: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.xl, gap: space.sm },
  title: { ...type.display, fontSize: size.xl, color: colors.ink },
  desc: { ...type.bodyRegular, fontSize: size.sm, color: colors.ink, marginBottom: space.sm },
  label: { ...type.display, fontSize: size.xs, color: colors.sub, textTransform: "uppercase", letterSpacing: 1, marginTop: space.sm },
  numbers: { ...type.display, fontSize: size.xl, color: colors.plumInk },
  input: {
    ...type.body,
    fontSize: size.lg,
    color: colors.ink,
    backgroundColor: colors.sky,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    marginTop: space.sm,
  },
  error: { ...type.body, fontSize: size.sm, color: colors.poppyInk, marginTop: space.xs },
  actions: { gap: space.sm, marginTop: space.lg },
});
