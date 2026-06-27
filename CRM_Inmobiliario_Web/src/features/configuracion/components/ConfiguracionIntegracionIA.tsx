import React from 'react';
import { useConfiguracionIntegracionIALogic } from '../hooks/useConfiguracionIntegracionIALogic';
import { ConfiguracionIntegracionIAAuth } from './ConfiguracionIntegracionIAShared';
import { ConfiguracionIntegracionIADesktop } from './ConfiguracionIntegracionIADesktop';
import { ConfiguracionIntegracionIAMobile } from './ConfiguracionIntegracionIAMobile';

export const ConfiguracionIntegracionIA: React.FC = () => {
  const logic = useConfiguracionIntegracionIALogic();

  if (!logic.isAuthenticated) {
    return <ConfiguracionIntegracionIAAuth logic={logic} />;
  }

  return (
    <>
      <ConfiguracionIntegracionIADesktop logic={logic} />
      <ConfiguracionIntegracionIAMobile logic={logic} />
    </>
  );
};

export default ConfiguracionIntegracionIA;
