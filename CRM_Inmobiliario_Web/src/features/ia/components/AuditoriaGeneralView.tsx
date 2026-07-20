import React from 'react';
import { useAuditoriaGeneralViewLogic } from '../hooks/useAuditoriaGeneralViewLogic';
import { AuditoriaGeneralViewDesktop } from './AuditoriaGeneralViewDesktop';
import { AuditoriaGeneralViewMobile } from './AuditoriaGeneralViewMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const AuditoriaGeneralView: React.FC = () => {
  const logic = useAuditoriaGeneralViewLogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <AuditoriaGeneralViewMobile logic={logic} />
      ) : (
        <AuditoriaGeneralViewDesktop logic={logic} />
      )}
    </>
  );
};

export default AuditoriaGeneralView;
