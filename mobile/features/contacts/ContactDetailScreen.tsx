import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';

import { getContact } from '@/features/contacts/api';
import { contactErrorMessage } from '@/features/contacts/errors';
import { buildMailtoUrl, buildTelUrl, openExternalUrl } from '@/features/contacts/linking';
import { useAuth } from '@/state/auth-context';
import type { Contact } from '@/types/contact';
import { colors, metrics, space, type } from '@/theme/tokens';

export function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contactId = Number(id);
  const router = useRouter();
  const navigation = useNavigation();
  const { can } = useAuth();
  const canEdit = can('crm.edit');

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(contactId) || contactId <= 0) {
      setError('This contact link is invalid.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await getContact(contactId);
    if (!result.ok) {
      setContact(null);
      setError(contactErrorMessage(result.error, 'show'));
    } else {
      setContact(result.data.data);
    }
    setLoading(false);
  }, [contactId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: contact?.display_name ?? 'Contact',
      headerRight: canEdit && contact
        ? () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit contact"
              onPress={() => router.push(`/contact/${contact.id}/edit`)}>
              <Text style={styles.headerAction}>Edit</Text>
            </Pressable>
          )
        : undefined,
    });
  }, [canEdit, contact, navigation, router]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator accessibilityLabel="Loading contact" color={colors.accent} />
      </View>
    );
  }

  if (error || !contact) {
    return (
      <View style={styles.centered} accessibilityRole="alert">
        <Text style={styles.emptyTitle}>{error ?? 'Contact not found'}</Text>
        <Pressable accessibilityRole="button" onPress={() => void load()}>
          <Text style={styles.retry}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const mailUrl = buildMailtoUrl(contact.email);
  const telUrl = buildTelUrl(contact.phone_e164 || contact.phone);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.name} accessibilityRole="header">
        {contact.display_name}
      </Text>
      {contact.company_name ? <Text style={styles.company}>{contact.company_name}</Text> : null}
      {contact.lead_status ? (
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{contact.lead_status}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Field
          label="Email"
          value={contact.email}
          onPress={mailUrl ? () => void openExternalUrl(mailUrl) : undefined}
        />
        <Field
          label="Phone"
          value={contact.phone ?? contact.phone_e164}
          onPress={telUrl ? () => void openExternalUrl(telUrl) : undefined}
        />
        <Field label="City" value={contact.city} />
        <Field label="Wilaya" value={contact.wilaya} />
        <Field label="Owner" value={contact.owner_name} />
        <Field label="Source" value={contact.source} />
      </View>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string | null | undefined;
  onPress?: () => void;
}) {
  const display = value?.trim() ? value : '—';
  const content = (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={[styles.fieldValue, onPress && value ? styles.link : null]}>{display}</Text>
    </View>
  );
  if (!onPress || !value?.trim()) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: metrics.screenPad,
    paddingBottom: space.xxl,
    gap: space.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: metrics.screenPad,
    gap: space.md,
    backgroundColor: colors.canvas,
  },
  name: {
    ...type.page,
    color: colors.text,
  },
  company: {
    ...type.body,
    color: colors.secondary,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentWash,
    borderRadius: metrics.radius,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  badgeLabel: {
    ...type.label,
    color: colors.accent,
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: metrics.radius,
    padding: space.lg,
    gap: space.md,
  },
  field: {
    gap: space.xs,
  },
  fieldLabel: {
    ...type.label,
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldValue: {
    ...type.body,
    color: colors.text,
  },
  link: {
    color: colors.accent,
  },
  emptyTitle: {
    ...type.section,
    color: colors.text,
    textAlign: 'center',
  },
  retry: {
    ...type.section,
    color: colors.accent,
  },
  headerAction: {
    ...type.section,
    color: colors.accent,
    paddingHorizontal: space.sm,
  },
});
