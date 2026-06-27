import React from 'react';
import { useConfiguracionAgenciasLogic } from '../hooks/useConfiguracionAgenciasLogic';
import { ConfiguracionAgenciasDesktop } from './ConfiguracionAgenciasDesktop';
import { ConfiguracionAgenciasMobile } from './ConfiguracionAgenciasMobile';

export const ConfiguracionAgencias: React.FC = () => {
  const logic = useConfiguracionAgenciasLogic();

  return (
    <>
      <div className="hidden lg:block">
        <ConfiguracionAgenciasDesktop logic={logic} />
      </div>
      <div className="block lg:hidden">
        <ConfiguracionAgenciasMobile logic={logic} />
      </div>
    </>
  );
};

export default ConfiguracionAgencias;
