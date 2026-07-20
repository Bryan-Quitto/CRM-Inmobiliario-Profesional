import React from 'react';
import { ActualizarClaveDesktop } from './ActualizarClaveDesktop';
import { ActualizarClaveMobile } from './ActualizarClaveMobile';
import { useActualizarClaveLogic } from '../hooks/useActualizarClaveLogic';
import { useIsMobile } from '@/hooks/useIsMobile';

export const ActualizarClave: React.FC = () => {
  const logic = useActualizarClaveLogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <ActualizarClaveMobile logic={logic} />
      ) : (
        <ActualizarClaveDesktop logic={logic} />
      )}
    </>
  );
};
