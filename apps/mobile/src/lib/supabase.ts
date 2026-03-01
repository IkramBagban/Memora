import { createClient, type FunctionInvokeOptions } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

const SUPABASE_CONFIG_ERROR =
	'Missing Supabase environment variables. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.';

const fallbackSupabaseUrl = 'https://invalid.local';
const fallbackSupabaseAnonKey = 'invalid-anon-key';

export const assertSupabaseConfig = (): void => {
	if (!hasSupabaseConfig) {
		throw new Error(SUPABASE_CONFIG_ERROR);
	}
};

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

export const supabase = createClient(
	hasSupabaseConfig ? supabaseUrl : fallbackSupabaseUrl,
	hasSupabaseConfig ? supabaseAnonKey : fallbackSupabaseAnonKey,
	{
	auth: {
		autoRefreshToken: true,
		detectSessionInUrl: false,
		persistSession: true,
		storage: ExpoSecureStoreAdapter,
	},
	},
);

export const invokeSupabaseFunction = async (
	functionName: string,
	options?: FunctionInvokeOptions,
) => {
	assertSupabaseConfig();

	const { data: sessionData } = await supabase.auth.getSession();
	const accessToken = sessionData.session?.access_token;

	const mergedHeaders: Record<string, string> = {
		...(options?.headers ?? {}),
	};

	if (accessToken) {
		mergedHeaders.Authorization = `Bearer ${accessToken}`;
	}

	return supabase.functions.invoke(functionName, {
		...options,
		headers: mergedHeaders,
	});
};