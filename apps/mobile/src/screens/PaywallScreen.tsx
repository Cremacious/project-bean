// apps/mobile/src/screens/PaywallScreen.tsx
//
// The paywall + plan picker (ported from components/paywall.tsx and
// components/subscribe/plan-selection.tsx). Gating is driven by the SAME
// entitlement rules from core that the library uses. Purchasing is deferred to
// native billing (#55): the grown up passes the parental gate, picks a plan, and
// lands on an honest "starts in the app" screen. Nothing is ever charged and no
// entitlement is faked, mirroring the web app. Plan prices/copy come from core.
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PLAN_LIST, TRIAL_DAYS, formatUsd, yearlySavings, type PlanKey } from "@bedtime-quests/core/plans";
import { colors, radius, space } from "../theme/tokens";
import { size, type } from "../theme/typography";
import { Screen } from "../ui/Screen";
import { PaperButton } from "../ui/PaperButton";
import { Card, PressableCard } from "../ui/Card";
import { Pill } from "../ui/Pill";
import { TopBar } from "../components/TopBar";
import { useNav } from "../navigation/Navigator";
import { ParentalGate } from "./ParentalGate";

type Step = "paywall" | "plans" | "deferred";

const FEATURES = [
  "Every story, ready for tonight and every night",
  "Fresh quests added every month",
  "Cancel anytime, no fuss",
];

export function PaywallScreen({ storyTitle }: { storySlug: string; storyTitle?: string }) {
  const { resetToLibrary } = useNav();
  const [step, setStep] = useState<Step>("paywall");
  const [gateVisible, setGateVisible] = useState(false);
  const [selected, setSelected] = useState<PlanKey>("yearly");

  const savings = yearlySavings();

  if (step === "deferred") {
    return (
      <Screen scroll>
        <TopBar onBack={resetToLibrary} />
        <View style={styles.centerCol}>
          <Text style={styles.emoji}>📱</Text>
          <Text style={styles.h1}>Your free trial starts in the app</Text>
          <Text style={styles.body}>
            Bedtime Quests subscriptions are handled safely inside our app, coming soon to iPhone and Android. When it
            arrives you can start your 7 day free trial there, and every story unlocks on this account right away.
          </Text>
          <Card background={colors.accent} style={styles.info}>
            <Text style={styles.infoText}>Nothing was charged. Your free stories are always here in the meantime.</Text>
          </Card>
          <PaperButton label="Back to the plans" onPress={() => setStep("plans")} style={styles.cta} />
          <Text style={styles.footerLink} accessibilityRole="button" onPress={resetToLibrary}>
            Back to the free stories
          </Text>
        </View>
      </Screen>
    );
  }

  if (step === "plans") {
    return (
      <Screen scroll>
        <TopBar onBack={() => setStep("paywall")} />
        <View style={styles.centerCol}>
          <Text style={styles.h1}>Choose your plan</Text>
          <Text style={styles.body}>
            Every plan starts with a {TRIAL_DAYS} day free trial. Read the whole library free, and only keep going if
            your family loves it.
          </Text>

          {PLAN_LIST.map((plan) => {
            const isSel = selected === plan.key;
            return (
              <PressableCard
                key={plan.key}
                onPress={() => setSelected(plan.key)}
                accessibilityLabel={`${plan.name} plan`}
                background={colors.card}
                style={[styles.plan, isSel ? styles.planSelected : null]}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  {plan.key === "yearly" && <Pill label={`Save ${savings.savingsPercent}%`} tone="free" />}
                </View>
                <Text style={styles.planPrice}>
                  {formatUsd(plan.priceCents)} a {plan.period}
                </Text>
                <Text style={styles.planCadence}>{plan.cadence}</Text>
                {plan.key === "yearly" && (
                  <Text style={styles.planSub}>Just {formatUsd(savings.monthlyEquivalentCents)} a month, billed yearly</Text>
                )}
                <View style={[styles.radio, isSel ? styles.radioOn : styles.radioOff]}>
                  <Text style={styles.radioText}>{isSel ? "Selected" : "Choose this plan"}</Text>
                </View>
              </PressableCard>
            );
          })}

          <PaperButton label={`Start your ${TRIAL_DAYS} day free trial`} variant="cta" onPress={() => setStep("deferred")} style={styles.cta} />
          <Text style={styles.summary}>
            {TRIAL_DAYS} day free trial, then {formatUsd(PLAN_LIST.find((p) => p.key === selected)!.priceCents)} a{" "}
            {PLAN_LIST.find((p) => p.key === selected)!.period}. Cancel anytime.
          </Text>
          <Text style={styles.footerLink} accessibilityRole="button" onPress={resetToLibrary}>
            Back to the free stories
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <TopBar onBack={resetToLibrary} />
      <View style={styles.centerCol}>
        <View style={styles.starTile}>
          <Text style={styles.emoji}>🌟</Text>
        </View>
        <Text style={styles.h1}>Unlock the whole library</Text>
        <Text style={styles.body}>
          {storyTitle ? `${storyTitle} is` : "This story is"} part of Bedtime Quests Premium. Start a free trial to read
          it and every other bedtime adventure.
        </Text>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <PaperButton label="Start your free trial" variant="cta" onPress={() => setGateVisible(true)} style={styles.cta} />
        <Text style={styles.fine}>A grown up confirms this step. Plans and pricing are shown before anything is charged.</Text>
        <Text style={styles.fine}>By continuing you agree to our Terms of Service and Privacy Policy.</Text>
        <Text style={styles.footerLink} accessibilityRole="button" onPress={resetToLibrary}>
          Back to the free stories
        </Text>
      </View>

      <ParentalGate
        visible={gateVisible}
        onPass={() => {
          setGateVisible(false);
          setStep("plans");
        }}
        onCancel={() => setGateVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerCol: { alignItems: "center", gap: space.md, maxWidth: 460, width: "100%", alignSelf: "center" },
  starTile: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 40 },
  h1: { ...type.display, fontSize: size.xxl, color: colors.ink, textAlign: "center" },
  body: { ...type.body, fontSize: size.base, color: colors.ink, textAlign: "center", lineHeight: 24 },
  features: { alignSelf: "stretch", gap: space.sm, marginTop: space.sm },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: space.sm },
  featureCheck: { ...type.display, fontSize: size.base, color: colors.leafInk },
  featureText: { ...type.body, fontSize: size.sm, color: colors.ink, flex: 1 },
  cta: { alignSelf: "stretch", marginTop: space.md },
  fine: { ...type.bodyRegular, fontSize: size.xs, color: colors.sub, textAlign: "center" },
  footerLink: { ...type.display, fontSize: size.sm, color: colors.plumInk, textDecorationLine: "underline", marginTop: space.sm },

  plan: { alignSelf: "stretch", gap: space.xs },
  planSelected: { borderColor: colors.plum, borderBottomColor: colors.plum },
  planHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  planName: { ...type.display, fontSize: size.xl, color: colors.ink },
  planPrice: { ...type.display, fontSize: size.xl, color: colors.ink },
  planCadence: { ...type.body, fontSize: size.sm, color: colors.sub },
  planSub: { ...type.body, fontSize: size.sm, color: colors.leafInk },
  radio: { marginTop: space.sm, borderRadius: radius.pill, paddingVertical: space.xs + 2, paddingHorizontal: space.md, alignSelf: "flex-start" },
  radioOn: { backgroundColor: colors.accent },
  radioOff: { backgroundColor: colors.muted },
  radioText: { ...type.display, fontSize: size.xs, color: colors.plumInk },
  summary: { ...type.body, fontSize: size.sm, color: colors.ink, textAlign: "center" },
  info: { alignSelf: "stretch" },
  infoText: { ...type.body, fontSize: size.sm, color: colors.ink, textAlign: "center" },
});
