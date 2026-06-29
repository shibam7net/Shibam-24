import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import ShareButtons from '@/components/ShareButtons';
import ReadingProgress from '@/components/ReadingProgress';
import { useArticle, useArticles, getArticlePath } from '@/hooks/useArticles';
import { useSources } from '@/hooks/useSources';
import { Calendar, Eye, ArrowRight, ChevronRight, ExternalLink, Clock, Tag } from 'lucide-react';
import { decodeHtml, stripHtml, cleanTitle, extractMedia } from '@/lib/decodeHtml';
import VideoPlayer from '@/components/VideoPlayer';
import { getSmartTimeAgo } from '@/lib/timeAgo';
import { useState, useEffect } from 'react';
import { trackPageView } from '@/lib/analytics';
import { absoluteSiteUrl } from '@/lib/site';
import { getArticleSlug, getArticleUrl } from '@/lib/articleUrls';
import { getProxiedImageUrl } from '@/lib/imageProxy';
import { useResolvedSeo } from '@/hooks/useResolvedSeo';

function HeroImage({ url, alt }: { url: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const proxied = getProxiedImageUrl(url);
  if (failed || !proxied) return null;
  return (
    <img
      src={proxied}
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover"
      loading="eager"
      decoding="async"
      fetchPriority="high"
      onError={() => setFailed(true)}
    />
  );
}

function RelatedImage({ url, alt }: { url: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const proxied = getProxiedImageUrl(url);
  if (failed || !proxied) return null;
  return (
    <img src={proxied} alt={alt} className="w-20 h-20 object-cover rounded-md flex-shrink-0" loading="lazy" onError={() => setFailed(true)} />
  );
}

function ArticleSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-72 sm:h-96 bg-muted rounded-xl mb-6" />
          <div className="h-8 bg-muted rounded w-3/4 mb-3" />
          <div className="h-8 bg-muted rounded w-1/2 mb-6" />
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-11/12" />
            <div className="h-4 bg-muted rounded w-10/12" />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: article, isLoading } = useArticle(slug || '');
  const { data: allArticles = [] } = useArticles();
  const { data: allSources = [] } = useSources();
  const { robots } = useResolvedSeo();

  useEffect(() => {
    if (!article?.id) return;
    trackPageView(getArticlePath(article), article.id);
  }, [article]);

  useEffect(() => {
    if (!article?.id) return;

    const canonicalPath = getArticlePath(article);
    if (location.pathname !== canonicalPath) {
      navigate({ pathname: canonicalPath, search: location.search, hash: location.hash }, { replace: true });
    }
  }, [article, location.hash, location.pathname, location.search, navigate]);

  if (!article && isLoading) return <ArticleSkeleton />;

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground font-arabic text-xl">المقال غير موجود</p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const isArabic = article.section === 'arabic';

  const source = allSources.find(s => s.id === article.source_id);
  const hideSource = source?.hide_source ?? false;
  const displaySourceName = hideSource && source?.alt_source_name ? source.alt_source_name : article.source_name;
  const displaySourceUrl = hideSource && source?.alt_source_url ? source.alt_source_url : article.source_url;

  const related = allArticles
    .filter(a => a.id !== article.id && a.category === article.category && a.section === article.section)
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 5);

  const latest = allArticles
    .filter(a => a.id !== article.id && a.section === article.section)
    .slice(0, 6);


  const publishDate = new Date(article.published_at).toLocaleDateString(isArabic ? 'ar' : 'en', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const cleanContent = stripHtml(decodeHtml(article.content));
  const contentParagraphs = cleanContent.split(/\n+/).filter(p => p.trim().length > 0);
  const wordCount = cleanContent.split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.round(wordCount / (isArabic ? 180 : 220)));

  const rawHtml = `${article.title || ''} ${article.summary || ''} ${article.content || ''}`;
  const media = extractMedia(rawHtml);
  const videoUrl = (article as any).video_url || media.videoUrl;
  const videoPoster = media.poster || article.image_url || undefined;
  const heroImage = article.image_url || media.imageUrl || null;
  const socialImageSource = article.image_url || media.imageUrl || null;
  const socialImage = getProxiedImageUrl(socialImageSource) || absoluteSiteUrl('/og-image.png');
  const cleanedTitle = cleanTitle(article.title);
  const cleanedSummary = stripHtml(decodeHtml(article.summary || ''));

  const shareArticle = {
    id: article.id,
    title: cleanedTitle,
    summary: cleanedSummary,
    content: cleanContent,
    image: article.image_url || undefined,
    category: article.category,
    author: article.author,
    source: displaySourceName,
    publishDate: article.published_at,
    section: article.section as 'arabic' | 'global',
    views: article.views,
    trendScore: article.trend_score,
    tags: article.tags || [],
    slug: getArticleSlug(article as any),
  };

  const siteUrl = absoluteSiteUrl('/').replace(/\/$/, '');
  const articleUrl = getArticleUrl(article as any);
  const metaTitle = cleanedTitle.slice(0, 110);
  const metaDesc = (cleanedSummary || cleanContent.slice(0, 180) || cleanedTitle).slice(0, 180);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": cleanedTitle,
    ...(socialImage ? { "image": [socialImage] } : {}),
    "datePublished": article.published_at,
    "dateModified": article.created_at,
    "author": { "@type": "Person", "name": article.author || 'شبام 24' },
    "publisher": {
      "@type": "Organization",
      "name": "شبام 24",
      "logo": { "@type": "ImageObject", "url": `${siteUrl}/logo.png` }
    },
    "description": metaDesc,
    "articleSection": article.category,
    "inLanguage": isArabic ? 'ar' : 'en',
    "wordCount": wordCount,
    "mainEntityOfPage": { "@type": "WebPage", "@id": articleUrl }
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": isArabic ? "الرئيسية" : "Home", "item": siteUrl },
      { "@type": "ListItem", "position": 2, "name": article.category, "item": `${siteUrl}/section/${article.section}?category=${encodeURIComponent(article.category)}` },
      { "@type": "ListItem", "position": 3, "name": cleanedTitle.slice(0, 50) }
    ]
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>{`${metaTitle} | شبام 24`}</title>
        <meta name="description" content={metaDesc} />
        <meta name="robots" content={`${robots},max-image-preview:large`} />
        <link rel="canonical" href={articleUrl} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:url" content={articleUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="شبام 24" />
        <meta property="og:locale" content={isArabic ? 'ar_AR' : 'en_US'} />
        <meta property="article:published_time" content={article.published_at} />
        <meta property="article:modified_time" content={article.created_at} />
        <meta property="article:section" content={article.category} />
        <meta property="og:image" content={socialImage} />
        <meta property="og:image:secure_url" content={socialImage} />
        <meta property="og:image:alt" content={cleanedTitle} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Shibam24" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDesc} />
        <meta name="twitter:image" content={socialImage} />
        <meta name="twitter:image:alt" content={cleanedTitle} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <ReadingProgress />
      <SiteHeader />

      {/* HERO */}
      <header className="relative w-full bg-secondary text-white overflow-hidden" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="relative h-[58vh] min-h-[360px] max-h-[640px] w-full">
          {videoUrl ? (
            <div className="absolute inset-0">
              <VideoPlayer src={videoUrl} poster={videoPoster} className="!rounded-none h-full" />
            </div>
          ) : heroImage ? (
            <HeroImage url={heroImage} alt={cleanedTitle} />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-secondary to-secondary/70" />
          )}

          {!videoUrl && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/15" />
          )}

          <div className="relative z-10 h-full container mx-auto px-4 flex flex-col justify-end pb-8 pt-20">
            <div className="max-w-4xl">
              <Link
                to={`/section/${article.section}?category=${encodeURIComponent(article.category)}`}
                className={`inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full mb-4 hover:opacity-90 transition-opacity ${isArabic ? 'font-arabic' : 'font-english'}`}
              >
                <Tag className="w-3 h-3" />
                {article.category}
              </Link>

              {!videoUrl && (
                <h1 className={`text-2xl sm:text-4xl md:text-5xl font-extrabold leading-tight text-white drop-shadow-lg mb-3 ${isArabic ? 'font-arabic' : 'font-english'}`}>
                  {cleanedTitle}
                </h1>
              )}

              {!videoUrl && cleanedSummary && (
                <p className={`hidden sm:block text-base md:text-lg text-white/85 max-w-3xl leading-relaxed line-clamp-2 ${isArabic ? 'font-arabic' : 'font-english'}`}>
                  {cleanedSummary}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6" dir={isArabic ? 'rtl' : 'ltr'}>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6 flex-wrap">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 hover:text-primary transition-colors bg-muted/50 px-3 py-1.5 rounded-full">
            <ArrowRight className={`w-4 h-4 ${!isArabic ? 'rotate-180' : ''}`} />
            <span className={isArabic ? 'font-arabic' : 'font-english'}>{isArabic ? 'رجوع' : 'Back'}</span>
          </button>
          <ChevronRight className={`w-3 h-3 ${isArabic ? 'rotate-180' : ''}`} />
          <Link to="/" className={`hover:text-primary ${isArabic ? 'font-arabic' : 'font-english'}`}>{isArabic ? 'الرئيسية' : 'Home'}</Link>
          <ChevronRight className={`w-3 h-3 ${isArabic ? 'rotate-180' : ''}`} />
          <Link to={`/section/${article.section}?category=${encodeURIComponent(article.category)}`} className={`hover:text-primary ${isArabic ? 'font-arabic' : 'font-english'}`}>{article.category}</Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 max-w-6xl mx-auto">
          <article>
            {/* Title for video heros (and small screens) */}
            {videoUrl && (
              <h1 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight text-foreground mb-4 ${isArabic ? 'font-arabic' : 'font-english'}`}>
                {cleanedTitle}
              </h1>
            )}

            {/* Author / meta bar */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground pb-4 mb-6 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {(article.author || 'ش').charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className={`font-semibold text-foreground ${isArabic ? 'font-arabic' : 'font-english'}`}>{article.author || 'شبام 24'}</span>
                  <span className="text-xs">{getSmartTimeAgo(article.published_at, isArabic)}</span>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1"><Calendar className="w-4 h-4" />{publishDate}</span>
              <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" />{readingMinutes} {isArabic ? 'دقيقة قراءة' : 'min read'}</span>
              <span className="inline-flex items-center gap-1"><Eye className="w-4 h-4" />{article.views.toLocaleString()}</span>
            </div>

            {/* Summary as lead paragraph */}
            {cleanedSummary && (
              <p className={`text-lg md:text-xl text-foreground/85 mb-6 leading-relaxed font-medium ${isArabic ? 'font-arabic border-r-4 border-primary pr-4' : 'font-english border-l-4 border-primary pl-4'}`}>
                {cleanedSummary}
              </p>
            )}

            {/* Share at top */}
            <div className="mb-6"><ShareButtons article={shareArticle} /></div>

            {/* Body */}
            <div
              className={`max-w-none text-foreground/90 leading-[1.95] text-[17px] md:text-[18px] space-y-5 ${isArabic ? 'font-arabic' : 'font-english'}`}
              style={{ wordBreak: 'break-word' }}
            >
              {contentParagraphs.map((p, i) => (
                <p key={i} className="first:first-letter:text-4xl first:first-letter:font-bold first:first-letter:text-primary first:first-letter:ml-1 first:first-letter:mr-1 first:first-letter:float-right first:first-letter:leading-none rtl:first:first-letter:float-right">
                  {p}
                </p>
              ))}
            </div>

            {/* Source */}
            {!hideSource && displaySourceUrl && (
              <div className={`mt-8 pt-4 border-t border-border text-sm text-muted-foreground ${isArabic ? 'font-arabic' : 'font-english'}`}>
                {isArabic ? 'المصدر: ' : 'Source: '}
                <a href={displaySourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {displaySourceName || displaySourceUrl}
                </a>
              </div>
            )}

            {hideSource && source?.alt_source_url && (
              <div className="mt-8 pt-4 border-t border-border">
                <a
                  href={source.alt_source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-arabic font-bold text-sm hover:opacity-90 transition-opacity shadow-md"
                >
                  <ExternalLink className="w-4 h-4" />
                  {isArabic ? 'المصدر الرسمي' : 'Official Source'}
                </a>
              </div>
            )}

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8">
                {article.tags.map(tag => (
                  <Link
                    key={tag}
                    to={`/search?q=${encodeURIComponent(tag)}`}
                    className={`bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground text-xs px-3 py-1.5 rounded-full transition-colors ${isArabic ? 'font-arabic' : 'font-english'}`}
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Share at bottom */}
            <div className="mt-8 pt-6 border-t border-border">
              <p className={`text-sm text-muted-foreground mb-2 ${isArabic ? 'font-arabic' : 'font-english'}`}>{isArabic ? 'مشاركة المقال' : 'Share this article'}</p>
              <ShareButtons article={shareArticle} />
            </div>

            {/* Related — mobile/inline */}
            {related.length > 0 && (
              <section className="mt-12 lg:hidden">
                <h2 className={`text-xl font-bold mb-4 ${isArabic ? 'font-arabic' : 'font-english'}`}>{isArabic ? 'أخبار ذات صلة' : 'Related News'}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {related.map(r => (
                    <Link key={r.id} to={getArticlePath(r)} className="flex gap-3 bg-card p-3 rounded-lg border border-border hover:border-primary/40 transition-colors">
                      {r.image_url && <RelatedImage url={r.image_url} alt={cleanTitle(r.title)} />}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold line-clamp-2 ${isArabic ? 'font-arabic' : 'font-english'}`}>{cleanTitle(r.title)}</p>
                        <span className="text-xs text-muted-foreground">{getSmartTimeAgo(r.published_at, isArabic)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* SIDEBAR */}
          <aside className="hidden lg:block space-y-6">
            <div className="sticky top-4 space-y-6">
              {related.length > 0 && (
                <section className="bg-card border border-border rounded-xl p-4">
                  <h2 className={`text-base font-bold mb-3 pb-2 border-b border-border ${isArabic ? 'font-arabic' : 'font-english'}`}>
                    {isArabic ? 'أخبار ذات صلة' : 'Related News'}
                  </h2>
                  <ul className="space-y-3">
                    {related.map(r => (
                      <li key={r.id}>
                        <Link to={getArticlePath(r)} className="flex gap-3 group">
                          {r.image_url && <RelatedImage url={r.image_url} alt={cleanTitle(r.title)} />}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors ${isArabic ? 'font-arabic' : 'font-english'}`}>{cleanTitle(r.title)}</p>
                            <span className="text-xs text-muted-foreground">{getSmartTimeAgo(r.published_at, isArabic)}</span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {latest.length > 0 && (
                <section className="bg-card border border-border rounded-xl p-4">
                  <h2 className={`text-base font-bold mb-3 pb-2 border-b border-border ${isArabic ? 'font-arabic' : 'font-english'}`}>
                    {isArabic ? 'آخر الأخبار' : 'Latest News'}
                  </h2>
                  <ul className="space-y-3">
                    {latest.map(r => (
                      <li key={r.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                        <Link to={getArticlePath(r)} className={`block text-sm font-medium hover:text-primary transition-colors line-clamp-2 ${isArabic ? 'font-arabic' : 'font-english'}`}>
                          {cleanTitle(r.title)}
                        </Link>
                        <span className="text-xs text-muted-foreground">{getSmartTimeAgo(r.published_at, isArabic)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
