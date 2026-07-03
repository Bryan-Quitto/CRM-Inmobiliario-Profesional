import { useState, useEffect } from 'react';
import { ManualIADesktop } from './ManualIADesktop';
import { ManualIAMobile } from './ManualIAMobile';

export type ManualIASection = 'all' | 'personal' | 'whatsapp' | 'facebook';

interface ManualIAProps {
  section?: ManualIASection;
}

export const ManualIA: React.FC<ManualIAProps> = ({ section = 'all' }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile ? <ManualIAMobile section={section} /> : <ManualIADesktop section={section} />;
};
