import React from 'react';
import { useAuditoriaGeneralViewLogic } from '../hooks/useAuditoriaGeneralViewLogic';
import { AuditoriaGeneralViewDesktop } from './AuditoriaGeneralViewDesktop';
import { AuditoriaGeneralViewMobile } from './AuditoriaGeneralViewMobile';

export const AuditoriaGeneralView: React.FC = () => {
  const logic = useAuditoriaGeneralViewLogic();

  return (
    <>
      <div className="hidden lg:block h-full">
        <AuditoriaGeneralViewDesktop logic={logic} />
      </div>
      <div className="block lg:hidden h-full">
        <AuditoriaGeneralViewMobile logic={logic} />
      </div>
    </>
  );
};

export default AuditoriaGeneralView;
