import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createContact, getContact, updateContact } from '@/features/contacts/api';
import { contactErrorMessage } from '@/features/contacts/errors';
import { useAuth } from '@/state/auth-context';
import type { ContactWritePayload } from '@/types/contact';
import { colors, metrics, space, type } from '@/theme/tokens';
type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  wilaya: string;
  lead_status: string;
};
const EMPTY_FORM: FormState = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  city: '',
  wilaya: '',
  lead_status: '',
};
/* lead_status: free-text backend field (max 40); not an enum */
export function ContactFormScreen({ mode }: { mode: 'create' | 'edit' }) {
  const router = useRouter();
  const { can } = useAuth();
  const canEdit = can('crm.edit');
  const { id } = useLocalSearchParams<{ id?: string }>();
  const contactId = id ? Number(id) : NaN;
  const editing = mode === 'edit';
  const savingLock = useRef(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const invalidEditId = editing && (!Number.isFinite(contactId) || contactId <= 0);
  useEffect(() => {
    if (!canEdit || !editing || invalidEditId) return;
    let cancelled = false;
    void (async () => {
      const result = await getContact(contactId);
      if (cancelled) return;
      if (!result.ok) {
        setError(contactErrorMessage(result.error, 'show'));
        setLoading(false);
        return;
      }
      const contact = result.data.data;
      setForm({
        first_name: contact.first_name ?? '',
        last_name: contact.last_name ?? '',
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        city: contact.city ?? '',
        wilaya: contact.wilaya ?? '',
        lead_status: contact.lead_status ?? '',
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [canEdit, contactId, editing, invalidEditId]);
  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }
  async function onSave() {
    if (!canEdit || savingLock.current || saving) return;
    const firstName = form.first_name.trim();
    if (!firstName) {
      setFieldErrors({ first_name: ['First name is required.'] });
      return;
    }
    const payload: ContactWritePayload = {
      first_name: firstName,
      last_name: emptyToNull(form.last_name),
      email: emptyToNull(form.email),
      phone: emptyToNull(form.phone),
      city: emptyToNull(form.city),
      wilaya: emptyToNull(form.wilaya),
      lead_status: emptyToNull(form.lead_status),
    };
    savingLock.current = true;
    setSaving(true);
    setError(null);
    setFieldErrors({});
    const result = editing
      ? await updateContact(contactId, payload)
      : await createContact(payload);
    savingLock.current = false;
    setSaving(false);
    if (!result.ok) {
      setError(contactErrorMessage(result.error, 'write'));
      setFieldErrors(result.error.fieldErrors ?? {});
      return;
    }
    router.replace(`/contact/${result.data.data.id}`);
  }
  if (!canEdit) {
    return (
      <View style={styles.centered} accessibilityRole="alert">
        <Text style={styles.emptyTitle}>Editing is not available</Text>
        <Text style={styles.emptyBody}>You need the crm.edit permission. The server remains authoritative.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.link}>Go back</Text>
        </Pressable>
      </View>
    );
  }
  if (invalidEditId) {
    return (
      <View style={styles.centered} accessibilityRole="alert">
        <Text style={styles.emptyTitle}>This contact link is invalid.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.link}>Go back</Text>
        </Pressable>
      </View>
    );
  }
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator accessibilityLabel="Loading contact form" color={colors.accent} />
      </View>
    );
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" style={styles.title}>
          {editing ? 'Edit contact' : 'New contact'}
        </Text>
        {error ? (
          <View accessibilityRole="alert" style={styles.banner}>
            <Text style={styles.bannerText}>{error}</Text>
          </View>
        ) : null}
        <Field
          label="First name"
          value={form.first_name}
          onChangeText={(value) => update('first_name', value)}
          error={fieldErrors.first_name?.[0]}
          autoComplete="given-name"
        />
        <Field
          label="Last name"
          value={form.last_name}
          onChangeText={(value) => update('last_name', value)}
          error={fieldErrors.last_name?.[0]}
          autoComplete="family-name"
        />
        <Field
          label="Email"
          value={form.email}
          onChangeText={(value) => update('email', value)}
          error={fieldErrors.email?.[0]}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <Field
          label="Phone"
          value={form.phone}
          onChangeText={(value) => update('phone', value)}
          error={fieldErrors.phone?.[0]}
          autoComplete="tel"
          keyboardType="phone-pad"
        />
        <Field
          label="City"
          value={form.city}
          onChangeText={(value) => update('city', value)}
          error={fieldErrors.city?.[0]}
        />
        <Field
          label="Wilaya"
          value={form.wilaya}
          onChangeText={(value) => update('wilaya', value)}
          error={fieldErrors.wilaya?.[0]}
        />
        <Field
          label="Lead status"
          value={form.lead_status}
          onChangeText={(value) => update('lead_status', value)}
          error={fieldErrors.lead_status?.[0]}
          hint="Free text (max 40). Backend does not expose a fixed enum."
        />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: saving, disabled: saving }}
          disabled={saving}
          onPress={() => void onSave()}
          style={({ pressed }) => [
            styles.save,
            saving || pressed ? styles.savePressed : null,
          ]}>
          <Text style={styles.saveLabel}>{saving ? 'Saving…' : 'Save contact'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
function Field({
  label,
  value,
  onChangeText,
  error,
  hint,
  autoCapitalize,
  autoComplete,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  hint?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: TextInput['props']['autoComplete'];
  keyboardType?: TextInput['props']['keyboardType'];
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholderTextColor={colors.muted}
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
      />
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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
    backgroundColor: colors.canvas,
    padding: metrics.screenPad,
    gap: space.md,
  },
  title: {
    ...type.page,
    color: colors.text,
    marginBottom: space.sm,
  },
  banner: {
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
    borderRadius: metrics.radius,
    padding: space.md,
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
  hint: {
    ...type.meta,
    color: colors.muted,
  },
  save: {
    minHeight: metrics.minTouch,
    marginTop: space.sm,
    borderRadius: metrics.radius,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savePressed: {
    backgroundColor: colors.accentPressed,
    opacity: 0.92,
  },
  saveLabel: {
    ...type.section,
    color: colors.surface,
  },
  emptyTitle: {
    ...type.section,
    color: colors.text,
    textAlign: 'center',
  },
  emptyBody: {
    ...type.body,
    color: colors.secondary,
    textAlign: 'center',
  },
  link: {
    ...type.section,
    color: colors.accent,
  },
});
