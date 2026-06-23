import { useEffect, useState } from 'react';
import { Save, BarChart3, Megaphone, Search, Settings as Cog, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteSettings, useUpdateSetting, type SiteSettings } from '@/hooks/useSiteSettings';

type Tab = 'general' | 'analytics' | 'ads' | 'seo';

export default function SettingsTab() {
  const { data, isLoading } = useSiteSettings();
  const update = useUpdateSetting();
  const [tab, setTab] = useState<Tab>('general');
  const [local, setLocal] = useState<SiteSettings | null>(null);

  useEffect(() => { if (data && !local) setLocal(data); }, [data]);

  if (isLoading || !local) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const save = async (key: keyof SiteSettings) => {
    try {
      await update.mutateAsync({ key, value: local[key] });
      toast.success('تم الحفظ');
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

  const input = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm font-english outline-none focus:ring-2 focus:ring-primary";
  const inputAr = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary";
  const label = "text-xs font-arabic text-muted-foreground block mb-1";

  return (
    <div className="max-w-3xl space-y-4">
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
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
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
            <textarea dir="ltr" rows={6} className={`${input} font-mono text-xs`} value={local.seo.robots_txt} onChange={e => setSeo({ robots_txt: e.target.value })} placeholder={"User-agent: *\nAllow: /\nSitemap: https://shibam7net.github.io/Shibam-24/sitemap.xml"} />
            <p className="text-[11px] text-muted-foreground font-arabic mt-1">يُحفظ في الإعدادات؛ يمكن استخدامه لاحقًا عبر edge function لخدمته ديناميكيًا.</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted rounded">
            <span className="text-xs font-arabic">Sitemap:</span>
            <a href="/sitemap.xml" target="_blank" className="text-xs font-english text-primary underline">/sitemap.xml</a>
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
