import { useState } from 'react';
import { Search, Moon, Sun, Menu, Radio, Wifi, WifiOff } from 'lucide-react';
import { useRadio } from '@/contexts/RadioContext';
import { useDataSaving } from '@/contexts/DataSavingContext';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@/lib/useTheme';
import SmartSidebar from '@/components/SmartSidebar';
import { publicAssetUrl } from '@/lib/site';

export default function SiteHeader() {
  const { isDark, toggle } = useTheme();
  const { openPanel, isPlaying } = useRadio();
  const { isLowData, toggle: toggleData } = useDataSaving();
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const navigate = useNavigate();
  const logoUrl = publicAssetUrl("logo.png?v=5");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileSearchOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-secondary text-secondary-foreground shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2.5" aria-label="شبام24 — الرئيسية">
              <img
                src={logoUrl}
                alt="شعار شبام24"
                width="40"
                height="40"
                className="h-10 w-10 rounded-md bg-white p-0.5 shadow-sm ring-1 ring-white/10 object-contain"
              />
              <div className="leading-tight">
                <h1 className="font-arabic font-bold text-base">شبام24</h1>
                <p className="text-[10px] opacity-70 font-english tracking-wide">SHIBAM24 · NEWS</p>
              </div>
            </Link>

            <button
              onClick={openPanel}
              className="flex items-center gap-1.5 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-md text-sm font-arabic font-bold hover:bg-destructive/90 transition-colors"
            >
              <Radio className="w-4 h-4" />
              <span>راديو مباشر</span>
              {isPlaying && (
                <span className="flex gap-0.5 items-end h-3">
                  <span className="w-0.5 bg-destructive-foreground rounded-full animate-pulse" style={{ height: '60%' }} />
                  <span className="w-0.5 bg-destructive-foreground rounded-full animate-pulse" style={{ height: '100%', animationDelay: '0.2s' }} />
                  <span className="w-0.5 bg-destructive-foreground rounded-full animate-pulse" style={{ height: '40%', animationDelay: '0.4s' }} />
                </span>
              )}
            </button>

            <nav className="hidden md:flex items-center gap-1">
              <Link to="/" className="px-3 py-2 rounded-md text-sm font-arabic hover:bg-sidebar-accent transition-colors">الرئيسية</Link>
              <Link to="/section/arabic" className="px-3 py-2 rounded-md text-sm font-arabic hover:bg-sidebar-accent transition-colors">أخبار العرب</Link>
              <Link to="/section/global" className="px-3 py-2 rounded-md text-sm font-english hover:bg-sidebar-accent transition-colors">World News</Link>
              <Link to="/articles" className="px-3 py-2 rounded-md text-sm font-arabic hover:bg-sidebar-accent transition-colors">مقالات</Link>
            </nav>

            <div className="flex items-center gap-1">
              <form onSubmit={handleSearch} className="hidden sm:flex items-center bg-sidebar-accent rounded-lg overflow-hidden">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث..."
                  className="bg-transparent text-sm px-3 py-1.5 w-36 lg:w-48 outline-none text-sidebar-foreground placeholder:text-muted-foreground font-arabic"
                  dir="rtl"
                />
                <button type="submit" className="p-2 hover:bg-primary/20 transition-colors">
                  <Search className="w-4 h-4" />
                </button>
              </form>

              <button onClick={() => setMobileSearchOpen(!mobileSearchOpen)} className="sm:hidden p-2 rounded-md hover:bg-sidebar-accent transition-colors">
                <Search className="w-4 h-4" />
              </button>

              <button
                onClick={toggleData}
                className={`p-2 rounded-md hover:bg-sidebar-accent transition-colors ${isLowData ? 'text-accent' : ''}`}
                title={isLowData ? 'وضع توفير البيانات: مفعّل' : 'وضع توفير البيانات: معطّل'}
              >
                {isLowData ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              </button>

              <button onClick={toggle} className="p-2 rounded-md hover:bg-sidebar-accent transition-colors">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-sidebar-accent transition-colors">
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </div>

          {mobileSearchOpen && (
            <form onSubmit={handleSearch} className="sm:hidden flex items-center bg-sidebar-accent rounded-lg overflow-hidden mb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في الأخبار..."
                className="bg-transparent text-sm px-3 py-2 flex-1 outline-none text-sidebar-foreground placeholder:text-muted-foreground font-arabic"
                dir="rtl"
                autoFocus
              />
              <button type="submit" className="p-2 hover:bg-primary/20 transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </header>

      <SmartSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
