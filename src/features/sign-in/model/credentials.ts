export const signInLimits = { email: 254, passwordMin: 8, password: 1024 } as const;

export type SignInError =
  'invalid' | 'forbidden' | 'method' | 'tooLarge' | 'unsupported' | 'clientNotFound';

export interface SignInFieldErrors {
  email?: 'emailRequired' | 'emailInvalid' | 'emailTooLong';
  password?: 'passwordRequired' | 'passwordTooShort' | 'passwordTooLong';
}

export function validateSignInCredentials(value: unknown): SignInFieldErrors {
  const fields = value && typeof value === 'object' ? value : {};
  const email = 'email' in fields ? fields.email : undefined;
  const password = 'password' in fields ? fields.password : undefined;
  const errors: SignInFieldErrors = {};

  if (typeof email !== 'string' || !email.trim()) {
    errors.email = 'emailRequired';
  } else if (email.length > signInLimits.email) {
    errors.email = 'emailTooLong';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'emailInvalid';
  }

  if (typeof password !== 'string' || password.length === 0) {
    errors.password = 'passwordRequired';
  } else if (password.length < signInLimits.passwordMin) {
    errors.password = 'passwordTooShort';
  } else if (password.length > signInLimits.password) {
    errors.password = 'passwordTooLong';
  }

  return errors;
}
