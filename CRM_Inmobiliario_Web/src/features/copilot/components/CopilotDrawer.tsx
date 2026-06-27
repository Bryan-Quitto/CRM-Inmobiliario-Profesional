import React from 'react';
import { useCopilotDrawerLogic } from '../hooks/useCopilotDrawerLogic';
import { CopilotDrawerDesktop } from './CopilotDrawerDesktop';
import { CopilotDrawerMobile } from './CopilotDrawerMobile';

export const CopilotDrawer: React.FC = () => {
  const logic = useCopilotDrawerLogic();

  return (
    <>
      <CopilotDrawerDesktop logic={logic} />
      <CopilotDrawerMobile logic={logic} />
    </>
  );
};
