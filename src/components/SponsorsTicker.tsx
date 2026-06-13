import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useSponsors, type Sponsor } from '@/hooks/useSponsors';

function SponsorItem({ s, onClick, ariaHidden = false }: { s: Sponsor; onClick?: () => void; ariaHidden?: boolean }) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card/40 border border-border/40 hover:bg-card hover:-translate-y-0.5 transition-all">
      <div className="w-11 h-11 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
        <img src={s.logo_url} alt={ariaHidden ? '' : s.name} loading="lazy" decoding="async" className="w-full h-full object-contain" />
      </div>
      <div className="text-right">
        <div className="text-[13px] font-bold text-foreground font-arabic leading-tight whitespace-nowrap">{s.name}</div>
        {s.description && <div className="text-[10px] text-muted-foreground font-arabic uppercase tracking-wide whitespace-nowrap">{s.description}</div>}
      </div>
    </div>
  );
  return (
    <div className="flex-shrink-0 px-2" aria-hidden={ariaHidden || undefined}>
      <button
        type="button"
        onClick={ariaHidden ? undefined : onClick}
        title={s.name}
        tabIndex={ariaHidden ? -1 : 0}
        className="block text-start"
      >
        {inner}
      </button>
    </div>
  );
}

export default function SponsorsTicker() {
  const { data: sponsors = [] } = useSponsors(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [marqueeLayout, setMarqueeLayout] = useState({ repeatCount: 2, cycleWidth: 0 });

  useLayoutEffect(() => {
    if (sponsors.length === 0) return;

    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    let frame = 0;
    const calculate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const viewportWidth = container.clientWidth;
        const baseWidth = measure.scrollWidth;
        if (!viewportWidth || !baseWidth) return;

        const requiredCycleWidth = Math.max(viewportWidth * 2.35, viewportWidth + baseWidth + 240);
        const repeatCount = Math.max(2, Math.ceil(requiredCycleWidth / baseWidth));
        const cycleWidth = Math.ceil(baseWidth * repeatCount);

        setMarqueeLayout((prev) => (
          prev.repeatCount === repeatCount && prev.cycleWidth === cycleWidth
            ? prev
            : { repeatCount, cycleWidth }
        ));
      });
    };

    calculate();
    const observer = new ResizeObserver(calculate);
    observer.observe(container);
    observer.observe(measure);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [sponsors.length]);

  const cycle = useMemo(() => {
    if (sponsors.length === 0) return [];
    const out: Sponsor[] = [];
    for (let i = 0; i < marqueeLayout.repeatCount; i++) out.push(...sponsors);
    return out;
  }, [sponsors, marqueeLayout.repeatCount]);

  if (sponsors.length === 0) return null;

  const handleClick = (link: string | null) => {
    if (!link) return;
    if (link.startsWith('/')) window.location.href = link;
    else window.open(link, '_blank', 'noopener,noreferrer');
  };

  const duration = Math.min(120, Math.max(34, (marqueeLayout.cycleWidth || cycle.length * 180) / 72));
  const marqueeStyle = {
    animationDuration: `${duration}s`,
    '--sponsors-marquee-shift': '-33.333333%',
  } as CSSProperties;

  return (
    <div ref={containerRef} dir="ltr" className="sponsors-marquee group relative overflow-hidden py-4 my-4 rounded-xl border border-border bg-gradient-to-b from-card/40 via-card/60 to-card/40">
      <div ref={measureRef} className="invisible pointer-events-none absolute left-0 top-0 flex w-max" aria-hidden="true">
        {sponsors.map((s, idx) => (
          <SponsorItem key={`measure-${s.id}-${idx}`} s={s} ariaHidden />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
      <div className="pointer-events-none absolute inset-x-[5%] top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-[5%] bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div
        dir="ltr"
        className="sponsors-marquee-track flex w-max will-change-transform ml-0 mr-auto"
        style={marqueeStyle}
      >
        {/* Cycle A */}
        <div className="flex shrink-0">
          {cycle.map((s, idx) => (
            <SponsorItem key={`a-${s.id}-${idx}`} s={s} onClick={() => handleClick(s.link_url)} />
          ))}
        </div>
        {/* Cycle B — identical clone for seamless loop */}
        <div className="flex shrink-0" aria-hidden="true">
          {cycle.map((s, idx) => (
            <SponsorItem key={`b-${s.id}-${idx}`} s={s} ariaHidden />
          ))}
        </div>
        {/* Cycle C keeps the viewport filled even during fractional-pixel resets */}
        <div className="flex shrink-0" aria-hidden="true">
          {cycle.map((s, idx) => (
            <SponsorItem key={`c-${s.id}-${idx}`} s={s} ariaHidden />
          ))}
        </div>
      </div>
    </div>
  );
}
