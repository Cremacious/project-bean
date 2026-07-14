// apps/mobile/src/screens/PaywallScreen.tsx
//
// The paywall + plan picker with REAL native billing (issue #55). Gating is the
// SAME core #33 rule the library uses; purchasing goes through the billing seam
// (src/billing), which is RevenueCat in a dev build with store products, or an
// in-memory mock everywhere else so this whole flow is exercisable with no store
// setup. The grown up passes the parental gate (#32), picks a plan fetched from the
// store offerings, and starts the free trial. Every outcome (success, cancelled,
// pending approval, error) lands on warm, dash-free copy so a parent is never dead
// ended. Prices come from the live offering; plan names, trial length, and savings
// come from core so web and native stay in step.
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, Text, View } from "react-native";
import { TRIAL_DAYS, formatUsd, yearlySavings, type PlanKey } from "@bedtime-quests/core/plans";
import { colors, radius, space } from "../theme/tokens";
import { size, type } from "../theme/typography";
import { Screen } from "../ui/Screen";
import { PaperButton } from "../ui/PaperButton";
import { Card, PressableCard } from "../ui/Card";
import { Pill } from "../ui/Pill";
import { TopBar } from "../components/TopBar";
import { useNav } from "../navigation/Navigator";
import { useAppData } from "../data/store";
import type { OfferedPlan } from "../billing";
import { ParentalGate } from "./ParentalGate";

type Step = "paywall" | "plans" | "pending" | "success";
type Notice = { tone: "info" | "error"; text: string } | null;

const FEATURES = [
  "Every story, ready for tonight and every night",
  "Fresh quests added every month",
  "Cancel anytime, no fuss",
];

// Legal links shown at the point of sale (issue #64). Apple guideline 3.1.2 requires
// FUNCTIONAL links to the Terms of Use and Privacy Policy wherever a subscription is
// offered, so these open the live first party web pages. Required legal links are the
// accepted exception to the kids external link gate, so they are not themselves gated.
const LEGAL_URLS = {
  terms: "https://bedtimequests.com/terms",
  privacy: "https://bedtimequests.com/privacy",
} as const;

// The "By continuing you agree to..." line with the two functional legal links.
// Shared by the value screen and the plan picker so both points of sale disclose the
// same thing (issue #64, GAP 2).
function LegalConsentLine() {
  return (
    <Text style={styles.fine}>
      By continuing you agree to our{" "}
      <Text
        style={styles.fineLink}
        accessibilityRole="link"
        onPress={() => void Linking.openURL(LEGAL_URLS.terms)}
      >
        Terms of Service
      </Text>{" "}
      and{" "}
      <Text
        style={styles.fineLink}
        accessibilityRole="link"
        onPress={() => void Linking.openURL(LEGAL_URLS.privacy)}
      >
        Privacy Policy
      </Text>
      .
    </Text>
  );
}

export function PaywallScreen({ storyTitle }: { storySlug: string; storyTitle?: string }) {
  const { resetToLibrary } = useNav();
  const { getOfferings, purchase, restorePurchases, billingProviderName } = useAppData();

  const [step, setStep] = useState<Step>("paywall");
  const [successKind, setSuccessKind] = useState<"purchased" | "restored">("purchased");
  const [gateVisible, setGateVisible] = useState(false);
  const [selected, setSelected] = useState<PlanKey>("yearly");

  const [offerings, setOfferings] = useState<OfferedPlan[] | null>(null);
  const [offeringsError, setOfferingsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const savings = yearlySavings();
  const isPreview = billingProviderName === "mock";

  // Fetch the store offerings once, up front, so the plan picker shows live prices.
  useEffect(() => {
    let alive = true;
    getOfferings()
      .then((plans) => {
        if (!alive) return;
        setOfferings(plans);
        setOfferingsError(plans.length === 0);
      })
      .catch(() => {
        if (alive) setOfferingsError(true);
      });
    return () => {
      alive = false;
    };
  }, [getOfferings]);

  const selectedOffer = offerings?.find((p) => p.key === selected) ?? null;

  const startTrial = useCallback(async () => {
    setNotice(null);
    setBusy(true);
    try {
      const outcome = await purchase(selected);
      switch (outcome.kind) {
        case "success":
          setSuccessKind("purchased");
          setStep("success");
          break;
        case "cancelled":
          setNotice({
            tone: "info",
            text: "No worries, nothing was charged. Start your free trial whenever your family is ready.",
          });
          break;
        case "pending":
          setStep("pending");
          break;
        case "error":
          setNotice({ tone: "error", text: `${outcome.message} Please try again in a moment.` });
          break;
      }
    } catch {
      setNotice({ tone: "error", text: "Something went wrong. Please try again in a moment." });
    } finally {
      setBusy(false);
    }
  }, [purchase, selected]);

  const onRestore = useCallback(async () => {
    setNotice(null);
    setBusy(true);
    try {
      const outcome = await restorePurchases();
      switch (outcome.kind) {
        case "restored":
          setSuccessKind("restored");
          setStep("success");
          break;
        case "none":
          setNotice({
            tone: "info",
            text: "We did not find a subscription for this account. If you subscribed with another sign in, use that one here.",
          });
          break;
        case "error":
          setNotice({ tone: "error", text: `${outcome.message} Please try again in a moment.` });
          break;
      }
    } catch {
      setNotice({ tone: "error", text: "We could not check your purchases just now. Please try again." });
    } finally {
      setBusy(false);
    }
  }, [restorePurchases]);

  // --- Success (bought or restored) ----------------------------------------
  if (step === "success") {
    return (
      <Screen scroll>
        <TopBar onBack={resetToLibrary} />
        <View style={styles.centerCol}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.h1}>
            {successKind === "restored" ? "Your purchase is restored" : "Every story is unlocked"}
          </Text>
          <Text style={styles.body}>
            {successKind === "restored"
              ? "Welcome back. Every bedtime adventure is open on this account again."
              : `Your ${TRIAL_DAYS} day free trial has started. Every bedtime adventure is ready for tonight.`}
          </Text>
          {isPreview && (
            <Card background={colors.accent} style={styles.info}>
              <Text style={styles.infoText}>
                Preview mode: no app store is connected yet, so nothing was charged. On a real device this unlock comes
                from your App Store or Google Play purchase.
              </Text>
            </Card>
          )}
          <PaperButton label="Start reading" variant="cta" onPress={resetToLibrary} style={styles.cta} />
        </View>
      </Screen>
    );
  }

  // --- Pending approval (e.g. Ask to Buy) ----------------------------------
  if (step === "pending") {
    return (
      <Screen scroll>
        <TopBar onBack={resetToLibrary} />
        <View style={styles.centerCol}>
          <Text style={styles.emoji}>⏳</Text>
          <Text style={styles.h1}>Waiting on a grown up to approve</Text>
          <Text style={styles.body}>
            This purchase needs a family approver to say yes. Once they approve it, every story unlocks on this account
            automatically. You can keep reading the free stories in the meantime.
          </Text>
          <Card background={colors.accent} style={styles.info}>
            <Text style={styles.infoText}>Nothing is charged until the purchase is approved.</Text>
          </Card>
          <PaperButton label="Back to the free stories" variant="cta" onPress={resetToLibrary} style={styles.cta} />
          <Text style={styles.footerLink} accessibilityRole="button" onPress={() => setStep("plans")}>
            Back to the plans
          </Text>
        </View>
      </Screen>
    );
  }

  // --- Plan picker ----------------------------------------------------------
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

          {notice && (
            <Card
              background={notice.tone === "error" ? colors.card : colors.accent}
              style={[styles.info, notice.tone === "error" ? styles.noticeError : null]}
            >
              <Text style={styles.infoText} accessibilityLiveRegion="polite">
                {notice.text}
              </Text>
            </Card>
          )}

          {offerings === null && !offeringsError && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.plumInk} />
              <Text style={styles.loadingText}>Loading the plans</Text>
            </View>
          )}

          {offeringsError && (
            <Card background={colors.card} style={[styles.info, styles.noticeError]}>
              <Text style={styles.infoText}>
                We could not load the plans just now. Please check your connection and try again in a moment.
              </Text>
            </Card>
          )}

          {offerings?.map((plan) => {
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
                  {plan.highlight && <Pill label={`Save ${savings.savingsPercent}%`} tone="free" />}
                </View>
                <Text style={styles.planPrice}>
                  {plan.priceString} a {plan.period}
                </Text>
                <Text style={styles.planCadence}>{plan.period === "year" ? "billed yearly" : "billed monthly"}</Text>
                {plan.key === "yearly" && (
                  <Text style={styles.planSub}>
                    Just {formatUsd(savings.monthlyEquivalentCents)} a month, billed yearly
                  </Text>
                )}
                <View style={[styles.radio, isSel ? styles.radioOn : styles.radioOff]}>
                  <Text style={styles.radioText}>{isSel ? "Selected" : "Choose this plan"}</Text>
                </View>
              </PressableCard>
            );
          })}

          <PaperButton
            label={`Start your ${TRIAL_DAYS} day free trial`}
            variant="cta"
            onPress={startTrial}
            loading={busy}
            disabled={!selectedOffer}
            style={styles.cta}
          />
          {selectedOffer && (
            <Text style={styles.summary}>
              {TRIAL_DAYS} day free trial, then {selectedOffer.priceString} a {selectedOffer.period}. Your subscription
              renews automatically until you cancel, and you can cancel anytime.
            </Text>
          )}

          <LegalConsentLine />

          {isPreview && (
            <Text style={styles.fine}>
              Preview mode: no app store is connected yet, so nothing is charged. Real purchases run through the App
              Store or Google Play.
            </Text>
          )}

          <Text
            style={styles.footerLink}
            accessibilityRole="button"
            onPress={busy ? undefined : onRestore}
          >
            Restore a purchase
          </Text>
          <Text style={styles.footerLink} accessibilityRole="button" onPress={resetToLibrary}>
            Back to the free stories
          </Text>
        </View>
      </Screen>
    );
  }

  // --- Value screen ---------------------------------------------------------
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

        {notice && (
          <Card
            background={notice.tone === "error" ? colors.card : colors.accent}
            style={[styles.info, notice.tone === "error" ? styles.noticeError : null]}
          >
            <Text style={styles.infoText} accessibilityLiveRegion="polite">
              {notice.text}
            </Text>
          </Card>
        )}

        <PaperButton label="Start your free trial" variant="cta" onPress={() => setGateVisible(true)} style={styles.cta} />
        <Text style={styles.fine}>A grown up confirms this step. Plans and pricing are shown before anything is charged.</Text>
        <LegalConsentLine />

        <Text
          style={styles.footerLink}
          accessibilityRole="button"
          onPress={busy ? undefined : onRestore}
        >
          Restore a purchase
        </Text>
        <Text style={styles.footerLink} accessibilityRole="button" onPress={resetToLibrary}>
          Back to the free stories
        </Text>
      </View>

      <ParentalGate
        visible={gateVisible}
        onPass={() => {
          setGateVisible(false);
          setNotice(null);
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
  fineLink: { color: colors.plumInk, textDecorationLine: "underline" },
  footerLink: { ...type.display, fontSize: size.sm, color: colors.plumInk, textDecorationLine: "underline", marginTop: space.sm },

  loadingRow: { flexDirection: "row", alignItems: "center", gap: space.sm, alignSelf: "stretch", justifyContent: "center", paddingVertical: space.md },
  loadingText: { ...type.body, fontSize: size.sm, color: colors.ink },

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
  noticeError: { borderColor: colors.poppyInk, borderBottomColor: colors.poppyInk },
});
