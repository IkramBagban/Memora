import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@memora/shared/constants/design';

import { useAuthStore } from '@/stores/auth.store';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { initialize, isInitialized, user } = useAuthStore();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const isAuthRoute = segments[0] === 'auth';

    if (!user && !isAuthRoute) {
      router.replace('/auth/login');
    }

    if (user && isAuthRoute) {
      router.replace('/(tabs)');
    }
  }, [isInitialized, router, segments, user]);

  if (!isInitialized) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
