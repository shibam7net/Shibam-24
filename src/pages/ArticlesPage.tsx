import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { useArticles, type Article } from '@/hooks/useArticles';
import { cleanTitle, stripHtml } from '@/lib/decodeHtml';
import { getSmartTimeAgo } from '@/lib/timeAgo';
import { getArticlePath } from '@/hooks/useArticles';
import { absoluteSiteUrl } from '@/lib/site';
import { useResolvedSeo } from '@/hooks/useResolvedSeo';

export default function ArticlesPage() {
  const { data: dbArticles = [], isLoading } = useArticles();
  const { metaTitle: siteMetaTitle, robots } = useResolvedSeo();

  const articles = useMemo(() =>
    dbArticles
      .filter(a => a.category === 'مقالات' || a.category === 'Articles')
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()),
    [dbArticles]
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>{`مقالات | ${siteMetaTitle}`}</title>
        <meta name="description" content="مقالات وتحليلات وآراء من شبام24 - أحدث المقالات العربية والعالمية" />
        <meta name="robots" content={robots} />
        <link rel="canonical" href={absoluteSiteUrl("/articles")} />
      </Helmet>
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-6" dir="rtl">
        <h1 className="text-2xl font-bold mb-6 font-arabic">مقالات</h1>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground font-arabic">لا توجد مقالات حالياً</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {articles.slice(0, 40).map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const isArabic = article.section === 'arabic';
  return (
    <Link
      to={getArticlePath(article)}
      className="block bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors shadow-sm"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <h3 className={`text-sm font-bold line-clamp-2 text-card-foreground mb-2 ${isArabic ? 'font-arabic' : 'font-english'}`}>
        {cleanTitle(article.title)}
      </h3>
      <p className={`text-xs text-muted-foreground line-clamp-2 mb-2 ${isArabic ? 'font-arabic' : 'font-english'}`}>
        {stripHtml(article.summary).slice(0, 100)}
      </p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className={isArabic ? 'font-arabic' : 'font-english'}>{article.author}</span>
        <span>{getSmartTimeAgo(article.published_at, isArabic)}</span>
      </div>
    </Link>
  );
}
