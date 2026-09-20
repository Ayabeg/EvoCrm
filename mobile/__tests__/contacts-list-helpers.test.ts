import {
  canRequestNextPage,
  contactInitials,
  isStaleListResponse,
  mergeContactPages,
} from '@/features/contacts/listHelpers';
import type { Contact } from '@/types/contact';

const contact = (id: number, name = `C${id}`): Contact => ({
  id,
  first_name: name,
  last_name: null,
  display_name: name,
  email: null,
  phone: null,
  phone_e164: null,
  city: null,
  wilaya: null,
  lead_status: null,
  company_id: null,
  company_name: null,
  owner_id: null,
  owner_name: null,
  source: null,
  last_activity_at: null,
  created_at: null,
  updated_at: null,
});

describe('mergeContactPages', () => {
  it('appends new ids and skips duplicates', () => {
    const merged = mergeContactPages([contact(1), contact(2)], [contact(2), contact(3)]);
    expect(merged.map((c) => c.id)).toEqual([1, 2, 3]);
  });

  it('keeps first-seen record when ids collide', () => {
    const first = contact(1, 'First');
    const dup = contact(1, 'Dup');
    expect(mergeContactPages([first], [dup])[0].display_name).toBe('First');
  });
});

describe('isStaleListResponse', () => {
  it('flags older generations', () => {
    expect(
      isStaleListResponse(2, 'amine', { generation: 1, query: 'amine', page: 1, mode: 'replace' }),
    ).toBe(true);
  });

  it('flags mismatched query', () => {
    expect(
      isStaleListResponse(1, 'amine', { generation: 1, query: 'sara', page: 1, mode: 'append' }),
    ).toBe(true);
  });

  it('accepts matching generation + query', () => {
    expect(
      isStaleListResponse(1, 'amine', { generation: 1, query: 'amine', page: 2, mode: 'append' }),
    ).toBe(false);
  });
});

describe('canRequestNextPage', () => {
  const base = {
    loadingMore: false,
    loading: false,
    refreshing: false,
    page: 1,
    lastPage: 3,
    pendingPage: null as number | null,
  };

  it('allows next page when idle', () => {
    expect(canRequestNextPage(base)).toBe(true);
  });

  it('blocks during loadingMore / pending / last page', () => {
    expect(canRequestNextPage({ ...base, loadingMore: true })).toBe(false);
    expect(canRequestNextPage({ ...base, pendingPage: 2 })).toBe(false);
    expect(canRequestNextPage({ ...base, page: 3, lastPage: 3 })).toBe(false);
  });
});

describe('contactInitials', () => {
  it('uses first+last deterministically', () => {
    expect(contactInitials({ first_name: 'Amine', last_name: 'Saidi', display_name: 'Amine Saidi' })).toBe(
      'AS',
    );
  });

  it('falls back to display name then ?', () => {
    expect(contactInitials({ first_name: '', last_name: '', display_name: 'Clinic' })).toBe('C');
    expect(contactInitials({ first_name: '', last_name: '', display_name: '' })).toBe('?');
  });
});
