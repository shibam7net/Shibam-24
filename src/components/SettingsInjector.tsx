import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { DEFAULT_ROBOTS, DEFAULT_SITE_DESCRIPTION, DEFAULT_SITE_TITLE } from '@/hooks/useResolvedSeo';

/** Injects GA / GTM / custom head snippets from site_settings into <head> at runtime. */
export default function SettingsInjector() {
  const { data } = useSiteSettings();
  const a = data?.analytics;
  const seo = data?.seo;

  useEffect(() => {
    const created: HTMLElement[] = [];
    const resolvedTitle = seo?.meta_title?.trim() || DEFAULT_SITE_TITLE;
    const resolvedDescription = seo?.meta_description?.trim() || DEFAULT_SITE_DESCRIPTION;
    const resolvedRobots = seo?.robots?.trim() || DEFAULT_ROBOTS;

    if (!document.title?.trim()) {
      document.title = resolvedTitle;
    }

    const ensureMeta = (name: string, content: string) => {
      let meta = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
        created.push(meta);
      }
      if (!meta.getAttribute('content')?.trim()) {
        meta.setAttribute('content', content);
      }
    };

    ensureMeta('description', resolvedDescription);
    ensureMeta('robots', resolvedRobots);

    if (!a) {
      return () => { created.forEach((el) => el.remove()); };
    }

    if (a.ga_id && /^G-[A-Z0-9]+$/i.test(a.ga_id)) {
      const s1 = document.createElement('script');
      s1.async = true;
      s1.src = `https://www.googletagmanager.com/gtag/js?id=${a.ga_id}`;
      s1.dataset.injected = 'ga';
      document.head.appendChild(s1); created.push(s1);

      const s2 = document.createElement('script');
      s2.dataset.injected = 'ga-init';
      s2.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${a.ga_id}');`;
      document.head.appendChild(s2); created.push(s2);
    }

    if (a.gtm_id && /^GTM-[A-Z0-9]+$/i.test(a.gtm_id)) {
      const s = document.createElement('script');
      s.dataset.injected = 'gtm';
      s.text = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${a.gtm_id}');`;
      document.head.appendChild(s); created.push(s);
    }

    if (a.custom_head?.trim()) {
      const wrap = document.createElement('div');
      wrap.dataset.injected = 'custom-head';
      wrap.style.display = 'none';
      wrap.innerHTML = a.custom_head;
      document.head.appendChild(wrap); created.push(wrap);
    }


    return () => { created.forEach((el) => el.remove()); };
  }, [a?.ga_id, a?.gtm_id, a?.custom_head, seo?.meta_description, seo?.meta_title, seo?.robots]);

  return null;
}
