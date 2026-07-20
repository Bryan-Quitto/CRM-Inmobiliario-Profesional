import React from 'react';
import { useConfiguracionLayoutLogic } from '../hooks/useConfiguracionLayoutLogic';
import { ConfiguracionLayoutDesktop } from './ConfiguracionLayoutDesktop';
import { ConfiguracionLayoutMobile } from './ConfiguracionLayoutMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const ConfiguracionLayout: React.FC = () => {
  const logic = useConfiguracionLayoutLogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <ConfiguracionLayoutMobile logic={logic} />
      ) : (
        <ConfiguracionLayoutDesktop logic={logic} />
      )}
    </>
  );
};

export default ConfiguracionLayout;
