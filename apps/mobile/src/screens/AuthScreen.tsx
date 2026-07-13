// apps/mobile/src/screens/AuthScreen.tsx
//
// Sign in / create account, ported from app/sign-in and app/sign-up. The
// parental gate (#32) runs before an account is created (email OR social), never
// before a plain sign in, matching the web rule. Field validation reuses core
// (isValidEmail, PASSWORD_MIN). Auth itself is a local stub in this UI port; the
// real BetterAuth calls are a documented seam (see store.tsx + README).
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { isValidEmail, PASSWORD_MIN } from "@bedtime-quests/core/validation";
import { colors, radius, space } from "../theme/tokens";
import { size, type } from "../theme/typography";
import { Screen } from "../ui/Screen";
import { PaperButton } from "../ui/PaperButton";
import { BrandMark } from "../components/BrandMark";
import { useAppData } from "../data/store";
import { ParentalGate } from "./ParentalGate";

type Mode = "signIn" | "signUp";
type Errors = { name?: string; email?: string; password?: string };

export function AuthScreen() {
  const { signInEmail, signUpEmail, signInSocial } = useAppData();
  const [mode, setMode] = useState<Mode>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [gateVisible, setGateVisible] = useState(false);
  // The action to run once the grown up passes the gate.
  const [pending, setPending] = useState<null | (() => void)>(null);

  const isSignUp = mode === "signUp";

  function validate(): boolean {
    const e: Errors = {};
    if (isSignUp && !name.trim()) e.name = "Please tell us your name.";
    if (!email.trim()) e.email = "Please enter your email.";
    else if (!isValidEmail(email)) e.email = "That email does not look right. Please check for typos.";
    if (!password) e.password = isSignUp ? "Please choose a password." : "Please enter your password.";
    else if (isSignUp && password.length < PASSWORD_MIN)
      e.password = "Please use at least 8 characters so your account stays safe.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function requireGateThen(fn: () => void) {
    setPending(() => fn);
    setGateVisible(true);
  }

  function onPrimary() {
    if (!validate()) return;
    if (isSignUp) requireGateThen(() => signUpEmail(name, email, password));
    else signInEmail(email, password);
  }

  function onSocial(provider: "google" | "apple") {
    if (isSignUp) requireGateThen(() => signInSocial(provider));
    else signInSocial(provider);
  }

  function switchMode() {
    setMode((m) => (m === "signIn" ? "signUp" : "signIn"));
    setErrors({});
  }

  return (
    <Screen scroll center>
      <View style={styles.card}>
        <View style={styles.header}>
          <BrandMark size={56} />
          <Text style={styles.brand}>Bedtime Quests</Text>
          <Text style={styles.subtitle}>{isSignUp ? "Create your account" : "Interactive Stories for Kids"}</Text>
        </View>

        {isSignUp && (
          <Field
            label="Your name"
            value={name}
            onChangeText={setName}
            error={errors.name}
            autoCapitalize="words"
          />
        )}
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View>
          <View style={styles.passwordRow}>
            <Text style={styles.label}>Password</Text>
            {!isSignUp && (
              <Text
                style={styles.forgot}
                accessibilityRole="link"
                onPress={() => Alert.alert("Reset password", "Password reset opens in the app soon.")}
              >
                Forgot password?
              </Text>
            )}
          </View>
          <TextInput
            style={[styles.input, errors.password ? styles.inputError : null]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          {isSignUp && !errors.password && <Text style={styles.hint}>At least 8 characters.</Text>}
          {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
        </View>

        <PaperButton label={isSignUp ? "Create account" : "Sign in"} onPress={onPrimary} style={styles.primary} />

        {isSignUp && (
          <Text style={styles.legal}>By continuing you agree to our Terms of Service and Privacy Policy.</Text>
        )}

        <View style={styles.dividerRow}>
          <View style={styles.rule} />
          <Text style={styles.or}>or</Text>
          <View style={styles.rule} />
        </View>

        <View style={styles.social}>
          <PaperButton label="Continue with Google" variant="secondary" onPress={() => onSocial("google")} />
          <PaperButton label="Continue with Apple" variant="secondary" onPress={() => onSocial("apple")} />
        </View>

        <Text style={styles.switch}>
          {isSignUp ? "Already have an account? " : "New here? "}
          <Text style={styles.switchLink} accessibilityRole="button" onPress={switchMode}>
            {isSignUp ? "Sign in" : "Create an account"}
          </Text>
        </Text>
      </View>

      <ParentalGate
        visible={gateVisible}
        onPass={() => {
          setGateVisible(false);
          pending?.();
          setPending(null);
        }}
        onCancel={() => {
          setGateVisible(false);
          setPending(null);
        }}
      />
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  error,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  keyboardType?: "email-address" | "default";
  autoCapitalize?: "none" | "words";
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.xl,
    gap: space.md,
  },
  header: { alignItems: "center", gap: space.xs, marginBottom: space.sm },
  brand: { ...type.display, fontSize: size.xxl, color: colors.ink },
  subtitle: { ...type.body, fontSize: size.base, color: colors.sub },
  label: { ...type.display, fontSize: size.sm, color: colors.ink, marginBottom: space.xs },
  passwordRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  forgot: { ...type.body, fontSize: size.sm, color: colors.plumInk, textDecorationLine: "underline" },
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
  hint: { ...type.bodyRegular, fontSize: size.xs, color: colors.sub, marginTop: space.xs },
  fieldError: { ...type.body, fontSize: size.xs, color: colors.poppyInk, marginTop: space.xs },
  primary: { marginTop: space.xs },
  legal: { ...type.bodyRegular, fontSize: size.xs, color: colors.sub, textAlign: "center" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  rule: { flex: 1, height: 1, backgroundColor: colors.line },
  or: { ...type.body, fontSize: size.xs, color: colors.sub, textTransform: "uppercase" },
  social: { gap: space.sm },
  switch: { ...type.body, fontSize: size.sm, color: colors.sub, textAlign: "center", marginTop: space.sm },
  switchLink: { color: colors.plumInk, textDecorationLine: "underline" },
});
