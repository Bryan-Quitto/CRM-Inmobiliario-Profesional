import React from 'react';
import { useConfiguracionNotificacionesLogic } from '../hooks/useConfiguracionNotificacionesLogic';
import { ConfiguracionNotificacionesDesktop } from './ConfiguracionNotificacionesDesktop';
import { ConfiguracionNotificacionesMobile } from './ConfiguracionNotificacionesMobile';

export interface ConfiguracionNotificacionesProps {
  agentId?: string;
}

export const ConfiguracionNotificaciones: React.FC<ConfiguracionNotificacionesProps> = ({ agentId }) => {
  const logic = useConfiguracionNotificacionesLogic(agentId);

  return (
    <>
      <ConfiguracionNotificacionesDesktop logic={logic} />
      <ConfiguracionNotificacionesMobile logic={logic} />
    </>
  );
};
