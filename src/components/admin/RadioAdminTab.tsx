import { useState, useMemo } from 'react';
import { radioStations as defaultStations, type RadioStation } from '@/data/radioStations';
import { testStream, type StreamTestResult } from '@/lib/streamTester';
import { Plus, Trash2, Edit, Search, Eye, EyeOff, Play, Square, X, Save, RefreshCw, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const LS_KEY = 'admin_radio_stations';
const LS_HIDDEN = 'admin_radio_hidden';

function loadStations(): RadioStation[] {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return defaultStations;
}

function saveStations(stations: RadioStation[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(stations));
}

function loadHidden(): number[] {
  try {
    const saved = localStorage.getItem(LS_HIDDEN);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function saveHidden(ids: number[]) {
  localStorage.setItem(LS_HIDDEN, JSON.stringify(ids));
}

export default function RadioAdminTab() {
  const [stations, setStations] = useState<RadioStation[]>(loadStations);
  const [hiddenIds, setHiddenIds] = useState<number[]>(loadHidden);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', city: '', country: '', stream_url: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', city: '', country: '', stream_url: '' });
  const [testResults, setTestResults] = useState<Record<number, StreamTestResult>>({});
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testingAll, setTestingAll] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return stations;
    const q = search.trim().toLowerCase();
    return stations.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q)
    );
  }, [stations, search]);

  const handleTestStream = async (station: RadioStation) => {
    setTestingId(station.id);
    const result = await testStream(station.stream_url);
    setTestResults(prev => ({ ...prev, [station.id]: result }));
    setTestingId(null);
    toast(result.working ? `✅ ${station.name} - البث يعمل` : `❌ ${station.name} - البث لا يعمل`);
  };

  const handleTestAll = async () => {
    setTestingAll(true);
    let working = 0, broken = 0;
    for (const station of stations.slice(0, 50)) {
      setTestingId(station.id);
      const result = await testStream(station.stream_url, 5000);
      setTestResults(prev => ({ ...prev, [station.id]: result }));
      if (result.working) working++; else broken++;
    }
    setTestingId(null);
    setTestingAll(false);
    toast.success(`فحص مكتمل: ${working} يعمل، ${broken} معطل (من أول 50)`);
  };

  const handleToggleHidden = (id: number) => {
    const updated = hiddenIds.includes(id)
      ? hiddenIds.filter(h => h !== id)
      : [...hiddenIds, id];
    setHiddenIds(updated);
    saveHidden(updated);
    toast.success(hiddenIds.includes(id) ? 'تم إظهار المحطة' : 'تم إخفاء المحطة');
  };

  const startEdit = (station: RadioStation) => {
    setEditingId(station.id);
    setEditForm({ name: station.name, city: station.city, country: station.country, stream_url: station.stream_url });
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updated = stations.map(s =>
      s.id === editingId ? { ...s, ...editForm } : s
    );
    setStations(updated);
    saveStations(updated);
    setEditingId(null);
    toast.success('تم تحديث المحطة');
  };

  const handleDelete = (id: number) => {
    const updated = stations.filter(s => s.id !== id);
    setStations(updated);
    saveStations(updated);
    toast.success('تم حذف المحطة');
  };

  const handleAdd = () => {
    if (!newForm.name || !newForm.stream_url) {
      toast.error('أدخل اسم المحطة ورابط البث');
      return;
    }
    const maxId = stations.reduce((max, s) => Math.max(max, s.id), 0);
    const newStation: RadioStation = {
      id: maxId + 1,
      name: newForm.name,
      city: newForm.city || 'غير محدد',
      country: newForm.country || 'غير محدد',
      stream_url: newForm.stream_url,
    };
    const updated = [newStation, ...stations];
    setStations(updated);
    saveStations(updated);
    setNewForm({ name: '', city: '', country: '', stream_url: '' });
    setShowAdd(false);
    toast.success('تم إضافة المحطة');
  };

  const handleReset = () => {
    setStations(defaultStations);
    saveStations(defaultStations);
    setHiddenIds([]);
    saveHidden([]);
    setTestResults({});
    toast.success('تم استعادة المحطات الافتراضية');
  };

  const hiddenCount = hiddenIds.length;
  const brokenCount = Object.values(testResults).filter(r => !r.working).length;

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-primary">{stations.length}</p>
          <p className="text-xs text-muted-foreground font-arabic">إجمالي المحطات</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{stations.length - hiddenCount}</p>
          <p className="text-xs text-muted-foreground font-arabic">محطات ظاهرة</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{hiddenCount}</p>
          <p className="text-xs text-muted-foreground font-arabic">محطات مخفية</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-destructive">{brokenCount}</p>
          <p className="text-xs text-muted-foreground font-arabic">روابط معطلة</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-arabic font-bold bg-primary text-primary-foreground hover:opacity-90 transition-colors">
          <Plus className="w-4 h-4" /> إضافة محطة
        </button>
        <button onClick={handleTestAll} disabled={testingAll} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-arabic font-bold bg-muted text-muted-foreground hover:bg-muted/80 transition-colors disabled:opacity-50">
          {testingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          فحص جميع الروابط
        </button>
        <button onClick={handleReset} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-arabic font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
          <RefreshCw className="w-4 h-4" /> استعادة الافتراضي
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <h3 className="font-arabic font-bold text-sm">إضافة محطة جديدة</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })} placeholder="اسم المحطة *" className="bg-muted border border-border rounded-lg px-3 py-2 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary" />
            <input value={newForm.stream_url} onChange={e => setNewForm({ ...newForm, stream_url: e.target.value })} placeholder="رابط البث *" dir="ltr" className="bg-muted border border-border rounded-lg px-3 py-2 text-sm font-english outline-none focus:ring-2 focus:ring-primary" />
            <input value={newForm.country} onChange={e => setNewForm({ ...newForm, country: e.target.value })} placeholder="الدولة" className="bg-muted border border-border rounded-lg px-3 py-2 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary" />
            <input value={newForm.city} onChange={e => setNewForm({ ...newForm, city: e.target.value })} placeholder="المدينة" className="bg-muted border border-border rounded-lg px-3 py-2 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-arabic font-bold bg-primary text-primary-foreground hover:opacity-90">
              <Plus className="w-4 h-4" /> حفظ
            </button>
            <button onClick={() => setShowAdd(false)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-arabic bg-muted hover:bg-muted/80">
              <X className="w-4 h-4" /> إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="بحث في المحطات..."
          className="w-full bg-muted border border-border rounded-lg pr-9 pl-3 py-2.5 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Station List */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {filtered.map(station => {
          const isHidden = hiddenIds.includes(station.id);
          const isEditing = editingId === station.id;
          const result = testResults[station.id];
          const isTesting = testingId === station.id;

          return (
            <div key={station.id} className={`bg-card border border-border rounded-lg p-3 transition-colors ${isHidden ? 'opacity-50' : ''}`}>
              {isEditing ? (
                <div className="space-y-2">
                  <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3 py-1.5 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary" placeholder="اسم المحطة" />
                  <input value={editForm.stream_url} onChange={e => setEditForm({ ...editForm, stream_url: e.target.value })} dir="ltr" className="w-full bg-muted border border-border rounded-lg px-3 py-1.5 text-sm font-english outline-none focus:ring-2 focus:ring-primary" placeholder="رابط البث" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={editForm.country} onChange={e => setEditForm({ ...editForm, country: e.target.value })} className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary" placeholder="الدولة" />
                    <input value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary" placeholder="المدينة" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-arabic bg-primary text-primary-foreground hover:opacity-90"><Save className="w-3 h-3" /> حفظ</button>
                    <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-arabic bg-muted hover:bg-muted/80"><X className="w-3 h-3" /> إلغاء</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-arabic font-bold text-sm truncate text-card-foreground">{station.name}</p>
                      {result && (
                        result.working
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          : <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                      )}
                      {isHidden && <span className="text-[10px] bg-yellow-500/10 text-yellow-600 px-1.5 py-0.5 rounded shrink-0">مخفي</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{station.country} • {station.city}</p>
                    <p className="text-[10px] text-muted-foreground truncate font-english" dir="ltr">{station.stream_url}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => handleTestStream(station)} disabled={isTesting} className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50" title="فحص البث">
                      {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-green-600" />}
                    </button>
                    <button onClick={() => handleToggleHidden(station.id)} className="p-1.5 rounded-md hover:bg-muted transition-colors" title={isHidden ? 'إظهار' : 'إخفاء'}>
                      {isHidden ? <EyeOff className="w-3.5 h-3.5 text-yellow-600" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                    <button onClick={() => startEdit(station)} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="تعديل">
                      <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(station.id)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors" title="حذف">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center py-8 text-muted-foreground font-arabic text-sm">لا توجد نتائج</p>
        )}
      </div>
    </div>
  );
}
