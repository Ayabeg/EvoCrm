import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PlaceholderCard } from '@/components/PlaceholderCard';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { useAuth } from '@/state/auth-context';
import { colors, metrics, space, type } from '@/theme/tokens';

export default function SignInScreen() {
  const { status, lastError, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <ScreenScaffold title="Foundation auth seam" eyebrow="M06R · not M07 login UX">
      <PlaceholderCard
        title="Sanctum token only"
        body="POST /api/v1/auth/token then GET /api/v1/me. M07 will replace this development chrome. Do not treat this as product sign-in."
      />
      {status === 'expired' ? (
        <PlaceholderCard title="Session expired" body="The stored token was rejected with 401. Sign in again." tone="blocked" />
      ) : null}
      {lastError ? <PlaceholderCard title={lastError.kind} body={lastError.message} tone="blocked" /> : null}
      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="owner@clinic.dz"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={email}
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          style={styles.input}
          value={password}
        />
        <Pressable
          accessibilityRole="button"
          disabled={status === 'authenticating'}
          onPress={() => void login(email, password)}
          style={[styles.button, status === 'authenticating' && styles.buttonDisabled]}>
          <Text style={styles.buttonLabel}>{status === 'authenticating' ? 'Authenticating…' : 'Issue token'}</Text>
        </Pressable>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: space.sm,
  },
  label: {
    ...type.label,
    color: colors.secondary,
  },
  input: {
    minHeight: metrics.minTouch,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    color: colors.text,
    ...type.body,
  },
  button: {
    minHeight: metrics.minTouch,
    backgroundColor: colors.accent,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    ...type.section,
    color: colors.surface,
  },
});
