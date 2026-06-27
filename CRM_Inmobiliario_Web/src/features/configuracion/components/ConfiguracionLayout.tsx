import React from 'react';
import { useConfiguracionLayoutLogic } from '../hooks/useConfiguracionLayoutLogic';
import { ConfiguracionLayoutDesktop } from './ConfiguracionLayoutDesktop';
import { ConfiguracionLayoutMobile } from './ConfiguracionLayoutMobile';

export const ConfiguracionLayout: React.FC = () => {
  const logic = useConfiguracionLayoutLogic();

  return (
    <>
      <div className="hidden lg:block">
        <ConfiguracionLayoutDesktop logic={logic} />
      </div>
      <div className="block lg:hidden">
        <ConfiguracionLayoutMobile logic={logic} />
      </div>
    </>
  );
};

export default ConfiguracionLayout;
