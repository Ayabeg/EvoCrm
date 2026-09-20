import { render, waitFor } from '@testing-library/react-native';

import HomeScreen from '@/app/(tabs)/index';
import CrmScreen from '@/app/(tabs)/crm';
import InboxScreen from '@/app/(tabs)/inbox';
import ActivitiesScreen from '@/app/(tabs)/activities';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/state/auth-context', () => ({
  useAuth: () => ({
    can: (permission: string) => permission === 'crm.view' || permission === 'crm.edit',
  }),
}));

// Mock contacts API only — do not requireActual('@/features/contacts/api')
// (that pulls services/api → AsyncStorage and breaks Jest).
jest.mock('@/features/contacts/api', () => ({
  listContacts: jest.fn(async () => ({
    ok: true,
    status: 200,
    data: {
      data: [
        {
          id: 1,
          first_name: 'Amine',
          last_name: 'Saidi',
          display_name: 'Amine Saidi',
          email: 'amine@clinic.dz',
          phone: '0550188001',
          phone_e164: '+213550188001',
          city: 'Alger',
          wilaya: 'Alger',
          lead_status: 'new',
          company_id: null,
          company_name: null,
          owner_id: null,
          owner_name: null,
          source: null,
          last_activity_at: null,
          created_at: null,
          updated_at: null,
        },
      ],
      meta: { current_page: 1, per_page: 25, total: 1, last_page: 1 },
    },
  })),
}));

describe('tab screens after M08', () => {
  it('renders Home blocker chrome', async () => {
    const view = await render(<HomeScreen />);
    expect(view.getByText('Home')).toBeTruthy();
    expect(view.getByText(/HomeDashboardBuilder/)).toBeTruthy();
  });

  it('renders CRM contacts list from M08', async () => {
    const view = await render(<CrmScreen />);
    await waitFor(() => {
      expect(view.getByText('Contacts')).toBeTruthy();
      expect(view.getByText('Amine Saidi')).toBeTruthy();
    });
  });

  it('renders Inbox thread-show blocker', async () => {
    const view = await render(<InboxScreen />);
    expect(view.getByText('Inbox')).toBeTruthy();
    expect(view.getByText(/thread\+messages show does not/)).toBeTruthy();
  });

  it('renders Activities complete blocker', async () => {
    const view = await render(<ActivitiesScreen />);
    expect(view.getByText('Activities')).toBeTruthy();
    expect(view.getByText(/Completing a task is not exposed/)).toBeTruthy();
  });
});
