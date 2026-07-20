import React from 'react';
import { OlvideMiClaveDesktop } from './OlvideMiClaveDesktop';
import { OlvideMiClaveMobile } from './OlvideMiClaveMobile';
import { useOlvideMiClaveLogic } from '../hooks/useOlvideMiClaveLogic';
import { useIsMobile } from '@/hooks/useIsMobile';

export const OlvideMiClave: React.FC = () => {
  const logic = useOlvideMiClaveLogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <OlvideMiClaveMobile logic={logic} />
      ) : (
        <OlvideMiClaveDesktop logic={logic} />
      )}
    </>
  );
};
