// apps/mobile/src/ui/Screen.tsx
//
// The screen container every screen renders inside. It paints the Paper Cut sky
// background and honors safe areas on both phone sizes: SafeAreaView handles the
// iOS notch and home indicator, and we add the Android status bar height on top
// (SafeAreaView is a no-op there). Dependency-light: this uses only react-native
// core, no react-native-safe-area-context.
import type { ReactNode } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { colors, space } from "../theme/tokens";
import { OfflineNotice } from "../components/OfflineNotice";

const androidTop = Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0;

export function Screen({
  children,
  scroll = false,
  center = false,
  padded = true,
  background = colors.sky,
  contentStyle,
}: {
  children: ReactNode;
  /** Wrap content in a ScrollView (for long screens like the library). */
  scroll?: boolean;
  /** Center content vertically + horizontally (auth, pickers, endings). */
  center?: boolean;
  /** Apply the standard horizontal gutter + vertical padding. */
  padded?: boolean;
  background?: string;
  contentStyle?: ViewStyle;
}) {
  const inner: ViewStyle[] = [
    padded ? styles.padded : styles.flush,
    center ? styles.center : null,
    contentStyle ?? null,
  ].filter(Boolean) as ViewStyle[];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background, paddingTop: androidTop }]}>
      {/* Offline state (issue #66): pinned below the safe area, above the content, so
          it is visible on every screen and never scrolls away. Renders null online. */}
      <OfflineNotice />
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, ...inner]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, ...inner]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  padded: { paddingHorizontal: space.lg, paddingVertical: space.lg },
  flush: {},
  center: { justifyContent: "center", alignItems: "center" },
});
