import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { hasLoginFieldErrors, validateLoginFields } from '@/lib/auth/login-validation';
import { useAuth } from '@/state/auth-context';
import { colors, metrics, space, type } from '@/theme/tokens';

export default function SignInScreen() {
  const { status, lastError, lastLogoutRemoteRevoked, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const busy = status === 'authenticating';

  const serverEmailError = lastError?.fieldErrors.email?.[0];
  const emailError = fieldErrors.email ?? serverEmailError;
  const passwordError = fieldErrors.password;
  const banner =
    lastError && lastError.kind !== 'validation'
      ? lastError.message
      : status === 'expired'
        ? 'Your session expired. Sign in again.'
        : lastLogoutRemoteRevoked === false
          ? 'Signed out on this device. The server could not confirm token revoke.'
          : null;

  function submit() {
    const next = validateLoginFields(email, password);
    setFieldErrors(next);
    if (hasLoginFieldErrors(next)) {
      return;
    }
    void login(email, password);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <Text accessibilityRole="header" style={styles.brand}>
            EvoCRM
          </Text>
          <Text style={styles.lede}>Sign in to your workspace</Text>

          {banner ? (
            <View
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
              style={styles.banner}>
              <Text style={styles.bannerText}>{banner}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text nativeID="email-label" style={styles.label}>
              Email
            </Text>
            <TextInput
              accessibilityLabel="Email"
              accessibilityLabelledBy="email-label"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!busy}
              keyboardType="email-address"
              onChangeText={(value) => {
                setEmail(value);
                setFieldErrors((current) => ({ ...current, email: undefined }));
              }}
              onSubmitEditing={submit}
              placeholder="you@workspace.com"
              placeholderTextColor={colors.muted}
              returnKeyType="next"
              style={[styles.input, emailError ? styles.inputError : null]}
              textContentType="emailAddress"
              value={email}
            />
            {emailError ? (
              <Text accessibilityLiveRegion="polite" style={styles.error}>
                {emailError}
              </Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text nativeID="password-label" style={styles.label}>
              Password
            </Text>
            <TextInput
              accessibilityLabel="Password"
              accessibilityLabelledBy="password-label"
              autoCapitalize="none"
              autoComplete="password"
              editable={!busy}
              onChangeText={(value) => {
                setPassword(value);
                setFieldErrors((current) => ({ ...current, password: undefined }));
              }}
              onSubmitEditing={submit}
              placeholder="Password"
              placeholderTextColor={colors.muted}
              returnKeyType="go"
              secureTextEntry
              style={[styles.input, passwordError ? styles.inputError : null]}
              textContentType="password"
              value={password}
            />
            {passwordError ? (
              <Text accessibilityLiveRegion="polite" style={styles.error}>
                {passwordError}
              </Text>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy, disabled: busy }}
            disabled={busy}
            onPress={submit}
            style={({ pressed }) => [
              styles.button,
              busy || pressed ? styles.buttonPressed : null,
            ]}>
            <Text style={styles.buttonLabel}>{busy ? 'Signing in…' : 'Sign in'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    paddingVertical: space.xxl,
    gap: space.lg,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  brand: {
    ...type.page,
    color: colors.text,
  },
  lede: {
    ...type.body,
    color: colors.secondary,
    marginBottom: space.sm,
  },
  banner: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: metrics.radius,
    padding: space.lg,
  },
  bannerText: {
    ...type.body,
    color: colors.text,
  },
  field: {
    gap: space.xs,
  },
  label: {
    ...type.label,
    color: colors.secondary,
  },
  input: {
    minHeight: metrics.minTouch,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: metrics.radius,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    color: colors.text,
    ...type.body,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    ...type.meta,
    color: colors.danger,
  },
  button: {
    minHeight: metrics.minTouch,
    backgroundColor: colors.accent,
    borderRadius: metrics.radius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.sm,
  },
  buttonPressed: {
    backgroundColor: colors.accentPressed,
    opacity: 0.92,
  },
  buttonLabel: {
    ...type.section,
    color: colors.surface,
  },
});
