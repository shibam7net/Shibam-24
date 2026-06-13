import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Wand2, RefreshCw, FileText, Hash, Scissors, Globe, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  title: string;
  summary: string;
  content: string;
  sourceUrl: string | null;
  section: string;
  onUpdate: (fields: { title?: string; summary?: string; content?: string; tags?: string[] }) => void;
}

type AiTool = 'improve-title' | 'rewrite' | 'improve' | 'full-rewrite' | 'seo' | 'summarize' | 'fetch-details';

const tools: { key: AiTool; label: string; icon: typeof Wand2; desc: string }[] = [
  { key: 'improve-title', label: 'تحسين العنوان', icon: Wand2, desc: 'عنوان أقوى وأكثر جذباً' },
  { key: 'rewrite', label: 'إعادة كتابة', icon: RefreshCw, desc: 'إعادة كتابة كاملة' },
  { key: 'improve', label: 'تحسين المحتوى', icon: Sparkles, desc: 'تحسين الأسلوب اللغوي' },
  { key: 'full-rewrite', label: 'إعادة شاملة', icon: FileText, desc: 'إعادة بناء منظمة' },
  { key: 'seo', label: 'استخراج SEO', icon: Hash, desc: 'هاشتاقات وكلمات مفتاحية' },
  { key: 'summarize', label: 'تلخيص', icon: Scissors, desc: 'ملخص مختصر' },
  { key: 'fetch-details', label: 'جلب التفاصيل', icon: Globe, desc: 'جلب النص الكامل من المصدر' },
];

export default function ArticleEditorAI({ title, summary, content, sourceUrl, section, onUpdate }: Props) {
  const [loading, setLoading] = useState<AiTool | null>(null);
  const [seoTags, setSeoTags] = useState<string[]>([]);

  const handleTool = async (tool: AiTool) => {
    if (loading) return;
    if (tool === 'fetch-details' && !sourceUrl) {
      toast.error('لا يوجد رابط مصدر لجلب التفاصيل');
      return;
    }
    setLoading(tool);
    try {
      const { data, error } = await supabase.functions.invoke('ai-optimize', {
        body: { action: `editor-${tool}`, title, summary, content, sourceUrl, section },
      });
      if (error) throw error;
      if (data?.error) {
        if (data.error === 'Rate limit exceeded') toast.error('تم تجاوز حد الطلبات، حاول لاحقاً');
        else if (data.error === 'Credits exhausted') toast.error('يرجى إضافة رصيد');
        else throw new Error(data.error);
        setLoading(null);
        return;
      }

      if (tool === 'improve-title' && data?.title) {
        onUpdate({ title: data.title });
        toast.success('تم تحسين العنوان');
      } else if (tool === 'rewrite' && data?.content) {
        onUpdate({ title: data.title || undefined, content: data.content });
        toast.success('تم إعادة الكتابة');
      } else if (tool === 'improve' && data?.content) {
        onUpdate({ content: data.content });
        toast.success('تم تحسين المحتوى');
      } else if (tool === 'full-rewrite') {
        onUpdate({ title: data.title || undefined, content: data.content || undefined, summary: data.summary || undefined });
        toast.success('تم إعادة الكتابة الشاملة');
      } else if (tool === 'seo' && data?.tags) {
        setSeoTags(data.tags);
        onUpdate({ tags: data.tags });
        toast.success('تم استخراج الهاشتاقات');
      } else if (tool === 'summarize' && data?.summary) {
        onUpdate({ summary: data.summary });
        toast.success('تم إنشاء الملخص');
      } else if (tool === 'fetch-details' && data?.content) {
        onUpdate({ content: data.content, title: data.title || undefined });
        toast.success('تم جلب التفاصيل');
      }
    } catch (e: any) {
      toast.error(e.message || 'خطأ في المعالجة');
    }
    setLoading(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-arabic text-muted-foreground font-bold">🤖 أدوات الذكاء الاصطناعي</p>
      <div className="flex flex-wrap gap-1.5">
        {tools.map(t => (
          <button
            key={t.key}
            onClick={() => handleTool(t.key)}
            disabled={!!loading}
            title={t.desc}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-arabic bg-muted hover:bg-muted/80 border border-border transition-colors disabled:opacity-50"
          >
            {loading === t.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <t.icon className="w-3 h-3" />}
            {t.label}
          </button>
        ))}
      </div>
      {seoTags.length > 0 && (
        <div className="p-2 bg-muted rounded-lg">
          <p className="text-[10px] font-arabic text-muted-foreground mb-1">هاشتاقات SEO:</p>
          <div className="flex flex-wrap gap-1">
            {seoTags.map((tag, i) => (
              <span key={i} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">#{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
