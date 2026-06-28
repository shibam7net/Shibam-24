import { useMemo } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export const DEFAULT_SITE_TITLE = 'شبام24 | أخبار عربية وعالمية على مدار الساعة';
export const DEFAULT_SITE_DESCRIPTION = 'شبام24 منصة إخبارية احترافية تغطي الأخبار العربية والعالمية لحظة بلحظة، مع السياسة والاقتصاد والرياضة والتقنية والراديو المباشر وأرشيف قابل للفهرسة.';
export const DEFAULT_ROBOTS = 'index,follow';

export function useResolvedSeo() {
  const { data } = useSiteSettings();

  return useMemo(() => {
    const metaTitle = data?.seo?.meta_title?.trim() || DEFAULT_SITE_TITLE;
    const metaDescription = data?.seo?.meta_description?.trim() || DEFAULT_SITE_DESCRIPTION;
    const robots = data?.seo?.robots?.trim() || DEFAULT_ROBOTS;

    return {
      metaTitle,
      metaDescription,
      robots,
    };
  }, [data?.seo?.meta_description, data?.seo?.meta_title, data?.seo?.robots]);
}
