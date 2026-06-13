export interface NewsArticle {
  id: string;
  title: string;
  titleEn?: string;
  summary: string;
  content: string;
  image?: string;
  video?: string;
  category: string;
  author: string;
  source: string;
  sourceUrl?: string;
  publishDate: string;
  section: 'arabic' | 'global';
  views: number;
  trendScore: number;
  isBreaking?: boolean;
  isTrending?: boolean;
  tags: string[];
  slug?: string;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  fetchMethod: 'rss' | 'scraping' | 'headless' | 'ai-analysis' | 'firecrawl';
  section: 'arabic' | 'global';
  isActive: boolean;
  lastFetch?: string;
  interval: number;
}

export const arabicCategories = [
  'عاجل', 'أخبار محلية', 'سياسة', 'اقتصاد', 'رياضة', 'تكنولوجيا', 'صحة', 'فن', 'مقالات', 'عملات وأسعار', 'ثقافة', 'أخبار'
];

export const globalCategories = [
  'Breaking', 'Local News', 'Politics', 'Economy', 'Sports', 'Technology', 'Health', 'Art', 'Articles', 'Markets', 'Culture', 'News'
];

export const mockArabicNews: NewsArticle[] = [];
export const mockGlobalNews: NewsArticle[] = [];
export const mockSources: NewsSource[] = [];
