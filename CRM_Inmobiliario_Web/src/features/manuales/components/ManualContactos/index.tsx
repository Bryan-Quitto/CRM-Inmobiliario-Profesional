import { useState, useEffect } from 'react';
import { ManualContactosDesktop } from './ManualContactosDesktop';
import { ManualContactosMobile } from './ManualContactosMobile';

export const ManualContactos: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile ? <ManualContactosMobile /> : <ManualContactosDesktop />;
};
