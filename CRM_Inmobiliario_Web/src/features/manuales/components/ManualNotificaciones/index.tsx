import { useState, useEffect } from 'react';
import { ManualNotificacionesDesktop } from './ManualNotificacionesDesktop';
import { ManualNotificacionesMobile } from './ManualNotificacionesMobile';

export const ManualNotificaciones: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile ? <ManualNotificacionesMobile /> : <ManualNotificacionesDesktop />;
};
