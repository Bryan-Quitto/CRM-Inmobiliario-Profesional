import React from 'react';

import { useCalendarioViewLogic } from '../hooks/useCalendarioViewLogic';
import { CalendarioViewDesktop } from './CalendarioViewDesktop';
import { CalendarioViewMobile } from './CalendarioViewMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

const CalendarioContent: React.FC = () => {
  const logic = useCalendarioViewLogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <CalendarioViewMobile logic={logic} />
      ) : (
        <CalendarioViewDesktop logic={logic} />
      )}
    </>
  );
};

export const CalendarioView: React.FC = () => {
  return <CalendarioContent />;
};

export default CalendarioView;
