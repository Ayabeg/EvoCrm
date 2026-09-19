import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlaceholderCard } from '@/components/PlaceholderCard';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { currentEnvironment } from '@/config/environments';
import { useAuth } from '@/state/auth-context';
import { colors, metrics, space, type } from '@/theme/tokens';

export default function MoreScreen() {
  const { session, logout, can } = useAuth();
  const env = currentEnvironment();
  const [signingOut, setSigningOut] = useState(false);
  const [revokeFailed, setRevokeFailed] = useState(false);

  async function onSignOut() {
    setSigningOut(true);
    setRevokeFailed(false);
    const result = await logout();
    if (!result.remoteRevoked) {
      setRevokeFailed(true);
    }
    setSigningOut(false);
  }

  return (
    <ScreenScaffold title="More" eyebrow="Account">
      <View style={styles.card} accessibilityLabel="Account">
        <Text style={styles.kicker}>Signed in as</Text>
        <Text style={styles.name}>{session.user?.name ?? 'Unknown user'}</Text>
        <Text style={styles.meta}>{session.user?.email ?? '—'}</Text>
        <Text style={styles.meta}>Role {session.user?.role ?? '—'}</Text>
      </View>

      <View style={styles.card} accessibilityLabel="Workspace">
        <Text style={styles.kicker}>Workspace</Text>
        <Text style={styles.name}>{session.workspace?.name ?? '—'}</Text>
        <Text style={styles.meta}>
          {session.workspace?.slug ?? '—'} · {session.workspace?.timezone ?? '—'}
        </Text>
        <Text style={styles.hint}>Workspace switching is not available. The server assigns one workspace per token.</Text>
      </View>

      <View style={styles.card} accessibilityLabel="Session permissions">
        <Text style={styles.kicker}>Permissions from /me</Text>
        <Text style={styles.meta}>
          {session.permissions.length > 0 ? session.permissions.join(' · ') : 'None returned'}
        </Text>
        <Text style={styles.hint}>
          CRM edit {can('crm.edit') ? 'allowed for UX' : 'hidden for UX'} · server still enforces
        </Text>
      </View>

      <PlaceholderCard title="Environment" body={`${env.name} → ${env.apiBaseUrl}`} />
      <PlaceholderCard title="Settings" body="Full settings stay on web. This tab is account and session only." />

      {revokeFailed ? (
        <PlaceholderCard
          title="Local sign-out only"
          body="This device was cleared. DELETE /api/v1/auth/token did not confirm revoke."
          tone="blocked"
        />
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy: signingOut, disabled: signingOut }}
        disabled={signingOut}
        onPress={() => void onSignOut()}
        style={styles.signOut}>
        <Text style={styles.signOutLabel}>{signingOut ? 'Signing out…' : 'Sign out'}</Text>
      </Pressable>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: metrics.radius,
    padding: space.lg,
    gap: space.xs,
  },
  kicker: {
    ...type.label,
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    ...type.section,
    color: colors.text,
  },
  meta: {
    ...type.body,
    color: colors.secondary,
  },
  hint: {
    ...type.meta,
    color: colors.muted,
    marginTop: space.xs,
  },
  signOut: {
    minHeight: metrics.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: metrics.radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  signOutLabel: {
    ...type.section,
    color: colors.text,
  },
});
