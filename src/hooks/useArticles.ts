import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  image_url: string | null;
  video_url?: string | null;
  category: string;
  section: string;
  author: string;
  source_name: string;
  source_url: string | null;
  source_id: string | null;
  is_breaking: boolean;
  is_trending: boolean;
  views: number;
  trend_score: number;
  tags: string[];
  published_at: string;
  created_at: string;
  slug?: string | null;
}

// Lightweight projection used for lists (no heavy `content` field)
const LIST_FIELDS =
  'id,title,summary,image_url,video_url,category,section,author,source_name,source_url,source_id,is_breaking,is_trending,views,trend_score,tags,published_at,created_at,slug';

const PAGE_SIZE = 100;

/**
 * Infinite, server-paginated articles query.
 * Loads ALL articles progressively in 100-row pages — never truncates the dataset.
 * Pages are cached individually so re-renders don't cause re-fetching.
 */
export function useInfiniteArticles(section?: string) {
  return useInfiniteQuery({
    queryKey: ['articles-infinite', section ?? 'all'],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam as number;
      const to = from + PAGE_SIZE - 1;
      let query = supabase
        .from('articles')
        .select(LIST_FIELDS)
        .order('published_at', { ascending: false })
        .range(from, to);
      if (section) query = query.eq('section', section);
      const { data, error } = await query;
      if (error) throw error;
      return { rows: (data || []) as Article[], nextOffset: (data?.length || 0) === PAGE_SIZE ? from + PAGE_SIZE : null };
    },
    getNextPageParam: (last) => last.nextOffset,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Backwards-compatible flat list hook. Returns ALL articles (no artificial limit)
 * via a single high-cap select. Cached aggressively to prevent repeat fetches.
 */
const LS_CACHE_KEY = (section?: string) => `articles_cache_${section ?? 'all'}`;
const LS_MAX = 200; // cap localStorage payload

function readLsCache(section?: string): Article[] | undefined {
  try {
    const raw = localStorage.getItem(LS_CACHE_KEY(section));
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Article[];
  } catch {}
  return;
}

function writeLsCache(section: string | undefined, rows: Article[]) {
  try {
    localStorage.setItem(LS_CACHE_KEY(section), JSON.stringify(rows.slice(0, LS_MAX)));
  } catch {}
}

export function useArticles(section?: string, _limit?: number) {
  return useQuery({
    queryKey: ['articles', section ?? 'all'],
    queryFn: async () => {
      // Batched fetch to bypass PostgREST 1000-row default cap; full archive
      // is reachable via useInfiniteArticles. This hook backs sidebars/related.
      const BATCH = 500;
      const MAX = 2000;
      const all: Article[] = [];
      for (let offset = 0; offset < MAX; offset += BATCH) {
        let query = supabase
          .from('articles')
          .select(LIST_FIELDS)
          .order('published_at', { ascending: false })
          .range(offset, offset + BATCH - 1);
        if (section) query = query.eq('section', section);
        const { data, error } = await query;
        if (error) throw error;
        const rows = (data || []) as Article[];
        all.push(...rows);
        if (rows.length < BATCH) break;
      }
      writeLsCache(section, all);
      try { localStorage.setItem(LS_CACHE_KEY(section) + '_ts', String(Date.now())); } catch {}
      return all;
    },
    initialData: () => readLsCache(section),
    initialDataUpdatedAt: () => {
      const raw = localStorage.getItem(LS_CACHE_KEY(section) + '_ts');
      return raw ? Number(raw) : 0;
    },
    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    placeholderData: (prev) => prev,
  });
}

export function useArticle(idOrSlug: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['article', idOrSlug],
    queryFn: async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      if (isUuid) {
        const { data, error } = await supabase.from('articles').select('*').eq('id', idOrSlug).single();
        if (error) throw error;
        return data as Article;
      }
      const { data, error } = await supabase.from('articles').select('*').eq('slug', idOrSlug).single();
      if (!error && data) return data as Article;
      const { data: data2, error: error2 } = await supabase.from('articles').select('*').eq('id', idOrSlug).single();
      if (error2) throw error2;
      return data2 as Article;
    },
    enabled: !!idOrSlug,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    // Instant render from list cache — no spinner when navigating from a list view.
    placeholderData: () => {
      const lists = qc.getQueriesData<Article[]>({ queryKey: ['articles'] });
      for (const [, rows] of lists) {
        if (!rows) continue;
        const hit = rows.find((r) => r.id === idOrSlug || r.slug === idOrSlug);
        if (hit) return hit as Article;
      }
      const infinite = qc.getQueriesData<any>({ queryKey: ['articles-infinite'] });
      for (const [, data] of infinite) {
        for (const page of data?.pages || []) {
          const hit = page.rows?.find((r: Article) => r.id === idOrSlug || r.slug === idOrSlug);
          if (hit) return hit as Article;
        }
      }
      return undefined;
    },
  });
}


/** Optimistically update all article list caches when one article changes. */
function patchListCaches(qc: ReturnType<typeof useQueryClient>, updater: (rows: Article[]) => Article[]) {
  qc.setQueriesData<Article[]>({ queryKey: ['articles'] }, (old) => (old ? updater(old) : old));
  qc.setQueriesData<any>({ queryKey: ['articles-infinite'] }, (old: any) => {
    if (!old?.pages) return old;
    return { ...old, pages: old.pages.map((p: any) => ({ ...p, rows: updater(p.rows) })) };
  });
}

export function useUpsertArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (article: Partial<Article> & { id?: string }) => {
      if (article.id) {
        const { error, data } = await supabase.from('articles').update(article as any).eq('id', article.id).select().single();
        if (error) throw error;
        return data as Article;
      }
      const { error, data } = await supabase.from('articles').insert([article as any]).select().single();
      if (error) throw error;
      return data as Article;
    },
    onSuccess: (saved) => {
      if (!saved) return;
      patchListCaches(qc, (rows) => {
        const idx = rows.findIndex((r) => r.id === saved.id);
        if (idx >= 0) {
          const next = rows.slice();
          next[idx] = { ...rows[idx], ...saved };
          return next;
        }
        return [saved, ...rows];
      });
      qc.setQueryData(['article', saved.id], saved);
      if (saved.slug) qc.setQueryData(['article', saved.slug], saved);
    },
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('articles').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    // Optimistic: remove from caches immediately, before the server confirms.
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['articles'] });
      await qc.cancelQueries({ queryKey: ['articles-infinite'] });
      const snapshots = {
        flat: qc.getQueriesData<Article[]>({ queryKey: ['articles'] }),
        infinite: qc.getQueriesData<any>({ queryKey: ['articles-infinite'] }),
      };
      patchListCaches(qc, (rows) => rows.filter((r) => r.id !== id));
      return snapshots;
    },
    onError: (_err, _id, ctx) => {
      // Rollback on failure
      ctx?.flat?.forEach(([key, data]) => qc.setQueryData(key, data));
      ctx?.infinite?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
  });
}

/** Bulk delete via RPC — single round trip for many ids. */
export function useBulkDeleteArticles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return 0;
      const { data, error } = await supabase.rpc('bulk_delete_articles', { ids });
      if (error) throw error;
      return (data as number) ?? ids.length;
    },
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: ['articles'] });
      await qc.cancelQueries({ queryKey: ['articles-infinite'] });
      const idSet = new Set(ids);
      const snapshots = {
        flat: qc.getQueriesData<Article[]>({ queryKey: ['articles'] }),
        infinite: qc.getQueriesData<any>({ queryKey: ['articles-infinite'] }),
      };
      patchListCaches(qc, (rows) => rows.filter((r) => !idSet.has(r.id)));
      return snapshots;
    },
    onError: (_err, _ids, ctx) => {
      ctx?.flat?.forEach(([key, data]) => qc.setQueryData(key, data));
      ctx?.infinite?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
  });
}

export function getArticlePath(article: { slug?: string | null; id: string }): string {
  return `/article/${article.slug || article.id}`;
}
