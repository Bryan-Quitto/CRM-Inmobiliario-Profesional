import React from 'react';
import { useConfiguracionOrganizacionLogic } from '../hooks/useConfiguracionOrganizacionLogic';
import { ConfiguracionOrganizacionDesktop } from './ConfiguracionOrganizacionDesktop';
import { ConfiguracionOrganizacionMobile } from './ConfiguracionOrganizacionMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const ConfiguracionOrganizacion: React.FC = () => {
  const logic = useConfiguracionOrganizacionLogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <ConfiguracionOrganizacionMobile logic={logic} />
      ) : (
        <ConfiguracionOrganizacionDesktop logic={logic} />
      )}
    </>
  );
};

export default ConfiguracionOrganizacion;
