import { useEffect, useRef } from 'react';

/**
 * Attach an IntersectionObserver to a sentinel element to trigger callback when visible.
 * Used for infinite scrolling pagination.
 */
export function useInfiniteScroll(
  onIntersect: () => void,
  enabled: boolean = true,
  rootMargin = '600px'
) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onIntersect();
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, onIntersect, rootMargin]);
  return ref;
}
