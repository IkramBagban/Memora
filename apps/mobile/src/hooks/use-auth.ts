import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthError } from '@supabase/supabase-js';

import { useAuthStore } from '@/stores/auth.store';
import { validateLoginForm, validateSignupForm } from '@/validators/auth.validators';

const getAuthMessage = (err: unknown, fallbackMessage: string): string => {
  if (err instanceof AuthError) {
    return err.message;
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return fallbackMessage;
};

export const useAuth = () => {
  const router = useRouter();
  const { signIn, signUp, isLoading } = useAuthStore();

  const login = async (email: string, password: string) => {
    const errorMessage = validateLoginForm({ email, password });

    if (errorMessage) {
      Alert.alert('Invalid form', errorMessage);
      return;
    }

    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      Alert.alert('Sign in failed', getAuthMessage(err, 'Unable to sign in right now.'));
    }
  };

  const signup = async (email: string, password: string) => {
    const errorMessage = validateSignupForm({ email, password });

    if (errorMessage) {
      Alert.alert('Invalid form', errorMessage);
      return;
    }

    try {
      await signUp(email.trim(), password);
      const currentUser = useAuthStore.getState().user;

      if (currentUser) {
        router.replace('/(tabs)');
        return;
      }

      Alert.alert('Check your inbox', 'Your account was created. Please verify your email before signing in.');
      router.replace('/auth/login');
    } catch (err: unknown) {
      Alert.alert('Sign up failed', getAuthMessage(err, 'Unable to create account right now.'));
    }
  };

  return {
    isLoading,
    login,
    signup,
  };
};
