import React from 'react';
import { SWRConfig } from 'swr';
import { localStorageProvider } from '@/lib/swr';
import { useDashboardPrincipalLogic } from '../hooks/useDashboardPrincipalLogic';
import { DashboardPrincipalDesktop } from './DashboardPrincipalDesktop';
import { DashboardPrincipalMobile } from './DashboardPrincipalMobile';

const DashboardContent: React.FC = () => {
  const logic = useDashboardPrincipalLogic();

  return (
    <>
      <div className="hidden lg:block">
        <DashboardPrincipalDesktop logic={logic} />
      </div>
      <div className="block lg:hidden">
        <DashboardPrincipalMobile logic={logic} />
      </div>
    </>
  );
};

export const DashboardPrincipal: React.FC = () => {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      <DashboardContent />
    </SWRConfig>
  );
};
