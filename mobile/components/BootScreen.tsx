import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/state/auth-context';
import { colors, metrics, space, type } from '@/theme/tokens';

export function BootScreen() {
  const { lastError, retryRestore, abandonSession } = useAuth();
  const stuckOffline = lastError?.kind === 'offline' || lastError?.kind === 'timeout' || lastError?.kind === 'server';

  return (
    <SafeAreaView style={styles.safe} accessibilityLabel="Restoring session">
      <View style={styles.body}>
        <Text style={styles.brand}>EvoCRM</Text>
        <Text style={styles.lede}>Restoring your workspace</Text>
        <ActivityIndicator
          accessibilityLabel="Loading"
          color={colors.accent}
          size="large"
          style={styles.spinner}
        />
        {stuckOffline ? (
          <View style={styles.actions}>
            <Text style={styles.hint}>
              The device could not reach the server. Your sign-in was not discarded.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void retryRestore()}
              style={styles.primary}>
              <Text style={styles.primaryLabel}>Try again</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => void abandonSession()}
              style={styles.secondary}>
              <Text style={styles.secondaryLabel}>Use a different account</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    gap: space.md,
  },
  brand: {
    ...type.page,
    color: colors.text,
  },
  lede: {
    ...type.body,
    color: colors.secondary,
  },
  spinner: {
    marginTop: space.lg,
    alignSelf: 'flex-start',
  },
  actions: {
    marginTop: space.xl,
    gap: space.md,
  },
  hint: {
    ...type.body,
    color: colors.secondary,
  },
  primary: {
    minHeight: metrics.minTouch,
    backgroundColor: colors.accent,
    borderRadius: metrics.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    ...type.section,
    color: colors.surface,
  },
  secondary: {
    minHeight: metrics.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    ...type.section,
    color: colors.text,
  },
});
