import React from 'react';
import { useConfiguracionAgentesLogic } from '../hooks/useConfiguracionAgentesLogic';
import { ConfiguracionAgentesDesktop } from './ConfiguracionAgentesDesktop';
import { ConfiguracionAgentesMobile } from './ConfiguracionAgentesMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const ConfiguracionAgentes: React.FC = () => {
  const logic = useConfiguracionAgentesLogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <ConfiguracionAgentesMobile logic={logic} />
      ) : (
        <ConfiguracionAgentesDesktop logic={logic} />
      )}
    </>
  );
};

export default ConfiguracionAgentes;
