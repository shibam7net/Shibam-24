import { useRef, useState } from 'react';
import { Plus, Trash2, Edit, Save, X, Upload, Power, PowerOff, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSponsors, useUpsertSponsor, useDeleteSponsor, uploadSponsorLogo, type Sponsor } from '@/hooks/useSponsors';

export default function SponsorsAdminTab() {
  const { data: sponsors = [], isLoading } = useSponsors(false);
  const upsert = useUpsertSponsor();
  const del = useDeleteSponsor();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState<string | null>(null);
  const [eName, setEName] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eLink, setELink] = useState('');
  const [eLogo, setELogo] = useState('');

  const handleUpload = async (file: File, setter: (u: string) => void) => {
    try {
      setUploading(true);
      const url = await uploadSponsorLogo(file);
      setter(url);
      toast.success('تم رفع الشعار');
    } catch (e: any) {
      toast.error(e.message || 'فشل الرفع');
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async () => {
    if (!name.trim() || !logoUrl.trim()) {
      toast.error('الاسم والشعار مطلوبان');
      return;
    }
    if (sponsors.length >= 15) {
      toast.error('الحد الأقصى 15 راعي');
      return;
    }
    await upsert.mutateAsync({
      name: name.trim(),
      description: description.trim(),
      link_url: linkUrl.trim() || null,
      logo_url: logoUrl,
      is_active: true,
      sort_order: sponsors.length,
    });
    setName(''); setDescription(''); setLinkUrl(''); setLogoUrl('');
    toast.success('تمت إضافة الراعي');
  };

  const startEdit = (s: Sponsor) => {
    setEditing(s.id);
    setEName(s.name); setEDesc(s.description); setELink(s.link_url || ''); setELogo(s.logo_url);
  };

  const saveEdit = async (id: string) => {
    await upsert.mutateAsync({ id, name: eName, description: eDesc, link_url: eLink || null, logo_url: eLogo });
    setEditing(null);
    toast.success('تم الحفظ');
  };

  const toggle = async (s: Sponsor) => {
    await upsert.mutateAsync({ id: s.id, name: s.name, logo_url: s.logo_url, is_active: !s.is_active });
  };

  const move = async (s: Sponsor, dir: -1 | 1) => {
    const idx = sponsors.findIndex(x => x.id === s.id);
    const j = idx + dir;
    if (j < 0 || j >= sponsors.length) return;
    const other = sponsors[j];
    await Promise.all([
      upsert.mutateAsync({ id: s.id, name: s.name, logo_url: s.logo_url, sort_order: other.sort_order }),
      upsert.mutateAsync({ id: other.id, name: other.name, logo_url: other.logo_url, sort_order: s.sort_order }),
    ]);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-bold font-arabic mb-4">إضافة راعي جديد ({sponsors.length}/15)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="اسم الراعي" className="bg-muted border border-border rounded-lg px-3 py-2 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary" />
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="وصف قصير (اختياري)" className="bg-muted border border-border rounded-lg px-3 py-2 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary" />
          <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="رابط الانتقال (اختياري)" className="bg-muted border border-border rounded-lg px-3 py-2 text-sm font-english outline-none focus:ring-2 focus:ring-primary" dir="ltr" />
          <div className="flex items-center gap-2">
            <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="رابط الشعار أو ارفع صورة" className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm font-english outline-none focus:ring-2 focus:ring-primary" dir="ltr" />
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], setLogoUrl)} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="bg-muted hover:bg-muted/80 px-3 py-2 rounded-lg text-sm font-arabic flex items-center gap-1">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {logoUrl && <img src={logoUrl} alt="preview" className="mt-3 w-16 h-16 object-contain rounded-lg bg-muted p-1" />}
        <button onClick={handleAdd} disabled={upsert.isPending} className="mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-arabic font-bold flex items-center gap-2 disabled:opacity-50">
          <Plus className="w-4 h-4" /> إضافة
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-bold font-arabic mb-4">الرعاة الحاليون</h2>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8 font-arabic">جاري التحميل...</div>
        ) : sponsors.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 font-arabic">لا يوجد رعاة بعد</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sponsors.map((s, i) => (
              <div key={s.id} className="bg-muted/40 border border-border rounded-lg p-3 flex flex-col gap-2">
                {editing === s.id ? (
                  <>
                    <div className="flex gap-3">
                      <img src={eLogo} alt="" className="w-14 h-14 object-contain rounded-lg bg-background p-1" />
                      <div className="flex-1 space-y-1">
                        <input value={eName} onChange={e => setEName(e.target.value)} className="w-full bg-background border border-border rounded px-2 py-1 text-sm font-arabic" />
                        <input value={eDesc} onChange={e => setEDesc(e.target.value)} className="w-full bg-background border border-border rounded px-2 py-1 text-xs font-arabic" placeholder="وصف" />
                      </div>
                    </div>
                    <input value={eLink} onChange={e => setELink(e.target.value)} placeholder="رابط" className="bg-background border border-border rounded px-2 py-1 text-xs font-english" dir="ltr" />
                    <input value={eLogo} onChange={e => setELogo(e.target.value)} placeholder="رابط الشعار" className="bg-background border border-border rounded px-2 py-1 text-xs font-english" dir="ltr" />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(s.id)} className="flex-1 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-arabic flex items-center justify-center gap-1"><Save className="w-3 h-3" /> حفظ</button>
                      <button onClick={() => setEditing(null)} className="flex-1 bg-muted px-2 py-1 rounded text-xs font-arabic flex items-center justify-center gap-1"><X className="w-3 h-3" /> إلغاء</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <img src={s.logo_url} alt={s.name} className="w-14 h-14 object-contain rounded-lg bg-background p-1" />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold font-arabic text-sm truncate">{s.name}</div>
                        {s.description && <div className="text-xs text-muted-foreground font-arabic truncate">{s.description}</div>}
                        {s.link_url && <a href={s.link_url} target="_blank" rel="noreferrer" className="text-[10px] text-primary truncate block font-english" dir="ltr">{s.link_url}</a>}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.is_active ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>{s.is_active ? 'نشط' : 'متوقف'}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => move(s, -1)} disabled={i === 0} className="bg-muted hover:bg-muted/70 p-1.5 rounded disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                      <button onClick={() => move(s, 1)} disabled={i === sponsors.length - 1} className="bg-muted hover:bg-muted/70 p-1.5 rounded disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                      <button onClick={() => startEdit(s)} className="flex-1 bg-muted hover:bg-muted/70 px-2 py-1 rounded text-xs font-arabic flex items-center justify-center gap-1"><Edit className="w-3 h-3" /> تعديل</button>
                      <button onClick={() => toggle(s)} className={`flex-1 px-2 py-1 rounded text-xs font-arabic flex items-center justify-center gap-1 ${s.is_active ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'}`}>
                        {s.is_active ? <><PowerOff className="w-3 h-3" /> إيقاف</> : <><Power className="w-3 h-3" /> تفعيل</>}
                      </button>
                      <button onClick={() => del.mutate(s.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
