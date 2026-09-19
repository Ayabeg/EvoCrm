import { fireEvent, render, waitFor } from '@testing-library/react-native';

import MoreScreen from '@/app/(tabs)/more';

const logout = jest.fn(async () => ({
  session: { status: 'unauthenticated', user: null, workspace: null, permissions: [] },
  remoteRevoked: false,
}));

jest.mock('@/state/auth-context', () => ({
  useAuth: () => ({
    status: 'authenticated',
    lastError: null,
    lastLogoutRemoteRevoked: null,
    login: jest.fn(),
    logout,
    retryRestore: jest.fn(),
    abandonSession: jest.fn(),
    session: {
      status: 'authenticated',
      user: { id: 1, name: 'Lina', email: 'owner@clinic.dz', role: 'owner' },
      workspace: { id: 1, name: 'Evotechly', slug: 'evotechly-ab12c', timezone: 'Africa/Algiers' },
      permissions: ['crm.view', 'crm.edit'],
    },
    can: (permission: string) => permission === 'crm.edit' || permission === 'crm.view',
  }),
}));

describe('more / account screen', () => {
  it('shows server identity and signs out without claiming remote revoke', async () => {
    const view = render(<MoreScreen />);
    expect(view.getByText('Lina')).toBeTruthy();
    expect(view.getByText('owner@clinic.dz')).toBeTruthy();
    expect(view.getByText('Evotechly')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => {
      expect(logout).toHaveBeenCalled();
      expect(view.getByText(/could not confirm revoke/)).toBeTruthy();
    });
  });
});
