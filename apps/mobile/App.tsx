import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { CORE_PACKAGE, computeIsActive } from '@bedtime-quests/core';

// Placeholder boot screen for milestone M6 (issue #53). The point of this screen
// is to prove the architecture: the native app imports and runs shared logic from
// @bedtime-quests/core, the exact same package the web app uses. Screens and real
// UI arrive in #54; billing and auth in #55.
const coreLinked = typeof computeIsActive === 'function' && CORE_PACKAGE.length > 0;

// Paper Cut palette (literal hex, matching the brand assets).
const NAVY = '#16283A';
const CREAM = '#FFF1DC';
const LEAF = '#2FB98A';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bedtime Quests</Text>
      <Text style={styles.subtitle}>Native app coming soon</Text>
      <Text style={styles.note}>
        {coreLinked ? 'Shared core connected' : 'Shared core not found'}
      </Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: CREAM,
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: CREAM,
    fontSize: 18,
    marginTop: 8,
    textAlign: 'center',
  },
  note: {
    color: LEAF,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 24,
    textAlign: 'center',
  },
});
