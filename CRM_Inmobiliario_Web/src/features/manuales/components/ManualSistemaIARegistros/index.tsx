import { useState, useEffect } from 'react';
import { ManualSistemaIARegistrosDesktop } from './ManualSistemaIARegistrosDesktop';
import { ManualSistemaIARegistrosMobile } from './ManualSistemaIARegistrosMobile';

export type ManualSistemaIARegistrosSection = 'all' | 'whatsapp' | 'facebook' | 'personal' | 'general';

interface Props {
  section?: ManualSistemaIARegistrosSection;
}

export const ManualSistemaIARegistros: React.FC<Props> = ({ section = 'all' }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile ? <ManualSistemaIARegistrosMobile section={section} /> : <ManualSistemaIARegistrosDesktop section={section} />;
};
