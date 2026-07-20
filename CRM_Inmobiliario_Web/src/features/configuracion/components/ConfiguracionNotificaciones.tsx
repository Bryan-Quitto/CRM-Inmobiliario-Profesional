import React from 'react';
import { useConfiguracionNotificacionesLogic } from '../hooks/useConfiguracionNotificacionesLogic';
import { ConfiguracionNotificacionesDesktop } from './ConfiguracionNotificacionesDesktop';
import { ConfiguracionNotificacionesMobile } from './ConfiguracionNotificacionesMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export interface ConfiguracionNotificacionesProps {
  agentId?: string;
}

export const ConfiguracionNotificaciones: React.FC<ConfiguracionNotificacionesProps> = ({ agentId }) => {
  const logic = useConfiguracionNotificacionesLogic(agentId);
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <ConfiguracionNotificacionesMobile logic={logic} />
      ) : (
        <ConfiguracionNotificacionesDesktop logic={logic} />
      )}
    </>
  );
};
