import { memo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Phone } from 'lucide-react';
import { getHijriDate, getGregorianDateAr } from '@/lib/hijriDate';

// Isolated clock so the per-second tick doesn't re-render the rest of the footer.
const LiveClock = memo(function LiveClock() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('ar-EG', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    });
    const update = () => { if (ref.current) ref.current.textContent = fmt.format(new Date()); };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return <div ref={ref} className="text-3xl font-bold font-english tabular-nums mb-2" />;
});

export default function SiteFooter() {
  const gregorianDate = getGregorianDateAr();
  const hijriDate = getHijriDate();

  return (
    <footer className="bg-secondary text-secondary-foreground mt-8" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Clock & Dates */}
          <div className="text-center md:text-right">
            <LiveClock />
            <p className="text-sm opacity-80 font-arabic">{gregorianDate}</p>
            <p className="text-sm opacity-80 font-arabic">{hijriDate}</p>
          </div>

          {/* Brand */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-2">
              <span className="text-primary-foreground font-arabic font-bold text-xl">ش</span>
            </div>
            <h3 className="font-arabic font-bold text-lg">شبام24</h3>
            <p className="text-xs opacity-70 font-english">Shibam24</p>
            <p className="text-xs opacity-60 mt-2 font-arabic">منصة إخبارية عربية وعالمية</p>
          </div>

          {/* Editor-in-Chief */}
          <div className="text-center md:text-left">
            <h4 className="font-arabic font-bold text-sm mb-2">رئيس التحرير</h4>
            <p className="font-arabic text-base">عبدالملك حميد الكوكباني</p>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-sm opacity-80">
              <Phone className="w-4 h-4" />
              <span className="font-english" dir="ltr">777492635</span>
            </div>
          </div>
        </div>

        <nav className="border-t border-sidebar-border mt-6 pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-arabic">
          <Link to="/about" className="opacity-80 hover:opacity-100 hover:underline">من نحن</Link>
          <Link to="/privacy-policy" className="opacity-80 hover:opacity-100 hover:underline">سياسة الخصوصية</Link>
          <Link to="/terms" className="opacity-80 hover:opacity-100 hover:underline">شروط الاستخدام</Link>
          <Link to="/articles" className="opacity-80 hover:opacity-100 hover:underline">الأرشيف</Link>
        </nav>

        <div className="mt-3 text-center text-xs opacity-60 font-arabic">
          <p>© {new Date().getFullYear()} شبام24 - جميع الحقوق محفوظة</p>
        </div>
      </div>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/967777492635"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 hover:scale-110 transition-all"
        title="تواصل عبر واتساب"
      >
        <MessageCircle className="w-7 h-7" />
      </a>
    </footer>
  );
}
