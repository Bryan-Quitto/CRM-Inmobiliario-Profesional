import { useState, useEffect } from 'react';

export const useScrollButtons = (threshold = 300) => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show scroll to top if we've scrolled down past the threshold
      setShowScrollTop(window.scrollY > threshold);

      // Show scroll to bottom if we are not at the very bottom (with some threshold)
      const scrollPosition = window.innerHeight + window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      setShowScrollBottom(documentHeight - scrollPosition > threshold);
    };

    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Also attach to resize in case document height changes
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [threshold]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });

  return {
    showScrollTop,
    showScrollBottom,
    scrollToTop,
    scrollToBottom
  };
};
