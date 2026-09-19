import { Pressable, StyleSheet, Text } from 'react-native';

import { PlaceholderCard } from '@/components/PlaceholderCard';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { currentEnvironment } from '@/config/environments';
import { useAuth } from '@/state/auth-context';
import { colors, metrics, type } from '@/theme/tokens';

export default function MoreScreen() {
  const { session, logout } = useAuth();
  const env = currentEnvironment();

  return (
    <ScreenScaffold title="More" eyebrow="Placeholder">
      <PlaceholderCard
        title={session.user?.name ?? 'Signed in'}
        body={`${session.user?.email ?? ''} · ${session.workspace?.name ?? ''} · ${session.permissions.join(', ') || 'no permissions from /me'}`}
      />
      <PlaceholderCard title="Environment" body={`${env.name} → ${env.apiBaseUrl}`} />
      <PlaceholderCard title="Quotes" body="READY later: GET /api/v1/quotes/{id} and POST send. No quotes list in v1." />
      <Pressable accessibilityRole="button" onPress={() => void logout()} style={styles.signOut}>
        <Text style={styles.signOutLabel}>Sign out</Text>
      </Pressable>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  signOut: {
    minHeight: metrics.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  signOutLabel: {
    ...type.section,
    color: colors.text,
  },
});
