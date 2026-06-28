import { useState, useMemo } from 'react';
import type { NewsArticle } from '@/data/mockNews';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import ShareButtons from './ShareButtons';
import { decodeHtml, stripHtml, cleanTitle, extractMedia } from '@/lib/decodeHtml';
import { getProxiedImageUrl } from '@/lib/imageProxy';
import { getSmartTimeAgo } from '@/lib/timeAgo';

interface NewsCardProps {
  article: NewsArticle;
  featured?: boolean;
}

export default function NewsCard({ article, featured = false }: NewsCardProps) {
  const isArabic = article.section === 'arabic';
  const timeAgo = getSmartTimeAgo(article.publishDate, isArabic);
  const [imgFailed, setImgFailed] = useState(false);

  const media = useMemo(
    () => extractMedia(`${article.title || ''} ${article.summary || ''} ${article.content || ''}`),
    [article.title, article.summary, article.content]
  );

  const directImage = article.image || media.poster || media.imageUrl || null;
  const imgSrc = getProxiedImageUrl(directImage);
  const hasImage = !!imgSrc && !imgFailed;
  const hasVideo = !!(article.video || (article as any).video_url || media.videoUrl);
  const slug = (article as any).slug;
  const link = `/article/${slug || article.id}`;

  const summary = article.summary
    ? stripHtml(decodeHtml(article.summary)).slice(0, 150)
    : stripHtml(decodeHtml(article.content)).slice(0, 150);

  const handleImgError = () => {
    setImgFailed(true);
  };

  return (
    <Link
      to={link}
      className={`block bg-card rounded-lg overflow-hidden news-card-hover shadow-sm border border-border ${featured ? 'md:col-span-2 md:row-span-2' : ''}`}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {hasImage && (
        <div className="relative aspect-[16/9] bg-muted overflow-hidden">
          <img
            src={imgSrc!}
            alt={cleanTitle(article.title)}
            width={640}
            height={360}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={handleImgError}
          />
          {hasVideo && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/55 rounded-full w-14 h-14 flex items-center justify-center">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
            </div>
          )}
          {article.isBreaking && (
            <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded font-arabic">
              {isArabic ? 'عاجل' : 'BREAKING'}
            </span>
          )}
          <span className={`absolute top-2 ${isArabic ? 'left-auto right-2' : 'right-2'} bg-secondary/90 text-secondary-foreground text-xs px-2 py-1 rounded ${isArabic ? 'font-arabic' : 'font-english'}`}>
            {article.category}
          </span>
        </div>
      )}

      {!hasImage && (
        <div className="px-4 pt-3 flex items-center gap-2">
          {article.isBreaking && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded font-arabic">
              {isArabic ? 'عاجل' : 'BREAKING'}
            </span>
          )}
          <span className={`bg-secondary/90 text-secondary-foreground text-xs px-2 py-0.5 rounded ${isArabic ? 'font-arabic' : 'font-english'}`}>
            {article.category}
          </span>
        </div>
      )}

      <div className="p-4">
        <h3 className={`font-bold mb-1 line-clamp-2 text-card-foreground ${featured ? 'text-xl' : 'text-base'} ${isArabic ? 'font-arabic' : 'font-english'}`}>
          {cleanTitle(article.title)}
        </h3>
        <p className={`text-muted-foreground text-[13px] mb-2 line-clamp-2 ${isArabic ? 'font-arabic' : 'font-english'}`}>
          {summary}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className={isArabic ? 'font-arabic' : 'font-english'}>{article.source}</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
          <div onClick={(e) => e.preventDefault()}>
            <ShareButtons article={article} compact />
          </div>
        </div>
      </div>
    </Link>
  );
}
