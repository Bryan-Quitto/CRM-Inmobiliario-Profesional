import React from 'react';

import { useDashboardPrincipalLogic } from '../hooks/useDashboardPrincipalLogic';
import { DashboardPrincipalDesktop } from './DashboardPrincipalDesktop';
import { DashboardPrincipalMobile } from './DashboardPrincipalMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

const DashboardContent: React.FC = () => {
  const logic = useDashboardPrincipalLogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <DashboardPrincipalMobile logic={logic} />
      ) : (
        <DashboardPrincipalDesktop logic={logic} />
      )}
    </>
  );
};

export const DashboardPrincipal: React.FC = () => {
  return <DashboardContent />;
};
