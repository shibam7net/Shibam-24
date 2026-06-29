import { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import BreakingTicker from '@/components/BreakingTicker';
import CommodityTicker from '@/components/CommodityTicker';
import CurrencyTicker from '@/components/CurrencyTicker';
import NewsCard from '@/components/NewsCard';
import NewsSidebar from '@/components/NewsSidebar';
import NewsSlider from '@/components/NewsSlider';
import Pagination from '@/components/Pagination';
import { useArticlesPage } from '@/hooks/useArticlesPage';
import { type Article } from '@/hooks/useArticles';
import { arabicCategories, globalCategories } from '@/data/mockNews';
import { cleanTitle, stripHtml } from '@/lib/decodeHtml';
import { absoluteSiteUrl } from '@/lib/site';
import { useResolvedSeo } from '@/hooks/useResolvedSeo';

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

export default function SectionPage() {
  const { section, page: pageParam } = useParams<{ section: string; page?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isArabic = section === 'arabic';
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
  const initialCategory = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category'));
  }, [searchParams]);

  const { data, isLoading } = useArticlesPage({
    section,
    category: selectedCategory,
    page,
  });
  const { metaTitle: siteMetaTitle, robots } = useResolvedSeo();
  const rows = data?.rows || [];
  const totalPages = data?.totalPages || 1;

  const allNews = useMemo(() => rows.map(toNewsArticle), [rows]);
  const categories = isArabic ? arabicCategories : globalCategories;
  const breakingItems = allNews.filter((n) => n.isBreaking).map((n) => n.title);

  const trending = useMemo(() => [...allNews].sort((a, b) => b.trendScore - a.trendScore), [allNews]);
  const mostRead = useMemo(() => [...allNews].sort((a, b) => b.views - a.views), [allNews]);

  const buildUrl = (p: number) => {
    const catQ = selectedCategory ? `?category=${encodeURIComponent(selectedCategory)}` : '';
    return p === 1 ? `/section/${section}${catQ}` : `/section/${section}/page/${p}${catQ}`;
  };

  const handlePageChange = (p: number) => {
    navigate(buildUrl(p));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryChange = (cat: string | null) => {
    setSelectedCategory(cat);
    const catQ = cat ? `?category=${encodeURIComponent(cat)}` : '';
    navigate(`/section/${section}${catQ}`);
  };

  const sectionTitle = isArabic ? 'أخبار العرب' : 'World News';
  const pageTitle = selectedCategory ? `${selectedCategory} | ${sectionTitle}` : sectionTitle;
  const titleWithPage = page > 1 ? `${pageTitle} — صفحة ${page}` : pageTitle;
  const canonical = absoluteSiteUrl(buildUrl(page));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>{`${titleWithPage} | ${siteMetaTitle}`}</title>
        <meta name="description" content={`${pageTitle} - شبام 24 منصة إخبارية شاملة.`} />
        <meta name="robots" content={robots} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={titleWithPage} />
        <meta property="og:url" content={canonical} />
        {page > 1 && <link rel="prev" href={absoluteSiteUrl(buildUrl(page - 1))} />}
        {page < totalPages && <link rel="next" href={absoluteSiteUrl(buildUrl(page + 1))} />}
      </Helmet>
      <SiteHeader />
      <BreakingTicker items={breakingItems.length > 0 ? breakingItems : allNews.slice(0, 5).map((n) => n.title)} isArabic={isArabic} />
      <CommodityTicker />
      <CurrencyTicker />

      <main className="flex-1 container mx-auto px-4 py-6" dir={isArabic ? 'rtl' : 'ltr'}>
        <h1 className={`text-2xl font-bold mb-4 ${isArabic ? 'font-arabic' : 'font-english'}`}>
          {sectionTitle}
        </h1>

        {page === 1 && allNews.length > 0 && (
          <div className="mb-6">
            <NewsSlider articles={allNews.slice(0, 8)} isArabic={isArabic} />
          </div>
        )}

        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
          <button
            onClick={() => handleCategoryChange(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${!selectedCategory ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'} ${isArabic ? 'font-arabic' : 'font-english'}`}
          >
            {isArabic ? 'الكل' : 'All'}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'} ${isArabic ? 'font-arabic' : 'font-english'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading && rows.length === 0 ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : allNews.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground font-arabic">لا توجد أخبار في هذا القسم</div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allNews.map((article, i) => (
                  <NewsCard key={article.id} article={article} featured={page === 1 && i === 0} />
                ))}
              </div>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                isArabic={isArabic}
              />
            </div>
            <div className="w-full lg:w-80 flex-shrink-0">
              <NewsSidebar trending={trending} mostRead={mostRead} isArabic={isArabic} />
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
