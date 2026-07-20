import React from 'react';
import { SWRConfig } from 'swr';
import { localStorageProvider } from '../../../lib/swr';
import { useAnaliticaViewLogic } from '../hooks/useAnaliticaViewLogic';
import { AnaliticaViewDesktop } from './AnaliticaViewDesktop';
import { AnaliticaViewMobile } from './AnaliticaViewMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

const AnaliticaOrchestrator: React.FC = () => {
  const logic = useAnaliticaViewLogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <AnaliticaViewMobile logic={logic} />
      ) : (
        <AnaliticaViewDesktop logic={logic} />
      )}
    </>
  );
};

export const AnaliticaView: React.FC = () => {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      <AnaliticaOrchestrator />
    </SWRConfig>
  );
};
