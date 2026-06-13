import { X, MessageCircle, Send, Facebook, Twitter, Mail, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import type { RadioStation } from '@/data/radioStations';
import { stationShareUrl, stationShareText } from '@/lib/radioShare';

interface Props {
  station: RadioStation;
  onClose: () => void;
}

export default function ShareSheet({ station, onClose }: Props) {
  const url = stationShareUrl(station);
  const text = stationShareText(station);
  const enc = (s: string) => encodeURIComponent(s);

  const targets = [
    { name: 'واتساب', icon: MessageCircle, color: 'text-green-600 bg-green-500/10', href: `https://wa.me/?text=${enc(text + '\n' + url)}` },
    { name: 'تيليجرام', icon: Send, color: 'text-blue-500 bg-blue-500/10', href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}` },
    { name: 'فيسبوك', icon: Facebook, color: 'text-blue-700 bg-blue-700/10', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}&quote=${enc(text)}` },
    { name: 'X', icon: Twitter, color: 'text-foreground bg-muted', href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
    { name: 'ماسنجر', icon: MessageCircle, color: 'text-blue-600 bg-blue-500/10', href: `fb-messenger://share?link=${enc(url)}` },
    { name: 'البريد', icon: Mail, color: 'text-orange-600 bg-orange-500/10', href: `mailto:?subject=${enc(station.name)}&body=${enc(text + '\n' + url)}` },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success('تم نسخ رابط المحطة بنجاح');
    } catch {
      toast.error('تعذر النسخ');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        dir="rtl"
        className="bg-card border border-border rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-arabic font-bold text-base text-card-foreground">مشاركة المحطة</h3>
            <p className="text-xs text-muted-foreground font-arabic mt-0.5 truncate max-w-[260px]">{station.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 p-5">
          {targets.map((t) => (
            <a
              key={t.name}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setTimeout(onClose, 300)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${t.color} group-hover:scale-110 transition-transform`}>
                <t.icon className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-arabic text-card-foreground">{t.name}</span>
            </a>
          ))}
          <button onClick={handleCopy} className="flex flex-col items-center gap-1.5 group">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <Link2 className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-arabic text-card-foreground">نسخ الرابط</span>
          </button>
        </div>

        <div className="px-5 pb-5">
          <div className="bg-muted rounded-lg px-3 py-2 text-[11px] font-english truncate text-muted-foreground" dir="ltr">{url}</div>
        </div>
      </div>
    </div>
  );
}
