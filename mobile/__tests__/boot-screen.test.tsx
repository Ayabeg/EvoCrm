import { fireEvent, render } from '@testing-library/react-native';

import { BootScreen } from '@/components/BootScreen';

const mockRetryRestore = jest.fn();
const mockAbandonSession = jest.fn();

jest.mock('@/state/auth-context', () => ({
  useAuth: () => ({
    status: 'booting',
    lastError: { kind: 'offline', status: null, message: 'The device is offline.', fieldErrors: {} },
    lastLogoutRemoteRevoked: null,
    login: jest.fn(),
    logout: jest.fn(),
    retryRestore: mockRetryRestore,
    abandonSession: mockAbandonSession,
    session: { status: 'booting', user: null, workspace: null, permissions: [] },
    can: () => false,
  }),
}));

describe('boot screen', () => {
  it('does not discard credentials on offline restore', async () => {
    const view = await render(<BootScreen />);
    expect(view.getByText('Restoring your workspace')).toBeTruthy();
    expect(view.getByText(/was not discarded/)).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Try again' }));
    expect(mockRetryRestore).toHaveBeenCalled();
    fireEvent.press(view.getByRole('button', { name: 'Use a different account' }));
    expect(mockAbandonSession).toHaveBeenCalled();
  });
});
