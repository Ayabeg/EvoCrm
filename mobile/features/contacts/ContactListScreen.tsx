import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ContactRow } from '@/features/contacts/ContactRow';
import { listContacts } from '@/features/contacts/api';
import { contactErrorMessage } from '@/features/contacts/errors';
import {
  canRequestNextPage,
  isStaleListResponse,
  mergeContactPages,
  type ListRequestKey,
} from '@/features/contacts/listHelpers';
import { useAuth } from '@/state/auth-context';
import type { Contact } from '@/types/contact';
import { colors, metrics, space, type } from '@/theme/tokens';
export function ContactListScreen() {
  const router = useRouter();
  const { can } = useAuth();
  const canEdit = can('crm.edit');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generationRef = useRef(0);
  const pendingPageRef = useRef<number | null>(null);
  const activeQueryRef = useRef('');
  const endReachedLockRef = useRef(false);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);
  const load = useCallback(
    async (targetPage: number, mode: 'replace' | 'append' | 'refresh') => {
      const request: ListRequestKey = {
        generation: mode === 'append' ? generationRef.current : ++generationRef.current,
        query: debouncedQuery,
        page: targetPage,
        mode,
      };
      activeQueryRef.current = debouncedQuery;
      if (mode === 'replace') {
        setLoading(true);
        pendingPageRef.current = null;
      }
      if (mode === 'refresh') {
        setRefreshing(true);
        pendingPageRef.current = null;
      }
      if (mode === 'append') {
        if (pendingPageRef.current === targetPage) return;
        pendingPageRef.current = targetPage;
        setLoadingMore(true);
      }
      setError(null);
      const result = await listContacts({
        q: debouncedQuery || undefined,
        page: targetPage,
        perPage: 25,
      });
      if (
        isStaleListResponse(generationRef.current, activeQueryRef.current, {
          ...request,
          generation: mode === 'append' ? generationRef.current : request.generation,
        })
      ) {
        if (mode === 'append' && pendingPageRef.current === targetPage) {
          pendingPageRef.current = null;
          setLoadingMore(false);
        }
        return;
      }
      if (mode === 'append' && request.query !== debouncedQuery) {
        pendingPageRef.current = null;
        setLoadingMore(false);
        return;
      }
      if (!result.ok) {
        setError(contactErrorMessage(result.error, 'list'));
        if (mode === 'replace') setContacts([]);
      } else {
        setContacts((current) =>
          mode === 'append'
            ? mergeContactPages(current, result.data.data)
            : result.data.data,
        );
        setPage(result.data.meta.current_page);
        setLastPage(result.data.meta.last_page);
      }
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      if (mode === 'append') pendingPageRef.current = null;
      endReachedLockRef.current = false;
    },
    [debouncedQuery],
  );
  useEffect(() => {
    const timer = setTimeout(() => { void load(1, 'replace'); }, 0);
    return () => clearTimeout(timer);
  }, [load]);
  const onEndReached = useCallback(() => {
    if (endReachedLockRef.current) return;
    if (
      !canRequestNextPage({
        loadingMore,
        loading,
        refreshing,
        page,
        lastPage,
        pendingPage: pendingPageRef.current,
      })
    ) {
      return;
    }
    endReachedLockRef.current = true;
    void load(page + 1, 'append');
  }, [load, loading, loadingMore, refreshing, page, lastPage]);
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Contacts
        </Text>
        {canEdit ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New contact"
            onPress={() => router.push('/contact/new')}
            style={({ pressed }) => [styles.addButton, pressed ? styles.addPressed : null]}>
            <Text style={styles.addLabel}>New</Text>
          </Pressable>
        ) : null}
      </View>
      <TextInput
        accessibilityLabel="Search contacts"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        onChangeText={setQuery}
        placeholder="Search name, email, phone"
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        style={styles.search}
        value={query}
      />
      {error ? (
        <View accessibilityRole="alert" style={styles.banner}>
          <Text style={styles.bannerText}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => void load(1, 'replace')}>
            <Text style={styles.retry}>Try again</Text>
          </Pressable>
        </View>
      ) : null}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator accessibilityLabel="Loading contacts" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ContactRow
              contact={item}
              onPress={(contact) => router.push(`/contact/${contact.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(1, 'refresh')}
              tintColor={colors.accent}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyTitle}>No contacts yet</Text>
              <Text style={styles.emptyBody}>
                {debouncedQuery
                  ? 'Nothing matched that search.'
                  : canEdit
                    ? 'Create the first contact to start the CRM loop.'
                    : 'Contacts from this workspace will show up here.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.accent} style={styles.footerSpinner} />
            ) : null
          }
          contentContainerStyle={contacts.length === 0 ? styles.emptyList : undefined}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    paddingHorizontal: metrics.screenPad,
    paddingTop: space.lg,
    paddingBottom: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  title: {
    ...type.page,
    color: colors.text,
  },
  addButton: {
    minHeight: metrics.minTouch,
    paddingHorizontal: space.lg,
    borderRadius: metrics.radius,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPressed: {
    backgroundColor: colors.accentPressed,
  },
  addLabel: {
    ...type.section,
    color: colors.surface,
  },
  search: {
    marginHorizontal: metrics.screenPad,
    marginBottom: space.sm,
    minHeight: metrics.minTouch,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: metrics.radius,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    color: colors.text,
    ...type.body,
  },
  banner: {
    marginHorizontal: metrics.screenPad,
    marginBottom: space.sm,
    padding: space.md,
    borderRadius: metrics.radius,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
    gap: space.sm,
  },
  bannerText: {
    ...type.body,
    color: colors.text,
  },
  retry: {
    ...type.section,
    color: colors.accent,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: metrics.screenPad,
    gap: space.sm,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyTitle: {
    ...type.section,
    color: colors.text,
  },
  emptyBody: {
    ...type.body,
    color: colors.secondary,
    textAlign: 'center',
  },
  footerSpinner: {
    marginVertical: space.lg,
  },
});
