import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import NewsCard from '@/components/NewsCard';
import { supabase } from '@/integrations/supabase/client';
import { cleanTitle, stripHtml } from '@/lib/decodeHtml';

function toNewsArticle(a: any) {
  return {
    id: a.id,
    title: cleanTitle(a.title),
    summary: stripHtml(a.summary || ''),
    content: stripHtml(a.content || ''),
    image: a.image_url || undefined,
    video: a.video_url || undefined,
    category: a.category,
    author: a.author,
    source: a.source_name,
    sourceUrl: a.source_url || undefined,
    publishDate: a.published_at,
    section: a.section as 'arabic' | 'global',
    views: a.views,
    trendScore: a.trend_score,
    isBreaking: a.is_breaking,
    isTrending: a.is_trending,
    tags: a.tags || [],
  };
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').trim();

  const { data: results = [] } = useQuery({
    queryKey: ['search', query],
    enabled: query.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_articles', {
        p_query: query,
        p_section: null,
        p_limit: 60,
      });
      if (error) throw error;
      return (data || []).map(toNewsArticle);
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-2 font-arabic" dir="rtl">
          نتائج البحث: "{query}"
        </h1>
        <p className="text-muted-foreground mb-6 font-arabic" dir="rtl">
          {results.length > 0 ? `تم العثور على ${results.length} نتيجة` : 'لا توجد نتائج'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map(article => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
