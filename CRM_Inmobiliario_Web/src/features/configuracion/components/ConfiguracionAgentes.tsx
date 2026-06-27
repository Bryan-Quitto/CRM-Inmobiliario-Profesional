import React from 'react';
import { useConfiguracionAgentesLogic } from '../hooks/useConfiguracionAgentesLogic';
import { ConfiguracionAgentesDesktop } from './ConfiguracionAgentesDesktop';
import { ConfiguracionAgentesMobile } from './ConfiguracionAgentesMobile';

export const ConfiguracionAgentes: React.FC = () => {
  const logic = useConfiguracionAgentesLogic();

  return (
    <>
      <div className="hidden lg:block">
        <ConfiguracionAgentesDesktop logic={logic} />
      </div>
      <div className="block lg:hidden">
        <ConfiguracionAgentesMobile logic={logic} />
      </div>
    </>
  );
};

export default ConfiguracionAgentes;
