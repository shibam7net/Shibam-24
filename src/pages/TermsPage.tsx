import { Helmet } from 'react-helmet-async';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { absoluteSiteUrl } from '@/lib/site';

export default function TermsPage() {
  const url = absoluteSiteUrl('/terms');
  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Helmet>
        <title>شروط الاستخدام | شبام24</title>
        <meta name="description" content="شروط استخدام موقع شبام24 الإخباري: حقوق النشر، مسؤولية المحتوى، الاستخدام المقبول، وقواعد إعادة النشر." />
        <link rel="canonical" href={url} />
        <meta property="og:title" content="شروط الاستخدام — شبام24" />
        <meta property="og:url" content={url} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'شروط الاستخدام',
          url,
        })}</script>
      </Helmet>
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl font-arabic leading-loose">
        <h1 className="text-3xl font-bold mb-6">شروط الاستخدام</h1>
        <p className="mb-4 text-sm opacity-70">آخر تحديث: {new Date().toLocaleDateString('ar-EG')}</p>

        <p className="mb-4">
          باستخدامك موقع <strong>شبام24</strong> فإنك توافق على الشروط التالية. يرجى قراءتها بعناية.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">1. قبول الشروط</h2>
        <p className="mb-4">
          الدخول إلى الموقع أو تصفح أي صفحة منه يُعدّ موافقة ضمنية على هذه الشروط. إذا كنت لا توافق فيرجى عدم استخدام الموقع.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">2. حقوق النشر والملكية الفكرية</h2>
        <ul className="list-disc pr-6 space-y-2 mb-4">
          <li>جميع المحتويات الأصلية المنشورة على شبام24 (تصميم، شعارات، تقارير حصرية) محفوظة لصالح الموقع.</li>
          <li>الأخبار المنقولة من مصادر خارجية تبقى ملكية أصحابها، ونذكر المصدر دائمًا.</li>
          <li>يُسمح بإعادة نشر العناوين مع رابط للمقال الأصلي. إعادة نشر المقالات كاملة يتطلب إذنًا كتابيًا.</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-3">3. مسؤولية المحتوى</h2>
        <p className="mb-4">
          يسعى الموقع لنقل المعلومات بدقة من مصادر موثوقة، لكنه لا يتحمل المسؤولية القانونية عن المحتوى المنقول من مصادر طرف ثالث، والآراء الواردة في المقالات تعبّر عن أصحابها فقط.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">4. الاستخدام المقبول</h2>
        <ul className="list-disc pr-6 space-y-2 mb-4">
          <li>يُمنع استخدام الموقع لأي غرض غير قانوني أو ضار.</li>
          <li>يُمنع محاولة اختراق الموقع أو إساءة استخدام واجهات البرمجة.</li>
          <li>يُمنع تجريف (Scraping) المحتوى آليًا دون إذن.</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-3">5. الروابط الخارجية</h2>
        <p className="mb-4">
          يحتوي الموقع على روابط لمواقع خارجية، ولا نتحمل مسؤولية محتواها أو سياسات الخصوصية الخاصة بها.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">6. تعديل الشروط</h2>
        <p className="mb-4">
          يحق لشبام24 تعديل هذه الشروط في أي وقت، وتسري التعديلات فور نشرها على هذه الصفحة.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">7. القانون المعمول به</h2>
        <p>تخضع هذه الشروط للقوانين المعمول بها في الجمهورية اليمنية.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
