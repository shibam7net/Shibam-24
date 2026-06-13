import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('shibam-theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('shibam-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('shibam-theme', 'light');
    }
  }, [isDark]);

  return { isDark, toggle: () => setIsDark(p => !p) };
}
