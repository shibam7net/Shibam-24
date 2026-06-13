import { useState, useMemo, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Newspaper, Globe } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import BreakingTicker from '@/components/BreakingTicker';
import CommodityTicker from '@/components/CommodityTicker';
import CurrencyTicker from '@/components/CurrencyTicker';
import NewsCard from '@/components/NewsCard';
import NewsSidebar from '@/components/NewsSidebar';
import NewsSlider from '@/components/NewsSlider';
import SponsorsTicker from '@/components/SponsorsTicker';
import Pagination from '@/components/Pagination';
import { useArticlesPage } from '@/hooks/useArticlesPage';
import { type Article } from '@/hooks/useArticles';
import { arabicCategories, globalCategories } from '@/data/mockNews';
import { supabase } from '@/integrations/supabase/client';
import { cleanTitle, stripHtml } from '@/lib/decodeHtml';
import { absoluteSiteUrl } from '@/lib/site';

function toNewsArticle(a: Article) {
  return {
    id: a.id,
    title: cleanTitle(a.title),
    summary: stripHtml(a.summary),
    content: stripHtml(a.content),
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
    slug: (a as any).slug,
  };
}

export default function Index() {
  const { page: pageParam } = useParams<{ page?: string }>();
  const navigate = useNavigate();
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);

  const [activeTab, setActiveTab] = useState<'arabic' | 'global'>(() => {
    return (sessionStorage.getItem('index_tab') as 'arabic' | 'global') || 'arabic';
  });

  useEffect(() => {
    sessionStorage.setItem('index_tab', activeTab);
  }, [activeTab]);

  const { data, isLoading } = useArticlesPage({ section: activeTab, page });
  const rows = data?.rows || [];
  const totalPages = data?.totalPages || 1;

  useEffect(() => {
    const t = setTimeout(() => {
      supabase.functions.invoke('fetch-news').catch(() => {});
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  const news = useMemo(() => rows.map(toNewsArticle), [rows]);
  const breakingItems = news.filter((n) => n.isBreaking).map((n) => n.title);
  const tickerItems = breakingItems.length > 0 ? breakingItems : news.slice(0, 5).map((n) => n.title);
  const trending = useMemo(() => [...news].sort((a, b) => b.trendScore - a.trendScore), [news]);
  const mostRead = useMemo(() => [...news].sort((a, b) => b.views - a.views), [news]);
  const sliderArticles = trending.slice(0, 8);
  const categories = activeTab === 'arabic' ? arabicCategories : globalCategories;
  const showSkeleton = isLoading && rows.length === 0;

  const handlePageChange = (p: number) => {
    navigate(p === 1 ? '/' : `/page/${p}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canonical = absoluteSiteUrl(page === 1 ? '/' : `/page/${page}`);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>{page === 1 ? 'شبام24 — أخبار عربية وعالمية' : `شبام24 — صفحة ${page}`}</title>
        <link rel="canonical" href={canonical} />
        {page > 1 && <link rel="prev" href={absoluteSiteUrl(page === 2 ? '/' : `/page/${page - 1}`)} />}
        {page < totalPages && <link rel="next" href={absoluteSiteUrl(`/page/${page + 1}`)} />}
      </Helmet>
      <SiteHeader />
      <BreakingTicker items={tickerItems} isArabic={activeTab === 'arabic'} />
      <CommodityTicker />
      <CurrencyTicker />

      <main className="flex-1 container mx-auto px-4 py-6">
        {page === 1 && sliderArticles.length > 0 && (
          <div className="mb-2">
            <NewsSlider articles={sliderArticles} isArabic={activeTab === 'arabic'} />
          </div>
        )}

        <SponsorsTicker />

        <div className="flex items-center justify-center gap-3 mb-4">
          <button
            onClick={() => { setActiveTab('arabic'); if (page !== 1) navigate('/'); }}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'arabic'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-card text-card-foreground border border-border hover:bg-muted'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span className="font-arabic text-sm">أخبار العرب</span>
          </button>
          <button
            onClick={() => { setActiveTab('global'); if (page !== 1) navigate('/'); }}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'global'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-card text-card-foreground border border-border hover:bg-muted'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span className="font-english text-sm">World News</span>
          </button>
        </div>

        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide" dir={activeTab === 'arabic' ? 'rtl' : 'ltr'}>
          {categories.map((cat) => (
            <Link
              key={cat}
              to={`/section/${activeTab === 'arabic' ? 'arabic' : 'global'}?category=${encodeURIComponent(cat)}`}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-card text-card-foreground hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap ${activeTab === 'arabic' ? 'font-arabic' : 'font-english'}`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {showSkeleton ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
                <div className="h-40 bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground font-arabic">
            <p className="text-lg mb-2">لا توجد أخبار بعد</p>
            <p className="text-sm">جاري جلب الأخبار تلقائياً من المصادر...</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6" dir={activeTab === 'arabic' ? 'rtl' : 'ltr'}>
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {news.map((article, i) => (
                  <NewsCard key={article.id} article={article} featured={page === 1 && i === 0} />
                ))}
              </div>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                isArabic={activeTab === 'arabic'}
              />
            </div>
            <div className="w-full lg:w-80 flex-shrink-0">
              <NewsSidebar trending={trending} mostRead={mostRead} isArabic={activeTab === 'arabic'} />
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
