import React from 'react';
import { useConfiguracionPortabilidadLogic } from '../hooks/useConfiguracionPortabilidadLogic';
import ConfiguracionPortabilidadDesktop from './ConfiguracionPortabilidadDesktop';
import ConfiguracionPortabilidadMobile from './ConfiguracionPortabilidadMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const ConfiguracionPortabilidad: React.FC = () => {
  const logic = useConfiguracionPortabilidadLogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <ConfiguracionPortabilidadMobile logic={logic} />
      ) : (
        <ConfiguracionPortabilidadDesktop logic={logic} />
      )}
    </>
  );
};

export default ConfiguracionPortabilidad;
