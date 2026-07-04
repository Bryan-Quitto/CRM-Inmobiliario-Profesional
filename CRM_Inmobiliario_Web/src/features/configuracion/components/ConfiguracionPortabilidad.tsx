import React from 'react';
import { useConfiguracionPortabilidadLogic } from '../hooks/useConfiguracionPortabilidadLogic';
import ConfiguracionPortabilidadDesktop from './ConfiguracionPortabilidadDesktop';
import ConfiguracionPortabilidadMobile from './ConfiguracionPortabilidadMobile';

export const ConfiguracionPortabilidad: React.FC = () => {
  const logic = useConfiguracionPortabilidadLogic();

  return (
    <>
      <div className="hidden lg:block">
        <ConfiguracionPortabilidadDesktop logic={logic} />
      </div>
      <div className="block lg:hidden">
        <ConfiguracionPortabilidadMobile logic={logic} />
      </div>
    </>
  );
};

export default ConfiguracionPortabilidad;
