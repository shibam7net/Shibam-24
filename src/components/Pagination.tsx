import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isArabic?: boolean;
}

export default function Pagination({ currentPage, totalPages, onPageChange, isArabic = true }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1 mt-8" dir={isArabic ? 'rtl' : 'ltr'}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {isArabic ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="w-9 h-9 rounded-md border border-border hover:bg-muted text-sm">1</button>
          {start > 2 && <span className="px-1 text-muted-foreground">...</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-9 h-9 rounded-md text-sm font-medium transition-colors ${
            p === currentPage
              ? 'bg-primary text-primary-foreground'
              : 'border border-border hover:bg-muted'
          }`}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-muted-foreground">...</span>}
          <button onClick={() => onPageChange(totalPages)} className="w-9 h-9 rounded-md border border-border hover:bg-muted text-sm">{totalPages}</button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {isArabic ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  );
}
