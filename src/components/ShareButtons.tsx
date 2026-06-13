import type { NewsArticle } from '@/data/mockNews';
import { shareToWhatsApp, shareToTwitter, shareToTelegram, shareToFacebook, copyLink } from '@/lib/shareUtils';
import { MessageCircle, Twitter, Send, Facebook, Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonsProps {
  article: NewsArticle;
  compact?: boolean;
}

export default function ShareButtons({ article, compact = false }: ShareButtonsProps) {
  const size = compact ? 'w-4 h-4' : 'w-5 h-5';
  const btnClass = compact
    ? 'p-1 rounded hover:bg-muted transition-colors'
    : 'p-2 rounded-lg hover:bg-muted transition-colors border border-border';

  const handleCopy = () => {
    copyLink(article);
    toast.success(article.section === 'arabic' ? 'تم نسخ الرابط' : 'Link copied!');
  };

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => shareToWhatsApp(article)} className={`${btnClass} text-green-600`} title="WhatsApp">
        <MessageCircle className={size} />
      </button>
      <button onClick={() => shareToTwitter(article)} className={btnClass} title="X (Twitter)">
        <Twitter className={size} />
      </button>
      <button onClick={() => shareToTelegram(article)} className={`${btnClass} text-blue-500`} title="Telegram">
        <Send className={size} />
      </button>
      <button onClick={() => shareToFacebook(article)} className={`${btnClass} text-blue-700`} title="Facebook">
        <Facebook className={size} />
      </button>
      <button onClick={handleCopy} className={btnClass} title="Copy Link">
        <Link2 className={size} />
      </button>
    </div>
  );
}
