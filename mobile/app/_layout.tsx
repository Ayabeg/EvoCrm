import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '@/state/auth-context';
import { colors } from '@/theme/tokens';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { status } = useAuth();
  const signedIn = status === 'authenticated';
  const sessionKnown = status !== 'unknown';

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.canvas },
      }}>
      <Stack.Protected guard={sessionKnown && signedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="contact/[id]" options={{ title: 'Contact' }} />
        <Stack.Screen name="company/[id]" options={{ title: 'Company' }} />
        <Stack.Screen name="lead/[id]" options={{ title: 'Lead' }} />
        <Stack.Screen name="deal/[id]" options={{ title: 'Deal' }} />
        <Stack.Screen name="activity/[id]" options={{ title: 'Activity' }} />
        <Stack.Screen name="thread/[id]" options={{ title: 'Thread' }} />
        <Stack.Screen name="quote/[id]" options={{ title: 'Quote' }} />
      </Stack.Protected>
      <Stack.Protected guard={sessionKnown && !signedIn}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
