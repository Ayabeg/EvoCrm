import { fireEvent, render, waitFor } from '@testing-library/react-native';

import SignInScreen from '@/app/(auth)/index';

const login = jest.fn(async () => undefined);

jest.mock('@/state/auth-context', () => ({
  useAuth: () => ({
    status: 'unauthenticated',
    lastError: null,
    lastLogoutRemoteRevoked: null,
    login,
    logout: jest.fn(),
    retryRestore: jest.fn(),
    abandonSession: jest.fn(),
    session: { status: 'unauthenticated', user: null, workspace: null, permissions: [] },
    can: () => false,
  }),
}));

describe('sign-in screen', () => {
  beforeEach(() => {
    login.mockClear();
  });

  it('validates required fields before calling the API', () => {
    const view = render(<SignInScreen />);
    fireEvent.press(view.getByRole('button', { name: 'Sign in' }));
    expect(view.getByText('Email is required.')).toBeTruthy();
    expect(view.getByText('Password is required.')).toBeTruthy();
    expect(login).not.toHaveBeenCalled();
  });

  it('submits email and password only', async () => {
    const view = render(<SignInScreen />);
    fireEvent.changeText(view.getByLabelText('Email'), 'owner@clinic.dz');
    fireEvent.changeText(view.getByLabelText('Password'), 'secret');
    fireEvent.press(view.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('owner@clinic.dz', 'secret');
    });
  });
});
