import { useState, useEffect } from 'react';
import { ManualConsecuenciasPropiedadDesktop } from './ManualConsecuenciasPropiedadDesktop';
import { ManualConsecuenciasPropiedadMobile } from './ManualConsecuenciasPropiedadMobile';

export const ManualConsecuenciasPropiedad: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile ? <ManualConsecuenciasPropiedadMobile /> : <ManualConsecuenciasPropiedadDesktop />;
};
