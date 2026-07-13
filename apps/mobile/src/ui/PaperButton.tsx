// apps/mobile/src/ui/PaperButton.tsx
//
// The one place UI rule 2 lives: "every clickable element looks distinctly
// clickable." The canonical Paper Cut affordance is a chunky button with a solid
// darker bottom edge that visibly compresses when pressed. On touch there is no
// hover, so the tap cue must be in the RESTING state, which it is: the standing
// bottom edge reads as a raised, pressable surface. On press the face drops onto
// its edge (translateY) and the edge hides, so the compression is felt too.
//
// Reused by every screen so the affordance is defined exactly once. Non
// interactive surfaces use <Card>, which deliberately has no bottom edge.
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, EDGE, radius, space } from "../theme/tokens";
import { size, type } from "../theme/typography";

export type ButtonVariant = "primary" | "cta" | "secondary" | "sun";
type ButtonSize = "md" | "lg";

const VARIANTS: Record<ButtonVariant, { fill: string; edge: string; text: string; border?: string }> = {
  primary: { fill: colors.plum, edge: colors.plumInk, text: colors.onDark },
  cta: { fill: colors.poppy, edge: colors.poppyInk, text: colors.onDark },
  secondary: { fill: colors.card, edge: colors.line, text: colors.ink, border: colors.line },
  sun: { fill: colors.sun, edge: colors.sunInk, text: colors.ink },
};

export function PaperButton({
  label,
  onPress,
  variant = "primary",
  size: sz = "md",
  disabled = false,
  loading = false,
  fullWidth = true,
  accessibilityLabel,
  style,
  children,
}: {
  label?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Custom content instead of a text label. */
  children?: ReactNode;
}) {
  const v = VARIANTS[variant];
  const isDisabled = disabled || loading;
  const padV = sz === "lg" ? space.lg : space.md + 2;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: v.fill,
          paddingVertical: padV,
          borderBottomColor: pressed ? "transparent" : v.edge,
          ...(v.border ? { borderColor: v.border, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1 } : null),
          transform: [{ translateY: pressed ? EDGE : 0 }],
        },
        // A pressable must never look faint (UI rule 3); dim only the fill a touch.
        isDisabled ? styles.disabled : null,
        fullWidth ? styles.full : styles.auto,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : children ? (
        <View style={styles.row}>{children}</View>
      ) : (
        <Text style={[styles.label, { color: v.text, fontSize: sz === "lg" ? size.lg : size.base }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderBottomWidth: EDGE,
    borderBottomColor: colors.plumInk,
    paddingHorizontal: space.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52, // comfortable, thumb-friendly tap target on both phone sizes
  },
  full: { alignSelf: "stretch" },
  auto: { alignSelf: "flex-start" },
  disabled: { opacity: 0.55 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm },
  label: { ...type.display, textAlign: "center" },
});
