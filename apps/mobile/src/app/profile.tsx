import { useCallback } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Shadow, Spacing, Typography } from '@memora/shared/constants/design';

import { useProfile } from '@/hooks/use-profile';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    email,
    displayName,
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
  } = useProfile();

  useFocusEffect(
    useCallback(() => {
      void refreshNotificationStatus();
    }, [refreshNotificationStatus]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons color={Colors.textPrimary} name="chevron-back" size={Typography.size.xl} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account</Text>

          <Text style={styles.label}>Email</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>{email || 'No email available'}</Text>
          </View>

          <Text style={styles.label}>Display name</Text>
          <TextInput
            accessibilityLabel="Display name"
            autoCapitalize="words"
            onChangeText={setDraftDisplayName}
            placeholder="Enter your name"
            placeholderTextColor={Colors.textSecondary}
            style={styles.input}
            value={draftDisplayName}
          />
          <TouchableOpacity
            accessibilityLabel="Save display name"
            disabled={isLoading || draftDisplayName.trim() === displayName}
            onPress={() => {
              void saveDisplayName();
            }}
            style={[
              styles.primaryButton,
              isLoading || draftDisplayName.trim() === displayName ? styles.disabledButton : null,
            ]}
          >
            <Text style={styles.primaryButtonText}>Save name</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Security</Text>
          <Text style={styles.label}>New password</Text>
          <TextInput
            accessibilityLabel="New password"
            onChangeText={setDraftPassword}
            placeholder="Minimum 8 characters"
            placeholderTextColor={Colors.textSecondary}
            secureTextEntry
            style={styles.input}
            value={draftPassword}
          />
          <TouchableOpacity
            accessibilityLabel="Update password"
            disabled={isLoading || draftPassword.length === 0}
            onPress={() => {
              void changePassword();
            }}
            style={[styles.primaryButton, isLoading || draftPassword.length === 0 ? styles.disabledButton : null]}
          >
            <Text style={styles.primaryButtonText}>Update password</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Text style={styles.statusText}>
            Status: {notificationsEnabled ? 'Enabled' : 'Disabled'}
          </Text>
          <Text style={styles.supportText}>
            Memora uses notifications for todo reminders and review nudges.
          </Text>
          <TouchableOpacity
            accessibilityLabel="Enable notifications"
            disabled={isLoading || notificationsEnabled}
            onPress={() => {
              void enableNotifications();
            }}
            style={[styles.secondaryButton, isLoading || notificationsEnabled ? styles.disabledButton : null]}
          >
            <Text style={styles.secondaryButtonText}>
              {notificationsEnabled ? 'Notifications enabled' : 'Enable notifications'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          accessibilityLabel="Sign out"
          onPress={() => {
            void signOut();
          }}
          style={styles.signOutButton}
        >
          {isLoading ? <ActivityIndicator color={Colors.error} size="small" /> : null}
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerButton: {
    alignItems: 'center',
    height: Spacing.xl,
    justifyContent: 'center',
    width: Spacing.xl,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  headerSpacer: {
    width: Spacing.xl,
  },
  content: {
    gap: Spacing.md,
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.md,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing.xs,
  },
  readOnlyField: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  readOnlyText: {
    color: Colors.textPrimary,
    fontSize: Typography.size.md,
  },
  input: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.textPrimary,
    fontSize: Typography.size.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  primaryButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  statusText: {
    color: Colors.textPrimary,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.xs,
  },
  supportText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    marginBottom: Spacing.md,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  secondaryButtonText: {
    color: Colors.primaryDark,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  disabledButton: {
    opacity: 0.5,
  },
  signOutButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.error,
    borderRadius: Radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    ...Shadow.sm,
  },
  signOutText: {
    color: Colors.error,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
});
