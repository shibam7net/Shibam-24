import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Sponsor {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useSponsors(activeOnly = false) {
  return useQuery({
    queryKey: ['sponsors', activeOnly],
    queryFn: async () => {
      let q = supabase.from('sponsors' as any).select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false });
      if (activeOnly) q = q.eq('is_active', true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as Sponsor[];
    },
    staleTime: 60_000,
  });
}

export function useUpsertSponsor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: Partial<Sponsor> & { name: string; logo_url: string }) => {
      const payload: any = { ...s, updated_at: new Date().toISOString() };
      const { data, error } = await supabase.from('sponsors' as any).upsert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sponsors'] }),
  });
}

export function useDeleteSponsor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sponsors' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sponsors'] }),
  });
}

export async function uploadSponsorLogo(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'png';
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('sponsor-logos').upload(name, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('sponsor-logos').getPublicUrl(name);
  return data.publicUrl;
}
