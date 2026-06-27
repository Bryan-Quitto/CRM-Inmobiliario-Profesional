import React from 'react';
import { useConfiguracionSeguridadLogic } from '../hooks/useConfiguracionSeguridadLogic';
import { ConfiguracionSeguridadDesktop } from './ConfiguracionSeguridadDesktop';
import { ConfiguracionSeguridadMobile } from './ConfiguracionSeguridadMobile';

export const ConfiguracionSeguridad: React.FC = () => {
  const logic = useConfiguracionSeguridadLogic();

  return (
    <>
      <div className="hidden lg:block">
        <ConfiguracionSeguridadDesktop logic={logic} />
      </div>
      <div className="block lg:hidden">
        <ConfiguracionSeguridadMobile logic={logic} />
      </div>
    </>
  );
};

export default ConfiguracionSeguridad;
