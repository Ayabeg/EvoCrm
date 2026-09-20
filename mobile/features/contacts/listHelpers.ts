import type { Contact } from '@/types/contact';

/** Append page items without duplicate IDs (stable first-seen wins). */
export function mergeContactPages(existing: Contact[], incoming: Contact[]): Contact[] {
  if (incoming.length === 0) return existing;
  const seen = new Set(existing.map((c) => c.id));
  const next = existing.slice();
  for (const item of incoming) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    next.push(item);
  }
  return next;
}

export type ListRequestKey = {
  generation: number;
  query: string;
  page: number;
  mode: 'replace' | 'append' | 'refresh';
};

/** True when a completed response is still the latest for its query+mode family. */
export function isStaleListResponse(
  activeGeneration: number,
  activeQuery: string,
  request: ListRequestKey,
): boolean {
  if (request.generation !== activeGeneration) return true;
  if (request.query !== activeQuery) return true;
  return false;
}

export function canRequestNextPage(opts: {
  loadingMore: boolean;
  loading: boolean;
  refreshing: boolean;
  page: number;
  lastPage: number;
  pendingPage: number | null;
}): boolean {
  if (opts.loading || opts.refreshing || opts.loadingMore) return false;
  if (opts.pendingPage !== null) return false;
  if (opts.page >= opts.lastPage) return false;
  return true;
}

export function contactInitials(contact: Pick<Contact, 'first_name' | 'last_name' | 'display_name'>): string {
  const first = contact.first_name?.trim()?.[0] ?? '';
  const last = contact.last_name?.trim()?.[0] ?? '';
  const pair = `${first}${last}`.toUpperCase();
  if (pair) return pair;
  const fromDisplay = (contact.display_name?.trim()?.[0] ?? '').toUpperCase();
  return fromDisplay || '?';
}

export function contactSubtitle(contact: Pick<Contact, 'company_name' | 'email' | 'phone'>): string {
  const bits = [contact.company_name, contact.email, contact.phone].filter(Boolean);
  return bits.length > 0 ? bits.join(' · ') : 'No company or contact details';
}
