import { render } from '@testing-library/react-native';

import SignInScreen from '@/app/(auth)/index';

jest.mock('@/state/auth-context', () => ({
  useAuth: () => ({
    status: 'unauthenticated',
    lastError: null,
    lastLogoutRemoteRevoked: false,
    login: jest.fn(),
    logout: jest.fn(),
    retryRestore: jest.fn(),
    abandonSession: jest.fn(),
    session: { status: 'unauthenticated', user: null, workspace: null, permissions: [] },
    can: () => false,
  }),
}));

describe('sign-in screen', () => {
  it('renders email and password only — no social or magic login', async () => {
    const view = await render(<SignInScreen />);
    expect(view.getByLabelText('Email')).toBeTruthy();
    expect(view.getByLabelText('Password')).toBeTruthy();
    expect(view.getByRole('button', { name: 'Sign in' })).toBeTruthy();
    expect(view.queryByText(/Google|Apple|Microsoft|magic|biometric/i)).toBeNull();
    expect(view.getByText(/could not confirm token revoke/)).toBeTruthy();
  });
});
