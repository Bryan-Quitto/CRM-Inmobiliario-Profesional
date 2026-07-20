import React from 'react';
import { useConfiguracionSeguridadLogic } from '../hooks/useConfiguracionSeguridadLogic';
import { ConfiguracionSeguridadDesktop } from './ConfiguracionSeguridadDesktop';
import { ConfiguracionSeguridadMobile } from './ConfiguracionSeguridadMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const ConfiguracionSeguridad: React.FC = () => {
  const logic = useConfiguracionSeguridadLogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <ConfiguracionSeguridadMobile logic={logic} />
      ) : (
        <ConfiguracionSeguridadDesktop logic={logic} />
      )}
    </>
  );
};

export default ConfiguracionSeguridad;
