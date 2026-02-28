import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

import { ensureNotificationPermission } from '@/hooks/use-notifications';
import { useAuthStore } from '@/stores/auth.store';

interface UseProfileResult {
  email: string;
  displayName: string;
  draftDisplayName: string;
  draftPassword: string;
  isLoading: boolean;
  notificationsEnabled: boolean;
  setDraftDisplayName: (value: string) => void;
  setDraftPassword: (value: string) => void;
  refreshNotificationStatus: () => Promise<void>;
  saveDisplayName: () => Promise<void>;
  changePassword: () => Promise<void>;
  enableNotifications: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useProfile = (): UseProfileResult => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const updateDisplayName = useAuthStore((state) => state.updateDisplayName);
  const updatePassword = useAuthStore((state) => state.updatePassword);
  const signOutStore = useAuthStore((state) => state.signOut);

  const currentDisplayName = useMemo(() => {
    const metadataName = user?.user_metadata.display_name;

    if (typeof metadataName === 'string' && metadataName.trim().length > 0) {
      return metadataName.trim();
    }

    return '';
  }, [user]);

  const [draftDisplayName, setDraftDisplayName] = useState(currentDisplayName);
  const [draftPassword, setDraftPassword] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    setDraftDisplayName(currentDisplayName);
  }, [currentDisplayName]);

  const refreshNotificationStatus = useCallback(async () => {
    const permissions = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(permissions.granted);
  }, []);

  const saveDisplayName = useCallback(async () => {
    const value = draftDisplayName.trim();

    if (value.length < 2) {
      Alert.alert('Name too short', 'Please use at least 2 characters.');
      return;
    }

    try {
      await updateDisplayName(value);
      Alert.alert('Saved', 'Your display name has been updated.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to update your display name right now.';
      Alert.alert('Update failed', message);
    }
  }, [draftDisplayName, updateDisplayName]);

  const changePassword = useCallback(async () => {
    if (draftPassword.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters long.');
      return;
    }

    try {
      await updatePassword(draftPassword);
      setDraftPassword('');
      Alert.alert('Password updated', 'Your password was changed successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to change your password right now.';
      Alert.alert('Update failed', message);
    }
  }, [draftPassword, updatePassword]);

  const enableNotifications = useCallback(async () => {
    const granted = await ensureNotificationPermission();

    if (!granted) {
      Alert.alert('Notifications disabled', 'You can enable notifications later from system settings.');
      setNotificationsEnabled(false);
      return;
    }

    setNotificationsEnabled(true);
    Alert.alert('Notifications enabled', 'You will now receive todo reminders.');
  }, []);

  const signOut = useCallback(async () => {
    try {
      await signOutStore();
      router.replace('/auth/login');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to sign out right now.';
      Alert.alert('Sign out failed', message);
    }
  }, [router, signOutStore]);

  return {
    email: user?.email ?? '',
    displayName: currentDisplayName,
    draftDisplayName,
    draftPassword,
    isLoading,
    notificationsEnabled,
    setDraftDisplayName,
    setDraftPassword,
    refreshNotificationStatus,
    saveDisplayName,
    changePassword,
    enableNotifications,
    signOut,
  };
};
