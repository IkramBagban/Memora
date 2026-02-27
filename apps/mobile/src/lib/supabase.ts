import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error('Missing Supabase environment variables. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
}

const memoryStorage = new Map<string, string>();

const getWebStorage = (): Storage | null => {
	if (typeof window === 'undefined') {
		return null;
	}

	return window.localStorage;
};

const ExpoSecureStoreAdapter = {
	getItem: async (key: string): Promise<string | null> => {
		if (Platform.OS === 'web') {
			const storage = getWebStorage();

			if (!storage) {
				return memoryStorage.get(key) ?? null;
			}

			return storage.getItem(key);
		}

		return SecureStore.getItemAsync(key);
	},
	setItem: async (key: string, value: string): Promise<void> => {
		if (Platform.OS === 'web') {
			const storage = getWebStorage();

			if (!storage) {
				memoryStorage.set(key, value);
				return;
			}

			storage.setItem(key, value);
			return;
		}

		await SecureStore.setItemAsync(key, value);
	},
	removeItem: async (key: string): Promise<void> => {
		if (Platform.OS === 'web') {
			const storage = getWebStorage();

			if (!storage) {
				memoryStorage.delete(key);
				return;
			}

			storage.removeItem(key);
			return;
		}

		await SecureStore.deleteItemAsync(key);
	},
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		autoRefreshToken: true,
		detectSessionInUrl: false,
		persistSession: true,
		storage: ExpoSecureStoreAdapter,
	},
});