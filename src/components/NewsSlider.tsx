import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { NewsArticle } from '@/data/mockNews';
import { decodeHtml , cleanTitle} from '@/lib/decodeHtml';
import { getProxiedImageUrl } from '@/lib/imageProxy';

interface NewsSliderProps {
  articles: NewsArticle[];
  isArabic?: boolean;
}

export default function NewsSlider({ articles, isArabic = true }: NewsSliderProps) {
  const [current, setCurrent] = useState(0);
  const [imgFailed, setImgFailed] = useState<Record<number, boolean>>({});
  const slidesToShow = articles.filter(a => !!a.image).slice(0, 8);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % slidesToShow.length);
  }, [slidesToShow.length]);

  const prev = useCallback(() => {
    setCurrent(prev => (prev - 1 + slidesToShow.length) % slidesToShow.length);
  }, [slidesToShow.length]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  if (slidesToShow.length === 0) return null;

  const article = slidesToShow[current];
  const direct = article.image || null;
  const imgSrc = getProxiedImageUrl(direct);
  const hasImage = !!imgSrc && !imgFailed[current];

  const handleErr = () => {
    setImgFailed(p => ({ ...p, [current]: true }));
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-card border border-border shadow-sm">
      <Link to={`/article/${(article as any).slug || article.id}`} className="block relative">
        {hasImage ? (
          <div className="relative w-full" style={{ maxHeight: '420px' }}>
            <img
              src={imgSrc!}
              alt={cleanTitle(article.title)}
              className="w-full h-auto max-h-[420px] object-cover bg-muted"
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={handleErr}
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
            <span className="text-4xl opacity-30">📰</span>
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
          <h3 className={`text-lg md:text-xl font-bold text-white leading-snug line-clamp-2 ${isArabic ? 'font-arabic' : 'font-english'}`}>
            {cleanTitle(article.title)}
          </h3>
          <p className={`text-xs text-white/70 mt-1 ${isArabic ? 'font-arabic' : 'font-english'}`}>
            {article.source}
          </p>
        </div>
      </Link>

      <button
        onClick={(e) => { e.preventDefault(); prev(); }}
        className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); next(); }}
        className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="absolute bottom-1 inset-x-0 flex justify-center gap-1.5 pb-1">
        {slidesToShow.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-primary' : 'bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
}
