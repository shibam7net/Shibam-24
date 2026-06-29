import { Helmet } from 'react-helmet-async';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { absoluteSiteUrl } from '@/lib/site';
import { useResolvedSeo } from '@/hooks/useResolvedSeo';

export default function AboutPage() {
  const url = absoluteSiteUrl('/about');
  const { metaTitle: siteMetaTitle, robots } = useResolvedSeo();
  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Helmet>
        <title>{`من نحن | ${siteMetaTitle}`}</title>
        <meta name="description" content="شبام 24 منصة إخبارية عربية وعالمية مستقلة تقدم أخبارًا عاجلة وتقارير وتحليلات موثوقة على مدار الساعة." />
        <meta name="robots" content={robots} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content="من نحن — شبام 24" />
        <meta property="og:url" content={url} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'من نحن — شبام 24',
          url,
          publisher: { '@type': 'NewsMediaOrganization', name: 'شبام 24', url: absoluteSiteUrl('/') },
        })}</script>
      </Helmet>
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl font-arabic leading-loose">
        <h1 className="text-3xl font-bold mb-6">من نحن</h1>
        <p className="mb-4">
          <strong>شبام24</strong> منصة إخبارية عربية وعالمية مستقلة، تأسست لتقديم تغطية إخبارية شاملة، سريعة وموثوقة لأبرز الأحداث المحلية واليمنية والعربية والدولية على مدار الساعة.
        </p>
        <h2 className="text-xl font-bold mt-8 mb-3">رسالتنا</h2>
        <p className="mb-4">
          نسعى لإيصال الخبر إلى القارئ العربي بأسلوب صحفي مهني، يلتزم بمعايير الدقة والحياد والمسؤولية، بعيدًا عن الإثارة والمعلومات غير الموثقة.
        </p>
        <h2 className="text-xl font-bold mt-8 mb-3">ماذا نقدم؟</h2>
        <ul className="list-disc pr-6 space-y-2 mb-4">
          <li>أخبار عاجلة وتنبيهات لحظية.</li>
          <li>تقارير سياسية واقتصادية ورياضية وثقافية.</li>
          <li>تحليلات ومقالات رأي من كتّاب متخصصين.</li>
          <li>بث إذاعي مباشر لأكثر من 300 محطة عالمية.</li>
          <li>متابعة لأسعار العملات والذهب والنفط.</li>
        </ul>
        <h2 className="text-xl font-bold mt-8 mb-3">سياسة التحرير</h2>
        <p className="mb-4">
          نعتمد مصادر متعددة وموثوقة، ونلتزم بتحديث المحتوى بشكل دوري، مع ذكر المصدر الأصلي للخبر دائمًا. نرحب بالتصويبات والملاحظات عبر بيانات التواصل في تذييل الموقع.
        </p>
        <h2 className="text-xl font-bold mt-8 mb-3">رئيس التحرير</h2>
        <p>عبدالملك حميد الكوكباني — للتواصل: 777492635</p>
      </main>
      <SiteFooter />
    </div>
  );
}
