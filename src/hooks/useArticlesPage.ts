import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Article } from './useArticles';

export const PAGE_SIZE = 50;

const LIST_FIELDS =
  'id,title,summary,image_url,video_url,category,section,author,source_name,source_url,source_id,is_breaking,is_trending,views,trend_score,tags,published_at,created_at,slug';

/**
 * Server-side paginated articles. Fetches ONE page (50 rows) + total count.
 * No infinite scroll — used with explicit /page/N routes for SEO indexability.
 */
export function useArticlesPage(opts: {
  section?: string;
  category?: string | null;
  page: number;
}) {
  const { section, category, page } = opts;
  return useQuery({
    queryKey: ['articles-page', section ?? 'all', category ?? 'all', page],
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let q = supabase
        .from('articles')
        .select(LIST_FIELDS, { count: 'exact' })
        .order('published_at', { ascending: false })
        .range(from, to);
      if (section) q = q.eq('section', section);
      if (category) q = q.eq('category', category);
      const { data, count, error } = await q;
      if (error) throw error;
      return {
        rows: (data || []) as Article[],
        total: count ?? 0,
        totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
}
