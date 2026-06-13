import type { NewsArticle } from '@/data/mockNews';
import { Link } from 'react-router-dom';
import { TrendingUp, Eye } from 'lucide-react';
import { getSmartTimeAgo } from '@/lib/timeAgo';

interface NewsSidebarProps {
  trending: NewsArticle[];
  mostRead: NewsArticle[];
  isArabic?: boolean;
}

export default function NewsSidebar({ trending, mostRead, isArabic = true }: NewsSidebarProps) {
  return (
    <aside className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      <SidebarSection
        icon={<TrendingUp className="w-4 h-4 text-primary" />}
        title={isArabic ? 'الأكثر رواجاً' : 'Trending'}
        articles={trending}
        isArabic={isArabic}
      />
      <SidebarSection
        icon={<Eye className="w-4 h-4 text-primary" />}
        title={isArabic ? 'الأكثر قراءة' : 'Most Read'}
        articles={mostRead}
        isArabic={isArabic}
      />
    </aside>
  );
}

function SidebarSection({
  icon,
  title,
  articles,
  isArabic,
}: {
  icon: React.ReactNode;
  title: string;
  articles: NewsArticle[];
  isArabic: boolean;
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className={`flex items-center gap-2 font-bold text-base mb-3 text-card-foreground ${isArabic ? 'font-arabic' : 'font-english'}`}>
        {icon}
        {title}
      </h3>
      <div className="space-y-3">
        {articles.slice(0, 5).map((article, i) => (
          <Link
            key={article.id}
            to={`/article/${(article as any).slug || article.id}`}
            className="flex gap-3 group"
          >
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors ${isArabic ? 'font-arabic' : 'font-english'}`}>
                {article.title}
              </p>
              <span className="text-xs text-muted-foreground">
                {article.source} • {getSmartTimeAgo(article.publishDate, isArabic)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
