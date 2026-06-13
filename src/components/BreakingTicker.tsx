import { useEffect } from 'react';

interface BreakingTickerProps {
  items: string[];
  isArabic?: boolean;
}

export default function BreakingTicker({ items, isArabic = true }: BreakingTickerProps) {
  if (items.length === 0) return null;

  return (
    <div className="bg-ticker text-ticker-foreground overflow-hidden">
      <div className="container mx-auto flex items-center">
        <div className="flex-shrink-0 bg-primary px-4 py-2 font-bold text-sm z-10" dir={isArabic ? 'rtl' : 'ltr'}>
          <span className={isArabic ? 'font-arabic' : 'font-english'}>
            {isArabic ? '⚡ عاجل' : '⚡ BREAKING'}
          </span>
        </div>
        <div className="flex-1 overflow-hidden py-2">
          <div className={isArabic ? 'ticker-scroll-rtl' : 'ticker-scroll'}>
            <span className={`whitespace-nowrap text-sm ${isArabic ? 'font-arabic' : 'font-english'}`}>
              {items.join('  ●  ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
