import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, metrics, space, type } from '@/theme/tokens';

type Props = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

export function ScreenScaffold({ title, eyebrow, children }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.canvas}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      <View style={styles.body}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: metrics.screenPad,
    paddingBottom: space.xxl,
    gap: space.md,
  },
  eyebrow: {
    ...type.label,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    ...type.page,
    color: colors.text,
  },
  body: {
    gap: space.md,
  },
});
