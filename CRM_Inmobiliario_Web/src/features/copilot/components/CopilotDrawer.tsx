import React from 'react';
import { useCopilotDrawerLogic } from '../hooks/useCopilotDrawerLogic';
import { CopilotDrawerDesktop } from './CopilotDrawerDesktop';
import { CopilotDrawerMobile } from './CopilotDrawerMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const CopilotDrawer: React.FC = () => {
  const logic = useCopilotDrawerLogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <CopilotDrawerMobile logic={logic} />
      ) : (
        <CopilotDrawerDesktop logic={logic} />
      )}
    </>
  );
};
