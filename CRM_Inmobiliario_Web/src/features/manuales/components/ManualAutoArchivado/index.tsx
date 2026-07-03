import { useState, useEffect } from 'react';
import { ManualAutoArchivadoDesktop } from './ManualAutoArchivadoDesktop';
import { ManualAutoArchivadoMobile } from './ManualAutoArchivadoMobile';

export const ManualAutoArchivado: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile ? <ManualAutoArchivadoMobile /> : <ManualAutoArchivadoDesktop />;
};
