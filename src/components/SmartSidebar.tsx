import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, Newspaper, Globe, TrendingUp, Eye, FileText } from 'lucide-react';
import { arabicCategories, globalCategories } from '@/data/mockNews';

interface SmartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SmartSidebar({ isOpen, onClose }: SmartSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity">
      <div
        ref={sidebarRef}
        className="fixed top-0 right-0 h-full w-72 bg-card border-l border-border shadow-2xl overflow-y-auto animate-slide-in-right"
        dir="rtl"
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary">
          <h2 className="font-arabic font-bold text-lg text-secondary-foreground">الأقسام</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors text-secondary-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 space-y-1 border-b border-border">
          <SidebarLink to="/" icon={<Newspaper className="w-4 h-4" />} label="الرئيسية" onClick={onClose} />
          <SidebarLink to="/section/arabic" icon={<Newspaper className="w-4 h-4" />} label="القسم العربي" onClick={onClose} />
          <SidebarLink to="/section/global" icon={<Globe className="w-4 h-4" />} label="القسم الإنجليزي" onClick={onClose} />
          <SidebarLink to="/articles" icon={<FileText className="w-4 h-4" />} label="مقالات" onClick={onClose} />
        </div>

        <div className="p-3 border-b border-border">
          <p className="text-xs font-arabic text-muted-foreground mb-2 px-2">الوصول السريع</p>
          <div className="space-y-1">
            <SidebarLink to="/?view=trending" icon={<TrendingUp className="w-4 h-4 text-primary" />} label="الأكثر رواجاً" onClick={onClose} />
            <SidebarLink to="/?view=mostread" icon={<Eye className="w-4 h-4 text-primary" />} label="الأكثر قراءة" onClick={onClose} />
          </div>
        </div>

        <div className="p-3 border-b border-border">
          <p className="text-xs font-arabic text-muted-foreground mb-2 px-2">أقسام عربية</p>
          <div className="space-y-0.5">
            {arabicCategories.map(cat => (
              <Link
                key={cat}
                to={`/section/arabic?category=${encodeURIComponent(cat)}`}
                onClick={onClose}
                className="block px-3 py-2 rounded-md text-sm font-arabic text-card-foreground hover:bg-muted transition-colors"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>

        <div className="p-3">
          <p className="text-xs font-english text-muted-foreground mb-2 px-2">English Sections</p>
          <div className="space-y-0.5">
            {globalCategories.map(cat => (
              <Link
                key={cat}
                to={`/section/global?category=${encodeURIComponent(cat)}`}
                onClick={onClose}
                className="block px-3 py-2 rounded-md text-sm font-english text-card-foreground hover:bg-muted transition-colors"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarLink({ to, icon, label, onClick }: { to: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-arabic text-card-foreground hover:bg-muted transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}
