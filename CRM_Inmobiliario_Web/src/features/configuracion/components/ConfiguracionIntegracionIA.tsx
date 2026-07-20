import React from 'react';
import { useConfiguracionIntegracionIALogic } from '../hooks/useConfiguracionIntegracionIALogic';
import { ConfiguracionIntegracionIAAuth } from './ConfiguracionIntegracionIAShared';
import { ConfiguracionIntegracionIADesktop } from './ConfiguracionIntegracionIADesktop';
import { ConfiguracionIntegracionIAMobile } from './ConfiguracionIntegracionIAMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const ConfiguracionIntegracionIA: React.FC = () => {
  const logic = useConfiguracionIntegracionIALogic();
  const isMobile = useIsMobile();

  if (!logic.isAuthenticated) {
    return <ConfiguracionIntegracionIAAuth logic={logic} />;
  }

  return (
    <>
      {isMobile ? (
        <ConfiguracionIntegracionIAMobile logic={logic} />
      ) : (
        <ConfiguracionIntegracionIADesktop logic={logic} />
      )}
    </>
  );
};

export default ConfiguracionIntegracionIA;
