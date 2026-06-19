import { useState, useRef } from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { useAuth } from '@/hooks/useAuth';
import { useSources, useAddSource, useUpdateSource, useDeleteSource, type Source } from '@/hooks/useSources';
import { useArticles, useUpsertArticle, useDeleteArticle, type Article } from '@/hooks/useArticles';
import { supabase } from '@/integrations/supabase/client';
import { uploadNewsImage } from '@/lib/uploadImage';
import { arabicCategories, globalCategories } from '@/data/mockNews';
import { Plus, Trash2, Edit, Search, Globe, Newspaper, Settings, ExternalLink, Power, PowerOff, Save, X, RefreshCw, Upload, LogOut, Clock, Sparkles, Wand2, Send, Loader2, CheckCircle, AlertTriangle, Radio, EyeOff, Eye, Video, Link2, BarChart3, FolderOpen, Handshake } from 'lucide-react';
import RadioAdminTab from '@/components/admin/RadioAdminTab';
import NewsManagerTab from '@/components/admin/NewsManagerTab';
import AnalyticsTab from '@/components/admin/AnalyticsTab';
import ArticleEditorAI from '@/components/admin/ArticleEditorAI';
import SponsorsAdminTab from '@/components/admin/SponsorsAdminTab';
import SettingsTab from '@/components/admin/SettingsTab';
import { toast } from 'sonner';
import { absoluteSiteUrl, publicAssetUrl } from '@/lib/site';

type AdminTab = 'sources' | 'add-news' | 'news-manager' | 'ai-writer' | 'analytics' | 'radio' | 'sponsors' | 'settings';
type SourceTab = 'arabic' | 'foreign';

export default function AdminPage() {
  const { user, loading: authLoading, login, logout } = useAuth();
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    const { error } = await login(loginUsername, loginPassword);
    if (error) setLoginError(error);
    setLoggingIn(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const logoUrl = publicAssetUrl("logo.png");

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <form onSubmit={handleLogin} className="bg-card border border-border rounded-xl p-8 w-full max-w-sm shadow-lg">
            <div className="flex justify-center mb-4">
              <img src={logoUrl} alt="شبام24" className="h-16 w-auto" />
            </div>
            <h1 className="text-2xl font-bold font-arabic text-center mb-6">تسجيل الدخول</h1>
            {loginError && <p className="text-destructive text-sm font-arabic mb-4 text-center">{loginError}</p>}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-arabic text-muted-foreground block mb-1">اسم المستخدم</label>
                <input value={loginUsername} onChange={e => setLoginUsername(e.target.value)} className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm font-english outline-none focus:ring-2 focus:ring-primary" dir="ltr" autoFocus />
              </div>
              <div>
                <label className="text-sm font-arabic text-muted-foreground block mb-1">كلمة المرور</label>
                <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm font-english outline-none focus:ring-2 focus:ring-primary" dir="ltr" />
              </div>
              <button type="submit" disabled={loggingIn} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-arabic font-bold hover:opacity-90 disabled:opacity-50">
                {loggingIn ? 'جاري الدخول...' : 'دخول'}
              </button>
            </div>
          </form>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return <AdminDashboard onLogout={logout} />;
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<AdminTab>('sources');
  const [sourceTab, setSourceTab] = useState<SourceTab>('arabic');

  const { data: allSources = [], isLoading: sourcesLoading } = useSources();
  const addSource = useAddSource();
  const updateSource = useUpdateSource();
  const deleteSource = useDeleteSource();

  const [editingSource, setEditingSource] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editInterval, setEditInterval] = useState(5);
  const [editHideSource, setEditHideSource] = useState(false);
  const [editAltName, setEditAltName] = useState('');
  const [editAltUrl, setEditAltUrl] = useState('');
  const [editAssignedCategory, setEditAssignedCategory] = useState('');
  const [showAltSource, setShowAltSource] = useState(false);

  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceSection, setNewSourceSection] = useState<'arabic' | 'global'>('arabic');
  const [detectedMethod, setDetectedMethod] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // New source fields
  const [newHideSource, setNewHideSource] = useState(false);
  const [newAltName, setNewAltName] = useState('');
  const [newAltUrl, setNewAltUrl] = useState('');
  const [newAssignedCategory, setNewAssignedCategory] = useState('');
  const [newShowAlt, setNewShowAlt] = useState(false);

  const [fetchResults, setFetchResults] = useState<Record<string, { count: number; success: boolean; time: string }>>({});

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: allArticles = [] } = useArticles();
  const upsertArticle = useUpsertArticle();
  const deleteArticle = useDeleteArticle();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [newsTitle, setNewsTitle] = useState('');
  const [newsSummary, setNewsSummary] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsCategory, setNewsCategory] = useState('');
  const [newsSection, setNewsSection] = useState<'arabic' | 'global'>('arabic');
  const [newsAuthor, setNewsAuthor] = useState('');
  const [newsSourceName, setNewsSourceName] = useState('شبام24');
  const [newsSourceUrl, setNewsSourceUrl] = useState('');
  const [newsImage, setNewsImage] = useState('');
  const [newsVideo, setNewsVideo] = useState('');
  const [editingArticle, setEditingArticle] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const [aiProcessing, setAiProcessing] = useState<Record<string, string>>({});

  const filteredSources = allSources.filter(s => sourceTab === 'arabic' ? s.section === 'arabic' : s.section === 'global');
  const displayedArticles = allArticles.filter(a => a.section === newsSection).slice(0, 20);
  const categories = newsSection === 'arabic' ? arabicCategories : globalCategories;
  const newSourceCategories = newSourceSection === 'arabic' ? arabicCategories : globalCategories;
  const editSourceCategories = (editingSource && allSources.find(s => s.id === editingSource)?.section === 'arabic') ? arabicCategories : globalCategories;

  const handleDetectMethod = () => {
    if (!newSourceUrl) return;
    setIsDetecting(true);
    setTimeout(() => {
      setDetectedMethod('rss');
      setIsDetecting(false);
      toast.success('تم اكتشاف الطريقة');
    }, 1000);
  };

  const handleAddSource = async () => {
    if (!newSourceUrl || !detectedMethod) return;
    try {
      let name = newSourceUrl;
      try { name = new URL(newSourceUrl).hostname; } catch {}
      await addSource.mutateAsync({
        name, url: newSourceUrl, fetch_method: detectedMethod, section: newSourceSection,
        is_active: true, fetch_interval: 5,
        hide_source: newHideSource,
        alt_source_name: newAltName || null,
        alt_source_url: newAltUrl || null,
        assigned_category: newAssignedCategory || null,
      });
      setNewSourceUrl(''); setDetectedMethod(null);
      setNewHideSource(false); setNewAltName(''); setNewAltUrl(''); setNewAssignedCategory(''); setNewShowAlt(false);
      toast.success('تمت إضافة المصدر بنجاح');
    } catch { toast.error('خطأ في إضافة المصدر'); }
  };

  const handleDeleteSource = async (id: string, deleteArticles: boolean) => {
    try {
      await deleteSource.mutateAsync({ id, deleteArticles });
      toast.success(deleteArticles ? 'تم حذف المصدر وجميع أخباره' : 'تم حذف المصدر فقط');
      setDeleteConfirm(null);
    } catch { toast.error('خطأ في حذف المصدر'); }
  };

  const handleToggleSource = async (source: Source) => {
    await updateSource.mutateAsync({ id: source.id, is_active: !source.is_active });
    toast.success('تم تحديث حالة المصدر');
  };

  const startEditSource = (source: Source) => {
    setEditingSource(source.id);
    setEditName(source.name);
    setEditUrl(source.url);
    setEditInterval(source.fetch_interval);
    setEditHideSource(source.hide_source);
    setEditAltName(source.alt_source_name || '');
    setEditAltUrl(source.alt_source_url || '');
    setEditAssignedCategory(source.assigned_category || '');
    setShowAltSource(!!(source.alt_source_name || source.alt_source_url));
  };

  const saveEditSource = async (id: string) => {
    await updateSource.mutateAsync({
      id, name: editName, url: editUrl, fetch_interval: editInterval,
      hide_source: editHideSource,
      alt_source_name: editAltName || null,
      alt_source_url: editAltUrl || null,
      assigned_category: editAssignedCategory || null,
    });
    setEditingSource(null);
    toast.success('تم تحديث المصدر');
  };

  const handleManualFetch = async (source: Source) => {
    toast.info(`جاري جلب الأخبار من ${source.name}...`);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-news');
      if (error) throw error;
      const fetched = data?.fetched || 0;
      const now = new Date().toLocaleTimeString('ar-EG');
      setFetchResults(prev => ({ ...prev, [source.id]: { count: fetched, success: true, time: now } }));
      toast.success(`تم جلب ${fetched} خبر جديد`);
    } catch {
      const now = new Date().toLocaleTimeString('ar-EG');
      setFetchResults(prev => ({ ...prev, [source.id]: { count: 0, success: false, time: now } }));
      toast.error('خطأ في جلب الأخبار');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadNewsImage(file);
      setNewsImage(url);
      toast.success('تم رفع الصورة');
    } catch {
      toast.error('خطأ في رفع الصورة');
      const reader = new FileReader();
      reader.onload = (ev) => setNewsImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
    setIsUploading(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingVideo(true);
    try {
      const ext = file.name.split('.').pop() || 'mp4';
      const path = `videos/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('news-images').upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('news-images').getPublicUrl(path);
      setNewsVideo(publicUrl);
      toast.success('تم رفع الفيديو');
    } catch {
      toast.error('خطأ في رفع الفيديو');
    }
    setIsUploadingVideo(false);
  };

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article.id);
    setNewsTitle(article.title);
    setNewsSummary(article.summary);
    setNewsContent(article.content);
    setNewsCategory(article.category);
    setNewsSection(article.section as 'arabic' | 'global');
    setNewsAuthor(article.author);
    setNewsSourceName(article.source_name);
    setNewsSourceUrl(article.source_url || '');
    setNewsImage(article.image_url || '');
    setNewsVideo((article as any).video_url || '');
    setActiveTab('add-news');
  };

  const handleAddNews = async () => {
    if (!newsTitle || !newsContent) { toast.error('يرجى ملء العنوان والمحتوى'); return; }
    try {
      const payload: any = {
        title: newsTitle, summary: newsSummary, content: newsContent,
        category: newsCategory, section: newsSection, author: newsAuthor,
        source_name: newsSourceName, source_url: newsSourceUrl || null, image_url: newsImage || null,
        video_url: newsVideo || null,
      };
      if (editingArticle) payload.id = editingArticle;
      await upsertArticle.mutateAsync(payload);
      toast.success(editingArticle ? 'تم تحديث الخبر' : 'تم نشر الخبر');
      clearNewsForm();
    } catch { toast.error('خطأ في حفظ الخبر'); }
  };

  const clearNewsForm = () => {
    setNewsTitle(''); setNewsSummary(''); setNewsContent(''); setNewsCategory('');
    setNewsAuthor(''); setNewsImage(''); setNewsVideo(''); setNewsSourceName('شبام24'); setNewsSourceUrl('');
    setEditingArticle(null);
  };

  const handleAiOptimize = async (articleId: string, action: string = 'optimize') => {
    setAiProcessing(prev => ({ ...prev, [articleId]: action }));
    try {
      const { data, error } = await supabase.functions.invoke('ai-optimize', { body: { articleId, action } });
      if (error) throw error;
      if (data?.error === 'duplicate') {
        toast.warning(data.message || 'مقال مشابه موجود بالفعل');
        setAiProcessing(prev => { const n = { ...prev }; delete n[articleId]; return n; });
        return;
      }
      if (data?.error) throw new Error(data.error);
      toast.success(action === 'optimize' ? '✅ تم تحسين المقال بالكامل' : `✅ تم ${action === 'rewrite' ? 'إعادة الكتابة' : action === 'summarize' ? 'إنشاء الملخص' : 'التصنيف'}`);
    } catch (e: any) {
      toast.error(e.message || 'خطأ في المعالجة بالذكاء الاصطناعي');
    }
    setAiProcessing(prev => { const n = { ...prev }; delete n[articleId]; return n; });
  };

  const handlePublishDistribute = async (article: Article) => {
    setAiProcessing(prev => ({ ...prev, [article.id]: 'distribute' }));
    try { await supabase.functions.invoke('ai-optimize', { body: { articleId: article.id, action: 'optimize' } }); } catch {}

    const slug = (article as any).slug || article.id;
    const url = absoluteSiteUrl(`/article/${slug}`);
    const results: string[] = [];

    try {
      const { data, error } = await supabase.functions.invoke('post-telegram', {
        body: { title: article.title, summary: article.summary, url, image_url: article.image_url || '' },
      });
      if (error) throw error;
      if (data?.success) results.push('✅ Telegram');
      else results.push('❌ Telegram: ' + (data?.error || 'فشل'));
    } catch (e: any) { results.push('❌ Telegram: ' + (e.message || 'فشل')); }

    try {
      const { data, error } = await supabase.functions.invoke('post-twitter', { body: { title: article.title, url } });
      if (error) throw error;
      if (data?.success) results.push('✅ X (Twitter)');
      else results.push('❌ X: ' + (data?.error || 'فشل'));
    } catch (e: any) { results.push('❌ X: ' + (e.message || 'فشل')); }

    const shareText = `${article.title} - Shibam24\n\n${article.summary}\n\n${url}`;
    try { await navigator.clipboard.writeText(shareText); } catch {}
    toast.success(`نتائج النشر:\n${results.join('\n')}`, { duration: 6000 });
    setAiProcessing(prev => { const n = { ...prev }; delete n[article.id]; return n; });
  };

  const methodNames: Record<string, string> = { rss: 'RSS', scraping: 'Web Scraping', headless: 'Headless Browser', 'ai-analysis': 'AI Analysis', firecrawl: 'Firecrawl' };
  const getSourceArticleCount = (sourceId: string) => allArticles.filter(a => a.source_id === sourceId).length;

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-arabic">لوحة التحكم</h1>
          <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-arabic bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
            <LogOut className="w-4 h-4" /> خروج
          </button>
        </div>

        <div className="flex gap-2 mb-6 border-b border-border pb-3 flex-wrap">
          {([
            { key: 'sources' as const, label: 'إدارة المصادر', icon: Globe },
            { key: 'add-news' as const, label: 'إضافة خبر', icon: Newspaper },
            { key: 'news-manager' as const, label: 'إدارة الأخبار', icon: FolderOpen },
            { key: 'ai-writer' as const, label: 'كاتب ذكي', icon: Sparkles },
            { key: 'analytics' as const, label: 'الإحصائيات', icon: BarChart3 },
            { key: 'radio' as const, label: 'إدارة الراديو', icon: Radio },
            { key: 'sponsors' as const, label: 'الرعاة', icon: Handshake },
            { key: 'settings' as const, label: 'الإعدادات', icon: Settings },
          ]).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-arabic transition-colors ${activeTab === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteConfirm(null)}>
            <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold font-arabic mb-3 text-center">⚠️ تأكيد الحذف</h3>
              <p className="text-sm font-arabic text-muted-foreground mb-4 text-center">هل تريد حذف الأخبار الخاصة بهذا المصدر أيضاً؟</p>
              <div className="flex flex-col gap-2">
                <button onClick={() => handleDeleteSource(deleteConfirm, true)} className="w-full bg-destructive text-destructive-foreground py-2.5 rounded-lg text-sm font-arabic font-bold hover:opacity-90">
                  نعم — حذف المصدر مع كل أخباره
                </button>
                <button onClick={() => handleDeleteSource(deleteConfirm, false)} className="w-full bg-muted text-foreground py-2.5 rounded-lg text-sm font-arabic font-bold hover:bg-muted/80">
                  لا — حذف المصدر فقط
                </button>
                <button onClick={() => setDeleteConfirm(null)} className="w-full text-muted-foreground py-2 text-sm font-arabic hover:text-foreground">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-bold font-arabic mb-4">إضافة مصدر جديد</h2>
              <div className="flex gap-2 mb-4">
                <button onClick={() => setNewSourceSection('arabic')} className={`px-4 py-1.5 rounded-lg text-sm font-arabic ${newSourceSection === 'arabic' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>مصدر عربي</button>
                <button onClick={() => setNewSourceSection('global')} className={`px-4 py-1.5 rounded-lg text-sm font-english ${newSourceSection === 'global' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>English Source</button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="url" value={newSourceUrl} onChange={e => setNewSourceUrl(e.target.value)} placeholder="الصق رابط المصدر هنا..." className="flex-1 bg-muted border border-border rounded-lg px-4 py-2 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary" dir="ltr" />
                <button onClick={handleDetectMethod} disabled={isDetecting || !newSourceUrl} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-arabic font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                  <Search className="w-4 h-4" />{isDetecting ? 'جاري...' : 'بحث'}
                </button>
              </div>
              {detectedMethod && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
                  <p className="text-sm font-arabic mb-2">الطريقة: <strong className="text-primary font-english">{methodNames[detectedMethod]}</strong></p>

                  {/* Hide source toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-arabic">إخفاء المصدر الأصلي</span>
                    <button onClick={() => setNewHideSource(!newHideSource)} className={`w-10 h-5 rounded-full transition-colors relative ${newHideSource ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${newHideSource ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>

                  {/* Alt source */}
                  {!newShowAlt ? (
                    <button onClick={() => setNewShowAlt(true)} className="text-xs text-primary hover:underline font-arabic flex items-center gap-1">
                      <Link2 className="w-3 h-3" /> إضافة مصدر بديل (اختياري)
                    </button>
                  ) : (
                    <div className="space-y-2 p-3 bg-background rounded-lg border border-border">
                      <p className="text-xs font-arabic font-bold">مصدر بديل</p>
                      <input value={newAltName} onChange={e => setNewAltName(e.target.value)} placeholder="اسم المصدر البديل" className="w-full bg-muted border border-border rounded-lg px-3 py-1.5 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary" />
                      <input value={newAltUrl} onChange={e => setNewAltUrl(e.target.value)} placeholder="رابط المصدر البديل" className="w-full bg-muted border border-border rounded-lg px-3 py-1.5 text-sm font-english outline-none focus:ring-2 focus:ring-primary" dir="ltr" />
                    </div>
                  )}

                  {/* Assigned category */}
                  <div>
                    <label className="text-xs font-arabic text-muted-foreground block mb-1">تخصيص المصدر لقسم معين (اختياري)</label>
                    <select value={newAssignedCategory} onChange={e => setNewAssignedCategory(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-arabic outline-none">
                      <option value="">بدون تخصيص</option>
                      {newSourceCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <button onClick={handleAddSource} className="mt-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-arabic font-bold flex items-center gap-2">
                    <Plus className="w-4 h-4" /> حفظ المصدر
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-2 mb-4">
              <button onClick={() => setSourceTab('arabic')} className={`px-5 py-2.5 rounded-lg text-sm font-arabic font-bold transition-colors ${sourceTab === 'arabic' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>مصادر عربية</button>
              <button onClick={() => setSourceTab('foreign')} className={`px-5 py-2.5 rounded-lg text-sm font-english font-bold transition-colors ${sourceTab === 'foreign' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>English Sources</button>
            </div>

            {sourcesLoading ? (
              <div className="text-center py-12 text-muted-foreground font-arabic">جاري التحميل...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSources.map(source => (
                  <div key={source.id} className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
                    {editingSource === source.id ? (
                      <>
                        <input value={editName} onChange={e => setEditName(e.target.value)} className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary" placeholder="اسم المصدر" />
                        <input value={editUrl} onChange={e => setEditUrl(e.target.value)} className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm font-english outline-none focus:ring-2 focus:ring-primary" dir="ltr" placeholder="URL" />
                        <div>
                          <label className="text-xs font-arabic text-muted-foreground block mb-1">فترة الجلب (1-10 دقائق)</label>
                          <input type="number" min={1} max={10} value={editInterval} onChange={e => setEditInterval(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))} className="w-full bg-muted border border-border rounded-lg px-3 py-1.5 text-sm font-english outline-none focus:ring-2 focus:ring-primary" />
                        </div>

                        {/* Hide source toggle */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-arabic">إخفاء المصدر الأصلي</span>
                          <button onClick={() => setEditHideSource(!editHideSource)} className={`w-10 h-5 rounded-full transition-colors relative ${editHideSource ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${editHideSource ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>

                        {/* Alt source */}
                        {!showAltSource ? (
                          <button onClick={() => setShowAltSource(true)} className="text-xs text-primary hover:underline font-arabic flex items-center gap-1">
                            <Link2 className="w-3 h-3" /> إضافة مصدر بديل
                          </button>
                        ) : (
                          <div className="space-y-2 p-2 bg-muted rounded-lg">
                            <input value={editAltName} onChange={e => setEditAltName(e.target.value)} placeholder="اسم المصدر البديل" className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-arabic outline-none" />
                            <input value={editAltUrl} onChange={e => setEditAltUrl(e.target.value)} placeholder="رابط المصدر البديل" className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-english outline-none" dir="ltr" />
                          </div>
                        )}

                        {/* Assigned category */}
                        <div>
                          <label className="text-[10px] font-arabic text-muted-foreground block mb-1">تخصيص لقسم</label>
                          <select value={editAssignedCategory} onChange={e => setEditAssignedCategory(e.target.value)} className="w-full bg-muted border border-border rounded-lg px-3 py-1.5 text-xs font-arabic outline-none">
                            <option value="">بدون تخصيص</option>
                            {editSourceCategories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => saveEditSource(source.id)} className="flex-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-arabic flex items-center justify-center gap-1"><Save className="w-3 h-3" /> حفظ</button>
                          <button onClick={() => setEditingSource(null)} className="flex-1 bg-muted px-3 py-1.5 rounded-lg text-xs font-arabic flex items-center justify-center gap-1"><X className="w-3 h-3" /> إلغاء</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold font-arabic text-sm text-card-foreground truncate">{source.name}</h3>
                            <a href={source.url} target="_blank" className="text-xs font-english text-muted-foreground hover:text-primary flex items-center gap-1 truncate" dir="ltr">
                              {source.url} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${source.is_active ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                              {source.is_active ? 'نشط' : 'متوقف'}
                            </span>
                            {source.hide_source && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 flex items-center gap-0.5">
                                <EyeOff className="w-2.5 h-2.5" /> مخفي
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span className="font-english bg-muted px-2 py-0.5 rounded">{methodNames[source.fetch_method] || source.fetch_method}</span>
                          <span>كل {source.fetch_interval} دقيقة</span>
                          <span>• {getSourceArticleCount(source.id)} خبر</span>
                          {source.assigned_category && <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px]">📌 {source.assigned_category}</span>}
                        </div>
                        {source.alt_source_name && (
                          <div className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded">
                            بديل: <strong>{source.alt_source_name}</strong>
                          </div>
                        )}
                        <div className="text-[11px] text-muted-foreground space-y-0.5">
                          {source.last_fetch && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>آخر جلب: {new Date(source.last_fetch).toLocaleString('ar-EG')}</span>
                            </div>
                          )}
                          {fetchResults[source.id] && (
                            <div className={`flex items-center gap-1 ${fetchResults[source.id].success ? 'text-green-600' : 'text-destructive'}`}>
                              <span>{fetchResults[source.id].success ? '✅' : '❌'} {fetchResults[source.id].count} خبر في {fetchResults[source.id].time}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1.5 mt-auto">
                          <button onClick={() => startEditSource(source)} className="flex-1 bg-muted hover:bg-muted/80 px-2 py-1.5 rounded-md text-xs font-arabic flex items-center justify-center gap-1 transition-colors"><Edit className="w-3 h-3" /> تعديل</button>
                          <button onClick={() => handleToggleSource(source)} className={`flex-1 px-2 py-1.5 rounded-md text-xs font-arabic flex items-center justify-center gap-1 transition-colors ${source.is_active ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-green-500/10 text-green-600 hover:bg-green-500/20'}`}>
                            {source.is_active ? <><PowerOff className="w-3 h-3" /> إيقاف</> : <><Power className="w-3 h-3" /> تفعيل</>}
                          </button>
                          <button onClick={() => handleManualFetch(source)} className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1.5 rounded-md text-xs font-arabic flex items-center justify-center gap-1 transition-colors"><RefreshCw className="w-3 h-3" /> جلب</button>
                          <button onClick={() => setDeleteConfirm(source.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {filteredSources.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground font-arabic">لا توجد مصادر في هذا القسم</div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'add-news' && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold font-arabic">{editingArticle ? 'تعديل الخبر' : 'إضافة خبر جديد'}</h2>
                {editingArticle && (
                  <button onClick={clearNewsForm} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><X className="w-3 h-3" /> إلغاء التعديل</button>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button onClick={() => setNewsSection('arabic')} className={`px-4 py-2 rounded-lg text-sm font-arabic ${newsSection === 'arabic' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>القسم العربي</button>
                  <button onClick={() => setNewsSection('global')} className={`px-4 py-2 rounded-lg text-sm font-english ${newsSection === 'global' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>English Section</button>
                </div>
                <div>
                  <label className="text-sm font-arabic text-muted-foreground block mb-1">العنوان *</label>
                  <input value={newsTitle} onChange={e => setNewsTitle(e.target.value)} className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-sm font-arabic text-muted-foreground block mb-1">الملخص</label>
                  <textarea value={newsSummary} onChange={e => setNewsSummary(e.target.value)} rows={2} className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary resize-none" />
                </div>
                <div>
                  <label className="text-sm font-arabic text-muted-foreground block mb-1">المحتوى *</label>
                  <textarea value={newsContent} onChange={e => setNewsContent(e.target.value)} rows={6} className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary resize-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-arabic text-muted-foreground block mb-1">التصنيف</label>
                    <select value={newsCategory} onChange={e => setNewsCategory(e.target.value)} className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-sm font-arabic outline-none">
                      <option value="">اختر التصنيف</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-arabic text-muted-foreground block mb-1">الكاتب</label>
                    <input value={newsAuthor} onChange={e => setNewsAuthor(e.target.value)} className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-arabic text-muted-foreground block mb-1">المصدر</label>
                  <input value={newsSourceName} onChange={e => setNewsSourceName(e.target.value)} className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-sm font-arabic text-muted-foreground block mb-1">رابط المصدر</label>
                  <input value={newsSourceUrl} onChange={e => setNewsSourceUrl(e.target.value)} placeholder="https://example.com/news-story" dir="ltr" className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-sm font-english outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-sm font-arabic text-muted-foreground block mb-1">الصورة</label>
                  <div className="flex gap-2">
                    <input value={newsImage} onChange={e => setNewsImage(e.target.value)} placeholder="رابط الصورة أو ارفع من جهازك..." dir="ltr" className="flex-1 bg-muted border border-border rounded-lg px-4 py-2 text-sm font-english outline-none focus:ring-2 focus:ring-primary" />
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="bg-muted border border-border hover:bg-muted/80 px-4 py-2 rounded-lg text-sm font-arabic flex items-center gap-2 transition-colors disabled:opacity-50">
                      <Upload className="w-4 h-4" />{isUploading ? 'جاري...' : 'رفع'}
                    </button>
                  </div>
                  {newsImage && <img src={newsImage} alt="preview" className="mt-2 rounded-lg max-h-48 w-full object-contain bg-muted" onError={e => (e.target as HTMLImageElement).style.display = 'none'} />}
                </div>

                {/* Video Upload */}
                <div>
                  <label className="text-sm font-arabic text-muted-foreground block mb-1">الفيديو (اختياري)</label>
                  <div className="flex gap-2">
                    <input value={newsVideo} onChange={e => setNewsVideo(e.target.value)} placeholder="رابط الفيديو أو ارفع من جهازك..." dir="ltr" className="flex-1 bg-muted border border-border rounded-lg px-4 py-2 text-sm font-english outline-none focus:ring-2 focus:ring-primary" />
                    <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/avi,video/*" onChange={handleVideoUpload} className="hidden" />
                    <button type="button" onClick={() => videoInputRef.current?.click()} disabled={isUploadingVideo} className="bg-muted border border-border hover:bg-muted/80 px-4 py-2 rounded-lg text-sm font-arabic flex items-center gap-2 transition-colors disabled:opacity-50">
                      <Video className="w-4 h-4" />{isUploadingVideo ? 'جاري...' : 'رفع فيديو'}
                    </button>
                  </div>
                  {newsVideo && (
                    <video src={newsVideo} controls className="mt-2 rounded-lg max-h-48 w-full bg-muted" />
                  )}
                </div>

                {/* AI Editor Tools */}
                <ArticleEditorAI
                  title={newsTitle}
                  summary={newsSummary}
                  content={newsContent}
                  sourceUrl={newsSourceUrl || null}
                  section={newsSection}
                  onUpdate={(fields) => {
                    if (fields.title !== undefined) setNewsTitle(fields.title);
                    if (fields.summary !== undefined) setNewsSummary(fields.summary);
                    if (fields.content !== undefined) setNewsContent(fields.content);
                  }}
                />

                <button onClick={handleAddNews} disabled={upsertArticle.isPending} className="bg-primary text-primary-foreground px-8 py-2.5 rounded-lg text-sm font-arabic font-bold hover:opacity-90 flex items-center gap-2 disabled:opacity-50">
                  {editingArticle ? <><Save className="w-4 h-4" /> حفظ التعديلات</> : <><Plus className="w-4 h-4" /> نشر الخبر</>}
                </button>
              </div>
            </div>

            <div className="w-full lg:w-96 flex-shrink-0">
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-bold font-arabic text-sm mb-3">الأخبار الأخيرة ({newsSection === 'arabic' ? 'عربي' : 'إنجليزي'})</h3>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {displayedArticles.map(article => (
                    <div key={article.id} className="p-2 rounded-md hover:bg-muted transition-colors border border-border/50">
                      <div className="flex gap-2">
                        {article.image_url && (
                          <img src={article.image_url} alt="" className="w-14 h-10 rounded object-cover flex-shrink-0" onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-arabic line-clamp-2 text-card-foreground">{article.title}</p>
                          <span className="text-[10px] text-muted-foreground">{article.source_name} • {article.category}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        <button onClick={() => handleAiOptimize(article.id, 'optimize')} disabled={!!aiProcessing[article.id]} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-arabic bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors">
                          {aiProcessing[article.id] === 'optimize' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} تحسين شامل
                        </button>
                        <button onClick={() => handleAiOptimize(article.id, 'rewrite')} disabled={!!aiProcessing[article.id]} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-arabic bg-accent/50 text-accent-foreground hover:bg-accent/70 disabled:opacity-50 transition-colors">
                          {aiProcessing[article.id] === 'rewrite' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} إعادة كتابة
                        </button>
                        <button onClick={() => handlePublishDistribute(article)} disabled={!!aiProcessing[article.id]} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-arabic bg-green-500/10 text-green-600 hover:bg-green-500/20 disabled:opacity-50 transition-colors">
                          {aiProcessing[article.id] === 'distribute' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} نشر وتوزيع
                        </button>
                        <button onClick={() => handleEditArticle(article)} className="p-1 text-muted-foreground hover:text-primary rounded transition-colors">
                          <Edit className="w-3 h-3" />
                        </button>
                        <button onClick={() => { deleteArticle.mutateAsync(article.id); toast.success('تم الحذف'); }} className="p-1 text-destructive/60 hover:text-destructive rounded transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {displayedArticles.length === 0 && <p className="text-xs text-muted-foreground font-arabic text-center py-4">لا توجد أخبار بعد</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'news-manager' && (
          <NewsManagerTab onEditArticle={(article) => { handleEditArticle(article); setActiveTab('add-news'); }} />
        )}

        {activeTab === 'ai-writer' && <AIWriterTab allArticles={allArticles} upsertArticle={upsertArticle} />}

        {activeTab === 'analytics' && <AnalyticsTab />}

        {activeTab === 'radio' && <RadioAdminTab />}

        {activeTab === 'sponsors' && <SponsorsAdminTab />}

        {activeTab === 'settings' && <SettingsTab />}
      </main>
      <SiteFooter />
    </div>
  );
}

function AIWriterTab({ allArticles, upsertArticle }: { allArticles: Article[]; upsertArticle: any }) {
  const [aiTitle, setAiTitle] = useState('');
  const [aiResult, setAiResult] = useState<{ title: string; summary: string; content: string; category: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSection, setAiSection] = useState<'arabic' | 'global'>('arabic');

  const handleGenerate = async () => {
    if (!aiTitle) { toast.error('أدخل العنوان أولاً'); return; }
    setAiLoading(true);
    setAiResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-article', { body: { mode: 'generate', title: aiTitle } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiResult(data);
      toast.success('تم توليد المقال بنجاح');
    } catch (e: any) {
      toast.error(e.message || 'خطأ في توليد المقال');
    }
    setAiLoading(false);
  };

  const handleAnalyze = async () => {
    const titles = allArticles.slice(0, 20).map(a => `- ${a.title}`).join('\n');
    if (!titles) { toast.error('لا توجد أخبار للتحليل'); return; }
    setAiLoading(true);
    setAiResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-article', { body: { mode: 'analyze', newsTitles: titles } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiResult(data);
      toast.success('تم التحليل بنجاح');
    } catch (e: any) {
      toast.error(e.message || 'خطأ في التحليل');
    }
    setAiLoading(false);
  };

  const handlePublish = async () => {
    if (!aiResult) return;
    try {
      await upsertArticle.mutateAsync({
        title: aiResult.title, summary: aiResult.summary, content: aiResult.content,
        category: aiResult.category || 'مقالات', section: aiSection,
        author: 'عبدالملك حميد الكوكباني', source_name: 'شبام24',
      });
      toast.success('تم نشر المقال');
      setAiResult(null);
      setAiTitle('');
    } catch { toast.error('خطأ في النشر'); }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-bold font-arabic mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> الكاتب الذكي
        </h2>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setAiSection('arabic')} className={`px-4 py-1.5 rounded-lg text-sm font-arabic ${aiSection === 'arabic' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>عربي</button>
          <button onClick={() => setAiSection('global')} className={`px-4 py-1.5 rounded-lg text-sm font-english ${aiSection === 'global' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>English</button>
        </div>
        <input value={aiTitle} onChange={e => setAiTitle(e.target.value)} placeholder="اكتب عنوان أو موضوع للمقال..." className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary mb-4" />
        <div className="flex gap-3 flex-wrap">
          <button onClick={handleGenerate} disabled={aiLoading} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-arabic font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {aiLoading ? 'جاري...' : 'توليد مقال'}
          </button>
          <button onClick={handleAnalyze} disabled={aiLoading} className="bg-muted border border-border px-6 py-2 rounded-lg text-sm font-arabic font-bold hover:bg-muted/80 disabled:opacity-50 flex items-center gap-2">
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} {aiLoading ? 'جاري...' : 'تحليل أخبار الموقع'}
          </button>
        </div>
      </div>

      {aiResult && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <label className="text-xs font-arabic text-muted-foreground block mb-1">العنوان</label>
            <input value={aiResult.title} onChange={e => setAiResult({ ...aiResult, title: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs font-arabic text-muted-foreground block mb-1">الملخص</label>
            <textarea value={aiResult.summary} onChange={e => setAiResult({ ...aiResult, summary: e.target.value })} rows={2} className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
          <div>
            <label className="text-xs font-arabic text-muted-foreground block mb-1">المحتوى</label>
            <textarea value={aiResult.content} onChange={e => setAiResult({ ...aiResult, content: e.target.value })} rows={8} className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
          <div>
            <label className="text-xs font-arabic text-muted-foreground block mb-1">التصنيف</label>
            <input value={aiResult.category} onChange={e => setAiResult({ ...aiResult, category: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <button onClick={handlePublish} disabled={upsertArticle.isPending} className="bg-primary text-primary-foreground px-8 py-2.5 rounded-lg text-sm font-arabic font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
            <Plus className="w-4 h-4" /> نشر المقال
          </button>
        </div>
      )}
    </div>
  );
}
