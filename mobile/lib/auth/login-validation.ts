export type LoginFieldErrors = {
  email?: string;
  password?: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Client-side required fields only. Server remains the credential authority. */
export function validateLoginFields(email: string, password: string): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const trimmed = email.trim();
  if (!trimmed) {
    errors.email = 'Email is required.';
  } else if (!EMAIL.test(trimmed)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!password) {
    errors.password = 'Password is required.';
  }
  return errors;
}

export function hasLoginFieldErrors(errors: LoginFieldErrors): boolean {
  return Boolean(errors.email || errors.password);
}
