import type { HomeSummary } from '@memora/shared';
import { invokeSupabaseFunction } from '@/lib/supabase';

export const homeService = {
  async getSummary(): Promise<HomeSummary> {
    const { data, error } = await invokeSupabaseFunction('get-home-summary');

    if (error || !data?.success) {
      throw new Error(data?.error?.message ?? error?.message ?? 'Failed to load home summary');
    }

    return data.data as HomeSummary;
  },
};
