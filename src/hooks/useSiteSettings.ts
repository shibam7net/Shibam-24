import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsSettings {
  ga_id: string;
  gtm_id: string;
  custom_head: string;
  internal_tracking: boolean;
}
export interface AdsSettings {
  enabled: boolean;
  publisher_id: string;
  slots: { header: string; sidebar: string; in_article: string };
  disabled_categories: string[];
}
export interface SeoSettings {
  meta_title: string;
  meta_description: string;
  robots: string;
  category_seo: Record<string, { title?: string; description?: string }>;
  robots_txt: string;
}

export interface SiteSettings {
  analytics: AnalyticsSettings;
  ads: AdsSettings;
  seo: SeoSettings;
}

const defaults: SiteSettings = {
  analytics: { ga_id: '', gtm_id: '', custom_head: '', internal_tracking: true },
  ads: { enabled: false, publisher_id: '', slots: { header: '', sidebar: '', in_article: '' }, disabled_categories: [] },
  seo: { meta_title: '', meta_description: '', robots: 'index,follow', category_seo: {}, robots_txt: '' },
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ['site_settings'],
    queryFn: async (): Promise<SiteSettings> => {
      const { data, error } = await (supabase as any).from('site_settings').select('key, value');
      if (error) return defaults;
      const out: any = { ...defaults };
      (data || []).forEach((r: any) => { out[r.key] = { ...(defaults as any)[r.key], ...(r.value || {}) }; });
      return out;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: keyof SiteSettings; value: any }) => {
      const { error } = await (supabase as any).from('site_settings').upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['site_settings'] }),
  });
}
