import React from 'react';
import { useConfiguracionAgenciasLogic } from '../hooks/useConfiguracionAgenciasLogic';
import { ConfiguracionAgenciasDesktop } from './ConfiguracionAgenciasDesktop';
import { ConfiguracionAgenciasMobile } from './ConfiguracionAgenciasMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const ConfiguracionAgencias: React.FC = () => {
  const logic = useConfiguracionAgenciasLogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <ConfiguracionAgenciasMobile logic={logic} />
      ) : (
        <ConfiguracionAgenciasDesktop logic={logic} />
      )}
    </>
  );
};

export default ConfiguracionAgencias;
