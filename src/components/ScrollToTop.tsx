import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

function forceScrollTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export default function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    if (!('scrollRestoration' in window.history)) return;

    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useLayoutEffect(() => {
    forceScrollTop();

    const timeoutId = window.setTimeout(forceScrollTop, 0);
    const rafId = window.requestAnimationFrame(forceScrollTop);

    return () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(rafId);
    };
  }, [location.pathname, location.search]);

  return null;
}
