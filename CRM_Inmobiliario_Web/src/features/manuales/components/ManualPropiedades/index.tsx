import { useState, useEffect } from 'react';
import { ManualPropiedadesDesktop } from './ManualPropiedadesDesktop';
import { ManualPropiedadesMobile } from './ManualPropiedadesMobile';

export const ManualPropiedades: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile ? <ManualPropiedadesMobile /> : <ManualPropiedadesDesktop />;
};
