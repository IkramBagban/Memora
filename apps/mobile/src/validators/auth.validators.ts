export interface AuthFormValues {
  email: string;
  password: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateLoginForm = ({ email, password }: AuthFormValues): string | null => {
  if (!EMAIL_PATTERN.test(email.trim())) {
    return 'Please enter a valid email address';
  }

  if (password.length === 0) {
    return 'Password is required';
  }

  return null;
};

export const validateSignupForm = ({ email, password }: AuthFormValues): string | null => {
  if (!EMAIL_PATTERN.test(email.trim())) {
    return 'Please enter a valid email address';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }

  return null;
};
