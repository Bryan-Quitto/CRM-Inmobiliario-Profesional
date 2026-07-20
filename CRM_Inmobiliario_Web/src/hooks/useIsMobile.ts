import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches;
    }
    return false;
  });

  useEffect(() => {
    // Tailwind's lg breakpoint is min-width: 1024px.
    // So mobile is anything less than 1024px.
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };
    
    // Use modern API
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}
