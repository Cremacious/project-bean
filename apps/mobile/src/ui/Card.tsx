// apps/mobile/src/ui/Card.tsx
//
// Two surfaces, one look:
//   <Card>          non-interactive panel. Border, soft fill, NO bottom edge, so
//                   it never masquerades as tappable (UI rule 2).
//   <PressableCard> the SAME panel made tappable, so it grows the chunky solid
//                   bottom edge + press compression that marks it clickable.
// Library story cards and child cards use PressableCard; stat tiles, the reader
// body, etc. use Card.
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, EDGE, radius, space } from "../theme/tokens";

const shared: ViewStyle = {
  backgroundColor: colors.card,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.line,
  padding: space.lg,
};

export function Card({
  children,
  style,
  background = colors.card,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  background?: string;
}) {
  return <View style={[shared, { backgroundColor: background }, style]}>{children}</View>;
}

export function PressableCard({
  children,
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  background = colors.card,
  style,
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  background?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        shared,
        styles.edge,
        { backgroundColor: background, borderBottomColor: pressed ? "transparent" : colors.line },
        { transform: [{ translateY: pressed ? EDGE : 0 }] },
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  edge: { borderBottomWidth: EDGE, borderBottomColor: colors.line },
  disabled: { opacity: 0.55 },
});
