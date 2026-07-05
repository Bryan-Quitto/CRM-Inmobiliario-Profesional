import React from 'react';
import { ActualizarClaveDesktop } from './ActualizarClaveDesktop';
import { ActualizarClaveMobile } from './ActualizarClaveMobile';
import { useActualizarClaveLogic } from '../hooks/useActualizarClaveLogic';

export const ActualizarClave: React.FC = () => {
  const logic = useActualizarClaveLogic();

  return (
    <>
      <div className="hidden lg:block">
        <ActualizarClaveDesktop logic={logic} />
      </div>
      <div className="block lg:hidden">
        <ActualizarClaveMobile logic={logic} />
      </div>
    </>
  );
};
