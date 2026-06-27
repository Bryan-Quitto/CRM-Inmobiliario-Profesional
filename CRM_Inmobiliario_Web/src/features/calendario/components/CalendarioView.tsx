import React from 'react';

import { useCalendarioViewLogic } from '../hooks/useCalendarioViewLogic';
import { CalendarioViewDesktop } from './CalendarioViewDesktop';
import { CalendarioViewMobile } from './CalendarioViewMobile';

const CalendarioContent: React.FC = () => {
  const logic = useCalendarioViewLogic();

  return (
    <>
      <div className="hidden lg:block h-full">
        <CalendarioViewDesktop logic={logic} />
      </div>
      <div className="block lg:hidden h-full">
        <CalendarioViewMobile logic={logic} />
      </div>
    </>
  );
};

export const CalendarioView: React.FC = () => {
  return <CalendarioContent />;
};

export default CalendarioView;
