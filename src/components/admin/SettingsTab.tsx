import { useCallback, useEffect, useState } from 'react';
import {
  Save,
  BarChart3,
  Megaphone,
  Search,
  Settings as Cog,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Link2,
  Clock3,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSiteSettings, useUpdateSetting, type SiteSettings } from '@/hooks/useSiteSettings';

type Tab = 'general' | 'analytics' | 'ads' | 'seo';

interface SeoCheck {
  ok: boolean;
  status?: number;
  checked?: number;
  expected?: string | null;
}

interface SeoStatus {
  active: boolean;
  siteUrl: string;
  sitemapUrl: string;
  newsSitemapUrl: string;
  robotsUrl: string;
  articleCount: number;
  lastUpdated: string | null;
  checks: {
    sitemapReachable: SeoCheck;
    newsSitemapReachable: SeoCheck;
    robotsReachable: SeoCheck;
    validArticleUrls: SeoCheck;
    readableCanonicalUrls: SeoCheck;
    robotsIncludesSitemaps: SeoCheck;
    lastUpdatedTimestamp: SeoCheck;
  };
  error?: string;
}

function StatusRow({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-background px-3 py-2">
      {ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600" />}
      <div className="min-w-0">
        <div className="text-xs font-arabic font-bold text-foreground">{label}</div>
        {detail && <div className="text-[11px] text-muted-foreground font-arabic mt-0.5">{detail}</div>}
      </div>
    </div>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function SettingsTab() {
  const { data, isLoading } = useSiteSettings();
  const update = useUpdateSetting();
  const [tab, setTab] = useState<Tab>('general');
  const [local, setLocal] = useState<SiteSettings | null>(null);
  const [seoStatus, setSeoStatus] = useState<SeoStatus | null>(null);
  const [seoStatusLoading, setSeoStatusLoading] = useState(false);

  useEffect(() => { if (data && !local) setLocal(data); }, [data, local]);

  const loadSeoStatus = useCallback(async () => {
    setSeoStatusLoading(true);
    try {
      const response = await fetch('/api/seo-status', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'تعذر التحقق من حالة الـ Sitemap');
      setSeoStatus(payload);
    } catch (e: any) {
      toast.error(e.message || 'تعذر التحقق من حالة الـ Sitemap');
      setSeoStatus((current) => current ? { ...current, active: false, error: e.message || 'Verification failed' } : null);
    } finally {
      setSeoStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'seo' && !seoStatus && !seoStatusLoading) {
      loadSeoStatus();
    }
  }, [tab, seoStatus, seoStatusLoading, loadSeoStatus]);

  if (isLoading || !local) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const save = async (key: keyof SiteSettings) => {
    try {
      await update.mutateAsync({ key, value: local[key] });
      toast.success('تم الحفظ');
      if (key === 'seo') loadSeoStatus();
    } catch (e: any) {
      toast.error(e.message || 'خطأ في الحفظ');
    }
  };

  const setAnalytics = (patch: Partial<SiteSettings['analytics']>) =>
    setLocal({ ...local, analytics: { ...local.analytics, ...patch } });
  const setAds = (patch: Partial<SiteSettings['ads']>) =>
    setLocal({ ...local, ads: { ...local.ads, ...patch } });
  const setSeo = (patch: Partial<SiteSettings['seo']>) =>
    setLocal({ ...local, seo: { ...local.seo, ...patch } });

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'general', label: 'عام', icon: Cog },
    { id: 'analytics', label: 'التحليلات', icon: BarChart3 },
    { id: 'ads', label: 'الإعلانات', icon: Megaphone },
    { id: 'seo', label: 'SEO', icon: Search },
  ];

  const input = 'w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm font-english outline-none focus:ring-2 focus:ring-primary';
  const inputAr = 'w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary';
  const label = 'text-xs font-arabic text-muted-foreground block mb-1';

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-arabic ${tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <div className="p-3 bg-muted rounded text-xs font-arabic">✅ Lovable Cloud مفعّل · 🤖 الذكاء الاصطناعي مفعّل</div>
          <div className="p-3 bg-muted rounded text-xs font-arabic">📱 Telegram + X متصلان للنشر التلقائي</div>
          <div className="p-3 bg-muted rounded text-xs font-arabic">👤 مسجل كـ <strong className="font-english">shib</strong></div>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h3 className="font-bold font-arabic text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" /> إعدادات التحليلات</h3>
          <div>
            <label className={label}>Google Analytics ID (مثل G-XXXXXXX)</label>
            <input dir="ltr" className={input} value={local.analytics.ga_id} onChange={e => setAnalytics({ ga_id: e.target.value })} placeholder="G-XXXXXXXXXX" />
          </div>
          <div>
            <label className={label}>Google Tag Manager ID (مثل GTM-XXXXXX)</label>
            <input dir="ltr" className={input} value={local.analytics.gtm_id} onChange={e => setAnalytics({ gtm_id: e.target.value })} placeholder="GTM-XXXXXXX" />
          </div>
          <div>
            <label className={label}>سكربتات تتبع إضافية (تُحقن في &lt;head&gt;)</label>
            <textarea dir="ltr" rows={4} className={`${input} font-mono text-xs`} value={local.analytics.custom_head} onChange={e => setAnalytics({ custom_head: e.target.value })} placeholder="<!-- e.g. Hotjar, Plausible -->" />
          </div>
          <label className="flex items-center gap-2 text-xs font-arabic cursor-pointer">
            <input type="checkbox" checked={local.analytics.internal_tracking} onChange={e => setAnalytics({ internal_tracking: e.target.checked })} />
            تفعيل التتبع الداخلي (page views حسب الجلسات)
          </label>
          <button onClick={() => save('analytics')} disabled={update.isPending}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-xs font-arabic font-bold flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> حفظ
          </button>
        </div>
      )}

      {tab === 'ads' && (
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h3 className="font-bold font-arabic text-sm flex items-center gap-2"><Megaphone className="w-4 h-4" /> إعدادات الإعلانات</h3>
          <label className="flex items-center gap-2 text-xs font-arabic cursor-pointer">
            <input type="checkbox" checked={local.ads.enabled} onChange={e => setAds({ enabled: e.target.checked })} />
            تفعيل الإعلانات عالميًا
          </label>
          <div>
            <label className={label}>AdSense Publisher ID</label>
            <input dir="ltr" className={input} value={local.ads.publisher_id} onChange={e => setAds({ publisher_id: e.target.value })} placeholder="ca-pub-XXXXXXXXXXXXXXXX" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['header', 'sidebar', 'in_article'] as const).map(k => (
              <div key={k}>
                <label className={label}>Ad Slot · {k}</label>
                <input dir="ltr" className={input} value={local.ads.slots[k]}
                  onChange={e => setAds({ slots: { ...local.ads.slots, [k]: e.target.value } })} />
              </div>
            ))}
          </div>
          <div>
            <label className={label}>إيقاف الإعلانات في أقسام محددة (مفصولة بفاصلة)</label>
            <input className={inputAr} value={local.ads.disabled_categories.join('، ')}
              onChange={e => setAds({ disabled_categories: e.target.value.split(/[،,]/).map(s => s.trim()).filter(Boolean) })} />
          </div>
          <p className="text-[11px] text-muted-foreground font-arabic">ملاحظة: الإعلانات مُعدّة كبنية تحتية فقط — لن تظهر فعليًا حتى يتم ربط مكونات العرض.</p>
          <button onClick={() => save('ads')} disabled={update.isPending}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-xs font-arabic font-bold flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> حفظ
          </button>
        </div>
      )}

      {tab === 'seo' && (
        <div className="bg-card border border-border rounded-lg p-5 space-y-5">
          <h3 className="font-bold font-arabic text-sm flex items-center gap-2"><Search className="w-4 h-4" /> إعدادات SEO</h3>
          <div>
            <label className={label}>Meta Title عالمي</label>
            <input className={inputAr} value={local.seo.meta_title} onChange={e => setSeo({ meta_title: e.target.value })} />
          </div>
          <div>
            <label className={label}>Meta Description عالمي</label>
            <textarea rows={3} className={inputAr} value={local.seo.meta_description} onChange={e => setSeo({ meta_description: e.target.value })} />
          </div>
          <div>
            <label className={label}>توجيه الفهرسة (Robots)</label>
            <select dir="ltr" className={input} value={local.seo.robots} onChange={e => setSeo({ robots: e.target.value })}>
              <option value="index,follow">index, follow</option>
              <option value="noindex,follow">noindex, follow</option>
              <option value="index,nofollow">index, nofollow</option>
              <option value="noindex,nofollow">noindex, nofollow</option>
            </select>
          </div>
          <div>
            <label className={label}>robots.txt (محرر)</label>
            <textarea dir="ltr" rows={6} className={`${input} font-mono text-xs`} value={local.seo.robots_txt} onChange={e => setSeo({ robots_txt: e.target.value })} placeholder={'User-agent: *\nAllow: /\nDisallow: /admin'} />
            <p className="text-[11px] text-muted-foreground font-arabic mt-1">يتم حقن روابط Sitemap الحالية تلقائياً داخل robots.txt عند الطلب العام.</p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h4 className="font-bold font-arabic text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> إدارة Sitemap</h4>
                <p className="text-[11px] text-muted-foreground font-arabic mt-1">يتم توليد الـ Sitemap ديناميكياً من المقالات الحالية ويتحدث تلقائياً عند النشر.</p>
              </div>
              <button onClick={loadSeoStatus} disabled={seoStatusLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-arabic hover:bg-muted disabled:opacity-50">
                {seoStatusLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} تحقق الآن
              </button>
            </div>

            {seoStatusLoading && !seoStatus ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : seoStatus ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="text-[11px] text-muted-foreground font-arabic mb-1">الحالة الحالية</div>
                    <div className={`text-sm font-arabic font-bold ${seoStatus.active ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {seoStatus.active ? 'نشط ويعمل بشكل صحيح' : 'يحتاج مراجعة'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="text-[11px] text-muted-foreground font-arabic mb-1">آخر تحديث</div>
                    <div className="text-sm font-arabic font-bold flex items-center gap-1.5"><Clock3 className="w-4 h-4 text-primary" /> {formatDateTime(seoStatus.lastUpdated)}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="text-[11px] text-muted-foreground font-arabic mb-1">عدد المقالات المفحوصة</div>
                    <div className="text-sm font-english font-bold">{seoStatus.articleCount}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <a href={seoStatus.sitemapUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-border bg-background p-3 hover:border-primary transition-colors">
                    <div className="text-[11px] text-muted-foreground font-arabic mb-1 flex items-center gap-1"><Link2 className="w-3.5 h-3.5" /> Sitemap الرئيسي</div>
                    <div className="text-xs font-english text-primary break-all">{seoStatus.sitemapUrl}</div>
                  </a>
                  <a href={seoStatus.newsSitemapUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-border bg-background p-3 hover:border-primary transition-colors">
                    <div className="text-[11px] text-muted-foreground font-arabic mb-1 flex items-center gap-1"><Link2 className="w-3.5 h-3.5" /> News Sitemap</div>
                    <div className="text-xs font-english text-primary break-all">{seoStatus.newsSitemapUrl}</div>
                  </a>
                  <a href={seoStatus.robotsUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-border bg-background p-3 hover:border-primary transition-colors">
                    <div className="text-[11px] text-muted-foreground font-arabic mb-1 flex items-center gap-1"><Link2 className="w-3.5 h-3.5" /> robots.txt</div>
                    <div className="text-xs font-english text-primary break-all">{seoStatus.robotsUrl}</div>
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <StatusRow ok={seoStatus.checks.sitemapReachable.ok} label="الوصول إلى /sitemap.xml" detail={`HTTP ${seoStatus.checks.sitemapReachable.status || '—'}`} />
                  <StatusRow ok={seoStatus.checks.newsSitemapReachable.ok} label="الوصول إلى /news-sitemap.xml" detail={`HTTP ${seoStatus.checks.newsSitemapReachable.status || '—'}`} />
                  <StatusRow ok={seoStatus.checks.robotsReachable.ok} label="الوصول إلى robots.txt" detail={`HTTP ${seoStatus.checks.robotsReachable.status || '—'}`} />
                  <StatusRow ok={seoStatus.checks.validArticleUrls.ok} label="صلاحية روابط المقالات داخل الـ Sitemap" detail={`تم فحص ${seoStatus.checks.validArticleUrls.checked || 0} رابط`} />
                  <StatusRow ok={seoStatus.checks.readableCanonicalUrls.ok} label="Canonical URLs نظيفة وغير مشفرة" detail="بدون ‎%D8 أو ‎%C3 داخل روابط المقالات" />
                  <StatusRow ok={seoStatus.checks.robotsIncludesSitemaps.ok} label="ربط Sitemap داخل robots.txt" detail="متوافق مع نظام الفهرسة العام" />
                  <StatusRow ok={seoStatus.checks.lastUpdatedTimestamp.ok} label="تطابق آخر تحديث" detail={seoStatus.checks.lastUpdatedTimestamp.expected ? `المتوقع: ${formatDateTime(seoStatus.checks.lastUpdatedTimestamp.expected)}` : 'لا توجد بيانات'} />
                </div>

                {seoStatus.error && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2 text-xs font-arabic">
                    {seoStatus.error}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-border bg-background p-4 text-sm font-arabic text-muted-foreground">
                لم يتم جلب حالة الـ Sitemap بعد.
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted rounded flex-wrap">
            <span className="text-xs font-arabic">روابط SEO العامة:</span>
            <a href="/sitemap.xml" target="_blank" className="text-xs font-english text-primary underline">/sitemap.xml</a>
            <a href="/news-sitemap.xml" target="_blank" className="text-xs font-english text-primary underline">/news-sitemap.xml</a>
            <a href="/robots.txt" target="_blank" className="text-xs font-english text-primary underline">/robots.txt</a>
          </div>

          <button onClick={() => save('seo')} disabled={update.isPending}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-xs font-arabic font-bold flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> حفظ
          </button>
        </div>
      )}
    </div>
  );
}
