import { useState, useMemo, useRef } from 'react';
import { useArticles, useDeleteArticle, useBulkDeleteArticles, type Article } from '@/hooks/useArticles';
import { Search, Trash2, Edit, ChevronLeft, ChevronRight, CheckSquare, Square, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { getSmartTimeAgo } from '@/lib/timeAgo';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Props {
  onEditArticle: (article: Article) => void;
}

const SECTIONS = [
  { key: '', label: 'الكل' },
  { key: 'arabic', label: 'عربي' },
  { key: 'global', label: 'English' },
];

const PER_PAGE = 50;
const ROW_HEIGHT = 56;

export default function NewsManagerTab({ onEditArticle }: Props) {
  const { data: allArticles = [], isLoading } = useArticles();
  const deleteArticle = useDeleteArticle();
  const bulkDelete = useBulkDeleteArticles();
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const parentRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => {
    const cats = new Set(allArticles.map(a => a.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [allArticles]);

  const filtered = useMemo(() => {
    let list = allArticles;
    if (sectionFilter) list = list.filter(a => a.section === sectionFilter);
    if (categoryFilter) list = list.filter(a => a.category === categoryFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(q) || (a.summary || '').toLowerCase().includes(q));
    }
    return list;
  }, [allArticles, sectionFilter, categoryFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE),
    [filtered, currentPage]
  );

  const rowVirtualizer = useVirtualizer({
    count: paginated.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map(a => a.id)));
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`هل تريد حذف ${selected.size} خبر؟`)) return;
    const ids = Array.from(selected);
    setSelected(new Set());
    // Optimistic — UI updates immediately, single network round-trip
    bulkDelete.mutate(ids, {
      onSuccess: (n) => toast.success(`تم حذف ${n} خبر`),
      onError: () => toast.error('خطأ في الحذف'),
    });
  };

  const handleSingleDelete = (id: string) => {
    deleteArticle.mutate(id, {
      onSuccess: () => toast.success('تم الحذف'),
      onError: () => toast.error('خطأ في الحذف'),
    });
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="بحث في العنوان..."
            className="w-full bg-muted border border-border rounded-lg pr-10 pl-4 py-2.5 text-sm font-arabic outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => { setSectionFilter(s.key); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-arabic transition-colors ${sectionFilter === s.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {s.label}
            </button>
          ))}
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            className="bg-muted border border-border rounded-lg px-3 py-1 text-xs font-arabic outline-none">
            <option value="">كل التصنيفات</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-xs text-muted-foreground mr-auto">{filtered.length.toLocaleString()} خبر</span>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <span className="text-sm font-arabic text-destructive font-bold">{selected.size} محدد</span>
          <button onClick={handleBulkDelete} disabled={bulkDelete.isPending}
            className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-arabic bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-50">
            <Trash2 className="w-3 h-3" /> {bulkDelete.isPending ? 'جاري الحذف...' : 'حذف المحدد'}
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground hover:text-foreground font-arabic">إلغاء التحديد</button>
        </div>
      )}

      {isLoading && allArticles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground font-arabic">جاري التحميل...</div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-2 bg-muted border-b border-border text-xs text-muted-foreground font-arabic">
            <button onClick={toggleAll} className="p-0.5">
              {selected.size === paginated.length && paginated.length > 0 ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
            </button>
            <span className="flex-1">العنوان</span>
            <span className="w-20 text-center hidden sm:block">القسم</span>
            <span className="w-24 text-center hidden sm:block">التصنيف</span>
            <span className="w-24 text-center hidden md:block">التاريخ</span>
            <span className="w-16 text-center">إجراءات</span>
          </div>

          {/* Virtualized rows */}
          <div ref={parentRef} className="overflow-auto" style={{ height: Math.min(paginated.length * ROW_HEIGHT, 600) }}>
            <div style={{ height: rowVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const article = paginated[virtualRow.index];
                if (!article) return null;
                return (
                  <div
                    key={article.id}
                    style={{
                      position: 'absolute', top: 0, left: 0, width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className={`flex items-center gap-3 px-4 border-b border-border/50 hover:bg-muted/50 transition-colors ${selected.has(article.id) ? 'bg-primary/5' : ''}`}
                  >
                    <button onClick={() => toggleSelect(article.id)} className="p-0.5 flex-shrink-0">
                      {selected.has(article.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-arabic line-clamp-1 text-card-foreground">{article.title}</p>
                      <span className="text-[10px] text-muted-foreground">{article.source_name}</span>
                    </div>
                    <span className="w-20 text-center text-[10px] text-muted-foreground hidden sm:block">{article.section === 'arabic' ? 'عربي' : 'EN'}</span>
                    <span className="w-24 text-center text-[10px] bg-muted px-1.5 py-0.5 rounded hidden sm:block truncate">{article.category}</span>
                    <span className="w-24 text-center text-[10px] text-muted-foreground hidden md:block">{getSmartTimeAgo(article.published_at, true)}</span>
                    <div className="w-16 flex items-center justify-center gap-1 flex-shrink-0">
                      <button onClick={() => onEditArticle(article)} className="p-1 text-muted-foreground hover:text-primary rounded transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleSingleDelete(article.id)}
                        className="p-1 text-destructive/60 hover:text-destructive rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {paginated.length === 0 && (
            <div className="text-center py-8 text-muted-foreground font-arabic text-sm">لا توجد نتائج</div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="p-2 rounded-md border border-border hover:bg-muted disabled:opacity-30 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
            const p = start + i;
            if (p > totalPages) return null;
            return (
              <button key={p} onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-md text-sm font-medium transition-colors ${p === currentPage ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted'}`}>
                {p}
              </button>
            );
          })}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="p-2 rounded-md border border-border hover:bg-muted disabled:opacity-30 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
