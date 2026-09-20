import { contactSubtitle } from '@/features/contacts/listHelpers';
import type { Contact } from '@/types/contact';

const base: Contact = {
  id: 1,
  first_name: 'Amine',
  last_name: 'Saidi',
  display_name: 'Amine Saidi',
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
};

describe('contactSubtitle', () => {
  it('joins company, email, and phone when present', () => {
    expect(
      contactSubtitle({
        ...base,
        company_name: 'Clinic DZ',
        email: 'amine@clinic.dz',
        phone: '0550188001',
      }),
    ).toBe('Clinic DZ · amine@clinic.dz · 0550188001');
  });

  it('returns an honest empty label when nothing is set', () => {
    expect(contactSubtitle(base)).toBe('No company or contact details');
  });
});
