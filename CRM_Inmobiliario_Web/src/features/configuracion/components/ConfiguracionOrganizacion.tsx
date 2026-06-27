import React from 'react';
import { useConfiguracionOrganizacionLogic } from '../hooks/useConfiguracionOrganizacionLogic';
import { ConfiguracionOrganizacionDesktop } from './ConfiguracionOrganizacionDesktop';
import { ConfiguracionOrganizacionMobile } from './ConfiguracionOrganizacionMobile';

export const ConfiguracionOrganizacion: React.FC = () => {
  const logic = useConfiguracionOrganizacionLogic();

  return (
    <>
      <div className="hidden lg:block">
        <ConfiguracionOrganizacionDesktop logic={logic} />
      </div>
      <div className="block lg:hidden">
        <ConfiguracionOrganizacionMobile logic={logic} />
      </div>
    </>
  );
};

export default ConfiguracionOrganizacion;
