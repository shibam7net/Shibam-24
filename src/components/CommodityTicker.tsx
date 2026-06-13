import { useEffect, useState } from 'react';

interface CommodityPrice {
  name: string;
  nameAr: string;
  price: string;
  change: string;
  isUp: boolean;
}

const basePrices: CommodityPrice[] = [
  { name: 'Gold', nameAr: 'الذهب', price: '2,341.50', change: '+0.8%', isUp: true },
  { name: 'Silver', nameAr: 'الفضة', price: '31.24', change: '+1.2%', isUp: true },
  { name: 'Brent Oil', nameAr: 'نفط برنت', price: '82.45', change: '-0.3%', isUp: false },
  { name: 'WTI Oil', nameAr: 'نفط أمريكي', price: '78.12', change: '-0.5%', isUp: false },
  { name: 'Platinum', nameAr: 'البلاتين', price: '1,012.30', change: '+0.4%', isUp: true },
  { name: 'Copper', nameAr: 'النحاس', price: '4.52', change: '+1.1%', isUp: true },
];

export default function CommodityTicker() {
  const [prices, setPrices] = useState(basePrices);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => prev.map(p => {
        const fluctuation = (Math.random() - 0.5) * 2;
        const isUp = fluctuation > 0;
        return { ...p, change: `${isUp ? '+' : ''}${fluctuation.toFixed(1)}%`, isUp };
      }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-secondary/95 text-secondary-foreground overflow-hidden border-b border-border">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-accent px-3 py-1.5 text-accent-foreground font-bold text-xs z-10">
          <span className="font-arabic">📊 أسعار</span>
        </div>
        <div className="flex-1 overflow-hidden py-1.5">
          <div className="ticker-scroll" style={{ animationDuration: '40s' }}>
            <span className="whitespace-nowrap text-xs font-english">
              {prices.map((p, i) => (
                <span key={i}>
                  <span className="font-medium">{p.name}</span>
                  {' '}
                  <span className="opacity-80">${p.price}</span>
                  {' '}
                  <span className={p.isUp ? 'text-green-400' : 'text-red-400'}>{p.change}</span>
                  {i < prices.length - 1 && <span className="mx-3 opacity-30">|</span>}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
