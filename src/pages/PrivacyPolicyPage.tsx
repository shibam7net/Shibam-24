import { Helmet } from 'react-helmet-async';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { absoluteSiteUrl } from '@/lib/site';
import { useResolvedSeo } from '@/hooks/useResolvedSeo';

export default function PrivacyPolicyPage() {
  const url = absoluteSiteUrl('/privacy-policy');
  const { metaTitle: siteMetaTitle, robots } = useResolvedSeo();
  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Helmet>
        <title>{`سياسة الخصوصية | ${siteMetaTitle}`}</title>
        <meta name="description" content="سياسة الخصوصية لموقع شبام24: كيف نجمع البيانات، كيف نستخدمها، ملفات تعريف الارتباط، حقوق المستخدمين، وحماية المعلومات." />
        <meta name="robots" content={robots} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content="سياسة الخصوصية — شبام24" />
        <meta property="og:url" content={url} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'سياسة الخصوصية',
          url,
        })}</script>
      </Helmet>
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl font-arabic leading-loose">
        <h1 className="text-3xl font-bold mb-6">سياسة الخصوصية</h1>
        <p className="mb-4 text-sm opacity-70">آخر تحديث: {new Date().toLocaleDateString('ar-EG')}</p>

        <p className="mb-4">
          نلتزم في <strong>شبام24</strong> بحماية خصوصية زوارنا. توضح هذه السياسة أنواع البيانات التي نجمعها، وكيفية استخدامها وحمايتها.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">1. البيانات التي نجمعها</h2>
        <ul className="list-disc pr-6 space-y-2 mb-4">
          <li>بيانات تحليلية مجهولة الهوية: عدد الزيارات، الصفحات المعروضة، نوع المتصفح والجهاز، مصدر الزيارة.</li>
          <li>ملفات تعريف الارتباط (Cookies) لتذكر تفضيلاتك (الوضع الليلي، وضع توفير البيانات، آخر تبويب).</li>
          <li>لا نطلب تسجيل حسابات للزوار العاديين ولا نجمع بيانات شخصية حساسة.</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-3">2. كيف نستخدم البيانات</h2>
        <ul className="list-disc pr-6 space-y-2 mb-4">
          <li>تحسين تجربة المستخدم وأداء الموقع.</li>
          <li>قياس مدى انتشار المحتوى وأبرز الأقسام المقروءة.</li>
          <li>اكتشاف الأخطاء التقنية وإصلاحها.</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-3">3. خدمات الطرف الثالث</h2>
        <p className="mb-4">
          قد نستخدم خدمات تحليل وإحصاء (مثل Google Analytics) وشبكات توزيع المحتوى (CDN) لتسريع تحميل الموقع. كما نعتمد على مصادر إخبارية خارجية لجلب الأخبار، ولكل مصدر سياسة خصوصية مستقلة.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">4. حماية البيانات</h2>
        <p className="mb-4">
          لا نبيع بيانات المستخدمين ولا نشاركها مع أطراف خارجية لأغراض تسويقية. نعتمد بروتوكول HTTPS لتأمين الاتصال.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">5. حقوق المستخدم</h2>
        <ul className="list-disc pr-6 space-y-2 mb-4">
          <li>إمكانية تعطيل ملفات تعريف الارتباط من إعدادات المتصفح.</li>
          <li>طلب حذف أي بيانات شخصية قد تكون أُرسلت طوعًا عبر التواصل معنا.</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-3">6. التواصل معنا</h2>
        <p>لأي استفسار حول الخصوصية، يمكنك التواصل عبر واتساب: 967777492635+</p>
      </main>
      <SiteFooter />
    </div>
  );
}
