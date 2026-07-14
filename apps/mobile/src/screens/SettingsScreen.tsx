// apps/mobile/src/screens/SettingsScreen.tsx
//
// The parent settings screen (issue #56). It is reachable only from the TopBar
// entry that first passes the parental gate (docs/COMPLIANCE-COPPA.md section 4),
// so everything here is a grown-up control. Today it holds one section: the
// bedtime reminder.
//
// The consent flow, in order (issue #56 requirements 1 and 5):
//   1. Parent-facing context is shown FIRST, above the control: what the reminder
//      is, that it is a gentle nightly nudge for the grown up, on-device, with no
//      data leaving the phone, and off until they turn it on.
//   2. Only when the parent turns it on do we ask the OS for permission.
//   3. A decline is respected: we never nag; we show the state and a path to the
//      OS settings so the parent stays in control.
// All copy is warm and dash-free (UI rule 1); every control is a real Paper Cut
// affordance (rule 2); all text clears AA (rule 3).
import { useEffect, useState } from "react";
import { AppState, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import {
  formatReminderTime,
  stepReminderTime,
  REMINDER_STEP_MINUTES,
  type ReminderTime,
} from "@bedtime-quests/core/notifications";
import { colors, EDGE, radius, space } from "../theme/tokens";
import { size, type } from "../theme/typography";
import { Screen } from "../ui/Screen";
import { Card } from "../ui/Card";
import { PaperButton } from "../ui/PaperButton";
import { TopBar } from "../components/TopBar";
import { useNav } from "../navigation/Navigator";
import { useReminders } from "../notifications/context";
import { useReviewPrompt } from "../review/context";

// The web Help / FAQ page (issue #72). Opening the live first party page keeps the
// answers identical to the web and shared core, so the two never drift, and the
// #contact anchor drops the parent straight onto the contact form and email.
const HELP_URL = "https://bedtimequests.com/support";
const CONTACT_URL = "https://bedtimequests.com/support#contact";

// A few common wind-down times, offered as one-tap presets.
const PRESETS: ReminderTime[] = [
  { hour: 19, minute: 0 },
  { hour: 19, minute: 30 },
  { hour: 20, minute: 0 },
  { hour: 20, minute: 30 },
];

/** A high-contrast, clearly interactive on/off switch (accessibilityRole switch). */
function ToggleSwitch({
  on,
  busy,
  onToggle,
  label,
}: {
  on: boolean;
  busy: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onToggle}
      disabled={busy}
      accessibilityRole="switch"
      accessibilityState={{ checked: on, busy, disabled: busy }}
      accessibilityLabel={label}
      hitSlop={8}
      style={[styles.track, on ? styles.trackOn : styles.trackOff, busy ? styles.trackBusy : null]}
    >
      <View style={[styles.knob, on ? styles.knobOn : styles.knobOff]} />
    </Pressable>
  );
}

export function SettingsScreen() {
  const { goBack } = useNav();
  const { providerName, permission, settings, enableReminder, disableReminder, setReminderTime, refreshPermission } =
    useReminders();
  const review = useReviewPrompt();
  const [busy, setBusy] = useState(false);
  // Only surface the "denied" guidance after a real decline, not on first arrival.
  const [showDenied, setShowDenied] = useState(false);

  // Re-read the OS permission on arrival and whenever the app returns to the
  // foreground, so returning from the OS settings reflects the new state.
  useEffect(() => {
    refreshPermission();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") refreshPermission();
    });
    return () => sub.remove();
  }, [refreshPermission]);

  const onToggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (settings.enabled) {
        await disableReminder();
        setShowDenied(false);
      } else {
        const res = await enableReminder();
        setShowDenied(!res.ok && res.permission === "denied");
      }
    } finally {
      setBusy(false);
    }
  };

  const changeTime = (t: ReminderTime) => {
    void setReminderTime(t);
  };

  const on = settings.enabled;
  const denied = permission === "denied";

  return (
    <Screen scroll>
      <TopBar onBack={goBack} title="Settings" />

      <Text style={styles.h1}>For grown ups</Text>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Bedtime reminder</Text>
        <Text style={styles.body}>
          A gentle nudge for you, the grown up, at the same time each night, so storytime never slips by. It is
          just a reminder on this device. Nothing is sent anywhere and no information about your child is used.
        </Text>
        <Text style={styles.body}>Reminders stay off until you turn them on, and you can turn them off any time.</Text>

        <View style={styles.toggleRow}>
          <View style={styles.toggleLabel}>
            <Text style={styles.toggleTitle}>Nightly storytime reminder</Text>
            <Text style={styles.statusText}>{on ? `On at ${formatReminderTime(settings.time)}` : "Off"}</Text>
          </View>
          <ToggleSwitch on={on} busy={busy} onToggle={onToggle} label="Nightly storytime reminder" />
        </View>

        {denied && showDenied && (
          <View style={styles.callout} accessibilityLiveRegion="polite">
            <Text style={styles.calloutTitle}>Notifications are turned off for this app</Text>
            <Text style={styles.body}>
              To use the bedtime reminder, allow notifications for Bedtime Quests in your device settings, then come
              back and turn it on.
            </Text>
            <View style={styles.calloutActions}>
              <PaperButton label="Open device settings" variant="secondary" fullWidth={false} onPress={() => void Linking.openSettings()} />
              <PaperButton label="Check again" variant="secondary" fullWidth={false} onPress={() => void refreshPermission()} />
            </View>
          </View>
        )}

        {on && (
          <View style={styles.timeBlock}>
            <Text style={styles.label}>Reminder time</Text>
            <View style={styles.stepper}>
              <PaperButton
                label="−"
                variant="secondary"
                fullWidth={false}
                accessibilityLabel="Earlier by fifteen minutes"
                onPress={() => changeTime(stepReminderTime(settings.time, -REMINDER_STEP_MINUTES))}
                style={styles.stepBtn}
              />
              <Text style={styles.time} accessibilityLabel={`Reminder time ${formatReminderTime(settings.time)}`}>
                {formatReminderTime(settings.time)}
              </Text>
              <PaperButton
                label="+"
                variant="secondary"
                fullWidth={false}
                accessibilityLabel="Later by fifteen minutes"
                onPress={() => changeTime(stepReminderTime(settings.time, REMINDER_STEP_MINUTES))}
                style={styles.stepBtn}
              />
            </View>

            <Text style={styles.label}>Quick picks</Text>
            <View style={styles.presets}>
              {PRESETS.map((p) => {
                const selected = p.hour === settings.time.hour && p.minute === settings.time.minute;
                return (
                  <Pressable
                    key={`${p.hour}:${p.minute}`}
                    onPress={() => changeTime(p)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.preset,
                      selected ? styles.presetOn : styles.presetOff,
                      { borderBottomColor: pressed ? "transparent" : selected ? colors.plum : colors.line, transform: [{ translateY: pressed ? EDGE : 0 }] },
                    ]}
                  >
                    <Text style={[styles.presetText, selected ? styles.presetTextOn : null]}>{formatReminderTime(p)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {providerName === "mock" && (
          <Text style={styles.note}>
            Preview build: reminders are simulated here. Install the notifications module in a device build to schedule
            real reminders.
          </Text>
        )}
      </Card>

      {/* Rate and review (issue #71). A manual entry point that ALWAYS lets a
          willing parent open the store review page, even if the well-timed native
          prompt is unavailable or already used. It never gates anything and offers
          no incentive (store policy). Copy is warm and dash-free (UI rules 1/3). */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{review.copy.title}</Text>
        <Text style={styles.body}>{review.copy.body}</Text>
        {review.canOpenStoreListing ? (
          <PaperButton label={review.copy.cta} onPress={() => void review.openStoreListing()} />
        ) : (
          <Text style={styles.body}>{review.copy.unavailable}</Text>
        )}
        {review.providerName === "mock" && (
          <Text style={styles.note}>
            Preview build: this opens a placeholder. Install the store review module in a device build to open the real
            listing.
          </Text>
        )}
      </Card>

      {/* Help and support (issue #72). Opens the web Help / FAQ, which shares its
          content with the app through core, plus a direct path to contact us. Both
          open in the browser via Linking, the same way the paywall opens the legal
          pages. Copy is warm and dash-free (UI rules 1/3). */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Help and support</Text>
        <Text style={styles.body}>
          Find answers to common questions about reading modes, personalization, privacy, and your subscription, or get
          in touch and we will reply by email.
        </Text>
        <PaperButton label="Open help and FAQ" onPress={() => void Linking.openURL(HELP_URL)} />
        <PaperButton label="Contact us" variant="secondary" onPress={() => void Linking.openURL(CONTACT_URL)} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...type.display, fontSize: size.xxl, color: colors.ink, marginTop: space.sm, marginBottom: space.lg },

  section: { gap: space.md },
  sectionTitle: { ...type.display, fontSize: size.xl, color: colors.ink },
  body: { ...type.bodyRegular, fontSize: size.sm, color: colors.ink, lineHeight: 21 },

  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md, marginTop: space.xs },
  toggleLabel: { flexShrink: 1, gap: 2 },
  toggleTitle: { ...type.display, fontSize: size.base, color: colors.ink },
  statusText: { ...type.body, fontSize: size.sm, color: colors.sub },

  // Toggle switch: a plum track when on, a plain track when off; a solid white
  // knob that slides. Both states are high contrast and read as interactive.
  track: { width: 60, height: 34, borderRadius: radius.pill, padding: 3, justifyContent: "center", borderWidth: 2 },
  trackOn: { backgroundColor: colors.plum, borderColor: colors.plumInk, alignItems: "flex-end" },
  trackOff: { backgroundColor: colors.muted, borderColor: colors.line, alignItems: "flex-start" },
  trackBusy: { opacity: 0.6 },
  knob: { width: 24, height: 24, borderRadius: 999, backgroundColor: colors.card },
  knobOn: {},
  knobOff: {},

  callout: { backgroundColor: colors.accent, borderRadius: radius.md, padding: space.lg, gap: space.sm, borderWidth: 1, borderColor: colors.line },
  calloutTitle: { ...type.display, fontSize: size.base, color: colors.ink },
  calloutActions: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.xs },

  timeBlock: { gap: space.sm, marginTop: space.xs },
  label: { ...type.display, fontSize: size.xs, color: colors.sub, textTransform: "uppercase", letterSpacing: 1, marginTop: space.sm },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md },
  stepBtn: { minWidth: 64, paddingHorizontal: space.lg },
  time: { ...type.display, fontSize: size.xl, color: colors.plumInk, flex: 1, textAlign: "center" },

  presets: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  preset: { borderWidth: 2, borderBottomWidth: EDGE, borderRadius: radius.md, paddingHorizontal: space.lg, paddingVertical: space.sm, minHeight: 44, justifyContent: "center" },
  presetOff: { borderColor: colors.line, backgroundColor: colors.card },
  presetOn: { borderColor: colors.plum, backgroundColor: colors.accent },
  presetText: { ...type.display, fontSize: size.sm, color: colors.ink },
  presetTextOn: { color: colors.plumInk },

  note: { ...type.body, fontSize: size.xs, color: colors.sub, marginTop: space.sm },
});
