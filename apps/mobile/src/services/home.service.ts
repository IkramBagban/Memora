import type { HomeSummary } from '@memora/shared';
import { supabase } from '@/lib/supabase';

export const homeService = {
  async getSummary(): Promise<HomeSummary> {
    const { data } = await supabase.functions.invoke('get-home-summary');

    if (!data?.success) {
      throw new Error(data?.error?.message ?? 'Failed to load home summary');
    }

    return data.data as HomeSummary;
  },
};
