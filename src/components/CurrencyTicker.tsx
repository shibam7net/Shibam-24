import { useEffect, useState } from 'react';

interface CurrencyRate {
  pair: string;
  rate: string;
  change: string;
  isUp: boolean;
}

const baseRates: CurrencyRate[] = [
  { pair: 'USD/YER', rate: '250.25', change: '+0.1%', isUp: true },
  { pair: 'EUR/USD', rate: '1.0845', change: '-0.2%', isUp: false },
  { pair: 'GBP/USD', rate: '1.2678', change: '+0.3%', isUp: true },
  { pair: 'USD/SAR', rate: '3.7500', change: '0.0%', isUp: true },
  { pair: 'USD/AED', rate: '3.6725', change: '0.0%', isUp: true },
  { pair: 'USD/EGP', rate: '48.85', change: '-0.4%', isUp: false },
  { pair: 'USD/JPY', rate: '154.32', change: '+0.5%', isUp: true },
  { pair: 'BTC/USD', rate: '67,240', change: '+2.1%', isUp: true },
];

export default function CurrencyTicker() {
  const [rates, setRates] = useState(baseRates);

  useEffect(() => {
    const interval = setInterval(() => {
      setRates(prev => prev.map(r => {
        const fluctuation = (Math.random() - 0.5) * 1.5;
        const isUp = fluctuation > 0;
        return { ...r, change: `${isUp ? '+' : ''}${fluctuation.toFixed(1)}%`, isUp };
      }));
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card/80 text-card-foreground overflow-hidden border-b border-border">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-primary px-3 py-1.5 text-primary-foreground font-bold text-xs z-10">
          <span className="font-arabic">💱 عملات</span>
        </div>
        <div className="flex-1 overflow-hidden py-1.5">
          <div className="ticker-scroll-rtl" style={{ animationDuration: '45s' }}>
            <span className="whitespace-nowrap text-xs font-english">
              {rates.map((r, i) => (
                <span key={i}>
                  <span className="font-medium">{r.pair}</span>
                  {' '}
                  <span className="opacity-80">{r.rate}</span>
                  {' '}
                  <span className={r.isUp ? 'text-green-500' : 'text-red-500'}>{r.change}</span>
                  {i < rates.length - 1 && <span className="mx-3 opacity-30">|</span>}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
