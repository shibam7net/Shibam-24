import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { trackPageView } from '@/lib/analytics';
import { getArticlePath } from '@/hooks/useArticles';

/** Tracks every route change as a page view. Mount once inside <BrowserRouter>. */
export function usePageTracking() {
  const location = useLocation();
  useEffect(() => {
    // article_id is resolved on the article page itself via trackPageView() with the id
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
}

/** Convenience hook for article pages once the article id is known. */
export function useArticleView(articleId?: string | null) {
  const params = useParams();
  useEffect(() => {
    if (!articleId) return;
    trackPageView(getArticlePath({ id: articleId, slug: typeof params.slug === 'string' ? params.slug : null }), articleId);
  }, [articleId, params.slug]);
}
