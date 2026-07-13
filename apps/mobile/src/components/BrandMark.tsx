// apps/mobile/src/components/BrandMark.tsx
//
// A compact native rendering of the brand mark: a paper boat sailing a green sea
// under a crescent moon on the deep navy night sky (see docs/WORKFLOW.md "Brand
// assets"). Built from plain Views to stay dependency-light, using the literal
// brand hex so it matches the web logo. Decorative.
import { StyleSheet, View } from "react-native";
import { colors } from "../theme/tokens";

export function BrandMark({ size = 56 }: { size?: number }) {
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: size * 0.28 }]} accessible={false}>
      {/* Crescent moon, top right. */}
      <View style={[styles.moon, { width: size * 0.24, height: size * 0.24, borderRadius: size }]}>
        <View style={[styles.moonCut, { borderRadius: size }]} />
      </View>
      {/* Green sea. */}
      <View style={[styles.sea, { height: size * 0.3, borderTopLeftRadius: size, borderTopRightRadius: size }]} />
      {/* Boat: sail + hull. */}
      <View style={[styles.boat, { bottom: size * 0.24 }]}>
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: size * 0.11,
            borderRightWidth: size * 0.11,
            borderBottomWidth: size * 0.2,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: colors.cream,
          }}
        />
        <View style={{ width: size * 0.34, height: size * 0.1, backgroundColor: colors.cream, borderBottomLeftRadius: size * 0.06, borderBottomRightRadius: size * 0.06, marginTop: 1 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { backgroundColor: colors.ink, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  moon: { position: "absolute", top: "16%", right: "16%", backgroundColor: colors.cream, overflow: "hidden" },
  moonCut: { position: "absolute", top: "-20%", right: "-30%", width: "90%", height: "90%", backgroundColor: colors.ink },
  sea: { position: "absolute", left: "-20%", right: "-20%", width: "140%", bottom: 0, backgroundColor: colors.leaf },
  boat: { position: "absolute", alignItems: "center" },
});
