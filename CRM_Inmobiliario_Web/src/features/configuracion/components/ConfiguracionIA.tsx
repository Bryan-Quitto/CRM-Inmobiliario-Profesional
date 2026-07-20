import React from 'react';
import { useConfiguracionIALogic } from '../hooks/useConfiguracionIALogic';
import { ConfiguracionIADesktop } from './ConfiguracionIADesktop';
import { ConfiguracionIAMobile } from './ConfiguracionIAMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const ConfiguracionIA: React.FC = () => {
  const logic = useConfiguracionIALogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <ConfiguracionIAMobile logic={logic} />
      ) : (
        <ConfiguracionIADesktop logic={logic} />
      )}
    </>
  );
};

export default ConfiguracionIA;
