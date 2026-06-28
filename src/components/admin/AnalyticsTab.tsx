import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { radioStations } from '@/data/radioStations';
import {
  BarChart3, Eye, TrendingUp, Radio, Calendar, Loader2,
  Users, Globe, Headphones, Activity, Newspaper, FileText,
} from 'lucide-react';
import { getArticlePath } from '@/hooks/useArticles';

interface Overview {
  live_visitors: number;
  live_radio_listeners: number;
  today_visits: number;
  today_pageviews: number;
  today_radio_visits: number;
  week_visits: number;
  total_visits: number;
  total_pageviews: number;
  total_articles: number;
  today_articles: number;
  week_articles: number;
}

interface CountryRow { country: string; visits: number }
interface TopArticleRow { article_id: string; title: string; slug: string | null; views: number }
interface TopRadioRow { station_id: number; listeners: number }

// ISO-2 → Arabic country name + flag emoji
const COUNTRY_AR: Record<string, string> = {
  YE: 'اليمن', SA: 'السعودية', AE: 'الإمارات', EG: 'مصر', JO: 'الأردن', SY: 'سوريا',
  IQ: 'العراق', LB: 'لبنان', PS: 'فلسطين', KW: 'الكويت', QA: 'قطر', BH: 'البحرين',
  OM: 'عُمان', MA: 'المغرب', DZ: 'الجزائر', TN: 'تونس', LY: 'ليبيا', SD: 'السودان',
  SO: 'الصومال', DJ: 'جيبوتي', MR: 'موريتانيا', TR: 'تركيا', IR: 'إيران', US: 'أمريكا',
  GB: 'بريطانيا', DE: 'ألمانيا', FR: 'فرنسا', CA: 'كندا', AU: 'أستراليا', IN: 'الهند',
  PK: 'باكستان', ID: 'إندونيسيا', MY: 'ماليزيا', CN: 'الصين', RU: 'روسيا',
};
function flagEmoji(iso2?: string) {
  if (!iso2 || iso2.length !== 2) return '🌐';
  const A = 0x1f1e6;
  return String.fromCodePoint(A + iso2.charCodeAt(0) - 65, A + iso2.charCodeAt(1) - 65);
}
function countryLabel(c: string) {
  if (!c || c === 'غير معروف') return { name: 'غير معروف', flag: '🌐' };
  return { name: COUNTRY_AR[c] || c, flag: flagEmoji(c) };
}

export default function AnalyticsTab() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [topArticles, setTopArticles] = useState<TopArticleRow[]>([]);
  const [topRadio, setTopRadio] = useState<TopRadioRow[]>([]);
  const [topAllTime, setTopAllTime] = useState<{ title: string; views: number }[]>([]);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const load = async () => {
    try {
      const [ovRes, ctRes, taRes, trRes, allArtRes, allCatRes] = await Promise.all([
        supabase.rpc('analytics_overview'),
        supabase.rpc('analytics_countries', { p_hours: 24, p_limit: 15 }),
        supabase.rpc('analytics_top_articles', { p_hours: 24, p_limit: 10 }),
        supabase.rpc('analytics_top_radio', { p_limit: 8 }),
        supabase.from('articles').select('title, views').order('views', { ascending: false }).limit(10),
        supabase.from('articles').select('category'),
      ]);
      if (ovRes.data) setOverview(ovRes.data as unknown as Overview);
      if (ctRes.data) setCountries(ctRes.data as CountryRow[]);
      if (taRes.data) setTopArticles(taRes.data as TopArticleRow[]);
      if (trRes.data) setTopRadio(trRes.data as TopRadioRow[]);
      if (allArtRes.data) setTopAllTime(allArtRes.data as { title: string; views: number }[]);
      if (allCatRes.data) {
        const map: Record<string, number> = {};
        (allCatRes.data as { category: string }[]).forEach(r => {
          const k = r.category || 'بدون';
          map[k] = (map[k] || 0) + 1;
        });
        setCategories(
          Object.entries(map).map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count).slice(0, 10),
        );
      }
      setLastUpdate(new Date());
    } catch (e) {
      console.error('analytics load failed', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = window.setInterval(load, 15_000); // refresh live numbers every 15s
    return () => window.clearInterval(t);
  }, []);

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const liveCards = [
    { label: 'زوار الآن', value: overview?.live_visitors ?? 0, icon: Users, color: 'text-emerald-600', live: true },
    { label: 'مستمعو الراديو الآن', value: overview?.live_radio_listeners ?? 0, icon: Headphones, color: 'text-rose-600', live: true },
    { label: 'زيارات اليوم', value: overview?.today_visits ?? 0, icon: Calendar, color: 'text-blue-600' },
    { label: 'مشاهدات اليوم', value: overview?.today_pageviews ?? 0, icon: Eye, color: 'text-purple-600' },
    { label: 'أخبار اليوم', value: overview?.today_articles ?? 0, icon: Newspaper, color: 'text-amber-600' },
    { label: 'إجمالي الأخبار', value: overview?.total_articles ?? 0, icon: FileText, color: 'text-indigo-600' },
    { label: 'مستمعو الراديو اليوم', value: overview?.today_radio_visits ?? 0, icon: Radio, color: 'text-rose-500' },
    { label: 'زيارات الأسبوع', value: overview?.week_visits ?? 0, icon: TrendingUp, color: 'text-amber-600' },
    { label: 'إجمالي الزوار', value: overview?.total_visits ?? 0, icon: BarChart3, color: 'text-primary' },
    { label: 'إجمالي المشاهدات', value: overview?.total_pageviews ?? 0, icon: Activity, color: 'text-cyan-600' },
  ];

  const maxCountry = countries[0]?.visits || 1;
  const maxCat = categories[0]?.count || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold font-arabic flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
          الإحصائيات الحية
        </h2>
        <span className="text-[11px] font-english text-muted-foreground">
          آخر تحديث: {lastUpdate.toLocaleTimeString('ar-EG')}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {liveCards.map((c, i) => (
          <div key={i} className="relative bg-card border border-border rounded-lg p-4 text-center overflow-hidden">
            {c.live && (
              <span className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-english text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
              </span>
            )}
            <c.icon className={`w-5 h-5 mx-auto mb-2 ${c.color}`} />
            <p className="text-xl font-bold font-english">{(c.value || 0).toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground font-arabic mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Countries */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-bold font-arabic text-sm mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" /> الزوار حسب الدولة (24 ساعة)
          </h3>
          {countries.length === 0 ? (
            <p className="text-xs text-muted-foreground font-arabic text-center py-6">
              لا توجد بيانات بعد — ابدأ تجميع الزيارات.
            </p>
          ) : (
            <div className="space-y-2">
              {countries.map((c, i) => {
                const { name, flag } = countryLabel(c.country);
                const pct = Math.round((c.visits / maxCountry) * 100);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-lg w-6 text-center">{flag}</span>
                    <span className="text-xs font-arabic w-20 truncate">{name}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-english text-muted-foreground w-10 text-left">{c.visits}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top articles today */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-bold font-arabic text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rose-600" /> الأكثر زيارة (24 ساعة)
          </h3>
          {topArticles.length === 0 ? (
            <p className="text-xs text-muted-foreground font-arabic text-center py-6">
              لا توجد قراءات بعد اليوم.
            </p>
          ) : (
            <div className="space-y-2">
              {topArticles.map((a, i) => (
                <a key={i} href={getArticlePath({ id: a.article_id, slug: a.slug, title: a.title })}
                   className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors">
                  <span className="text-xs font-english text-muted-foreground w-5">{i + 1}.</span>
                  <span className="flex-1 text-xs font-arabic line-clamp-1">{a.title}</span>
                  <span className="text-[10px] font-english text-muted-foreground flex items-center gap-0.5">
                    <Eye className="w-3 h-3" /> {a.views}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Live radio listeners by station */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-bold font-arabic text-sm mb-3 flex items-center gap-2">
            <Headphones className="w-4 h-4 text-rose-600" /> المحطات الأكثر استماعًا الآن
          </h3>
          {topRadio.length === 0 ? (
            <p className="text-xs text-muted-foreground font-arabic text-center py-6">
              لا يوجد مستمعون نشطون حاليًا.
            </p>
          ) : (
            <div className="space-y-2">
              {topRadio.map((r, i) => {
                const st = radioStations.find(s => s.id === r.station_id);
                return (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors">
                    <span className="text-xs font-english text-muted-foreground w-5">{i + 1}.</span>
                    <span className="flex-1 text-xs font-arabic line-clamp-1">
                      {st ? `${st.name} • ${st.country}` : `محطة #${r.station_id}`}
                    </span>
                    <span className="text-[10px] font-english text-rose-600 flex items-center gap-0.5">
                      <Headphones className="w-3 h-3" /> {r.listeners}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* All-time top */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-bold font-arabic text-sm mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> الأكثر مشاهدة (إجمالي)
          </h3>
          <div className="space-y-2">
            {topAllTime.map((a, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors">
                <span className="text-xs font-english text-muted-foreground w-5">{i + 1}.</span>
                <span className="flex-1 text-xs font-arabic line-clamp-1">{a.title}</span>
                <span className="text-[10px] font-english text-muted-foreground flex items-center gap-0.5">
                  <Eye className="w-3 h-3" /> {a.views || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category distribution */}
        <div className="bg-card border border-border rounded-lg p-4 lg:col-span-2">
          <h3 className="font-bold font-arabic text-sm mb-3">📊 توزيع الأقسام</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categories.map((c, i) => {
              const pct = Math.round((c.count / maxCat) * 100);
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-arabic w-24 truncate">{c.category || 'بدون'}</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-english text-muted-foreground w-10 text-left">{c.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
