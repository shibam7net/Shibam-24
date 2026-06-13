import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Source {
  id: string;
  name: string;
  url: string;
  fetch_method: string;
  section: string;
  is_active: boolean;
  fetch_interval: number;
  last_fetch: string | null;
  created_at: string;
  hide_source: boolean;
  alt_source_name: string | null;
  alt_source_url: string | null;
  assigned_category: string | null;
}

export function useSources(section?: string) {
  return useQuery({
    queryKey: ['sources', section],
    queryFn: async () => {
      let query = supabase.from('sources').select('*').order('created_at', { ascending: false });
      if (section) query = query.eq('section', section);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Source[];
    },
  });
}

export function useAddSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (source: Omit<Source, 'id' | 'created_at' | 'last_fetch'>) => {
      const { error } = await supabase.from('sources').insert(source as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sources'] }),
  });
}

export function useUpdateSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Source> & { id: string }) => {
      const { error } = await supabase.from('sources').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sources'] }),
  });
}

export function useDeleteSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, deleteArticles }: { id: string; deleteArticles: boolean }) => {
      if (deleteArticles) {
        // Delete articles first, then source
        await supabase.from('articles').delete().eq('source_id', id);
      } else {
        // Nullify source_id on articles
        await supabase.from('articles').update({ source_id: null } as any).eq('source_id', id);
      }
      const { error } = await supabase.from('sources').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sources'] });
      qc.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}
