import { useState, useEffect } from 'react';
import { ManualConsecuenciasContactoDesktop } from './ManualConsecuenciasContactoDesktop';
import { ManualConsecuenciasContactoMobile } from './ManualConsecuenciasContactoMobile';

export const ManualConsecuenciasContacto: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile ? <ManualConsecuenciasContactoMobile /> : <ManualConsecuenciasContactoDesktop />;
};
