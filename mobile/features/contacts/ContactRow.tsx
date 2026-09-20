import { Pressable, StyleSheet, Text, View } from 'react-native';

import { contactInitials, contactSubtitle } from '@/features/contacts/listHelpers';
import type { Contact } from '@/types/contact';
import { colors, metrics, space, type } from '@/theme/tokens';

type Props = {
  contact: Contact;
  onPress: (contact: Contact) => void;
};

export function ContactRow({ contact, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={contact.display_name}
      onPress={() => onPress(contact)}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarLabel}>{contactInitials(contact)}</Text>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.name}>
          {contact.display_name}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {contactSubtitle(contact)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: metrics.listRow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: metrics.screenPad,
    paddingVertical: space.md,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.subtle,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentWash,
  },
  avatarLabel: {
    ...type.label,
    color: colors.accent,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...type.section,
    color: colors.text,
  },
  meta: {
    ...type.meta,
    color: colors.secondary,
  },
});
