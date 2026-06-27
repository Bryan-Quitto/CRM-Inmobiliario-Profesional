import React from 'react';
import { useConfiguracionIALogic } from '../hooks/useConfiguracionIALogic';
import { ConfiguracionIADesktop } from './ConfiguracionIADesktop';
import { ConfiguracionIAMobile } from './ConfiguracionIAMobile';

export const ConfiguracionIA: React.FC = () => {
  const logic = useConfiguracionIALogic();

  return (
    <>
      <div className="hidden lg:block">
        <ConfiguracionIADesktop logic={logic} />
      </div>
      <div className="block lg:hidden">
        <ConfiguracionIAMobile logic={logic} />
      </div>
    </>
  );
};

export default ConfiguracionIA;
