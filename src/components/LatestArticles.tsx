import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { NewsArticle } from '@/data/mockNews';
import { decodeHtml , cleanTitle} from '@/lib/decodeHtml';
import { getProxiedImageUrl } from '@/lib/imageProxy';

interface LatestArticlesProps {
  articles: NewsArticle[];
  title: string;
  isArabic?: boolean;
}

export default function LatestArticles({ articles, title, isArabic = true }: LatestArticlesProps) {
  const latest = articles.slice(0, 5);
  if (latest.length === 0) return null;

  return (
    <div className="mt-8" dir={isArabic ? 'rtl' : 'ltr'}>
      <h2 className={`text-lg font-bold mb-4 border-b-2 border-primary pb-2 ${isArabic ? 'font-arabic' : 'font-english'}`}>
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {latest.map(article => (
          <ArticleCard key={article.id} article={article} isArabic={isArabic} />
        ))}
      </div>
    </div>
  );
}

function ArticleCard({ article, isArabic }: { article: NewsArticle; isArabic: boolean }) {
  const [imgFailed, setImgFailed] = useState(false);
  const imgSrc = getProxiedImageUrl(article.image);
  const hasImage = !!imgSrc && !imgFailed;
  const slug = (article as any).slug;
  const link = `/article/${slug || article.id}`;

  return (
    <Link
      to={link}
      className="block bg-card border border-border rounded-lg overflow-hidden news-card-hover shadow-sm"
    >
      {hasImage && (
        <img
          src={imgSrc!}
          alt={cleanTitle(article.title)}
          className="w-full h-auto max-h-36 object-cover bg-muted"
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      )}
      <div className="p-3">
        <h3 className={`text-sm font-bold line-clamp-2 text-card-foreground ${isArabic ? 'font-arabic' : 'font-english'}`}>
          {cleanTitle(article.title)}
        </h3>
        <p className={`text-xs text-muted-foreground mt-1 ${isArabic ? 'font-arabic' : 'font-english'}`}>
          {article.source}
        </p>
      </div>
    </Link>
  );
}
