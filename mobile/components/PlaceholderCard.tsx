import { StyleSheet, Text, View } from 'react-native';

import { colors, metrics, space, type } from '@/theme/tokens';

type Props = {
  title: string;
  body: string;
  tone?: 'default' | 'blocked';
};

export function PlaceholderCard({ title, body, tone = 'default' }: Props) {
  return (
    <View style={[styles.card, tone === 'blocked' ? styles.blocked : null]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: metrics.radius,
    padding: space.lg,
    gap: space.sm,
    minHeight: metrics.listRow,
  },
  blocked: {
    borderColor: colors.accent,
  },
  title: {
    ...type.section,
    color: colors.text,
  },
  body: {
    ...type.body,
    color: colors.secondary,
  },
});
