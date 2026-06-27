import React from 'react';
import { SWRConfig } from 'swr';
import { localStorageProvider } from '../../../lib/swr';
import { useAnaliticaViewLogic } from '../hooks/useAnaliticaViewLogic';
import { AnaliticaViewDesktop } from './AnaliticaViewDesktop';
import { AnaliticaViewMobile } from './AnaliticaViewMobile';

const AnaliticaOrchestrator: React.FC = () => {
  const logic = useAnaliticaViewLogic();

  return (
    <>
      <AnaliticaViewDesktop logic={logic} />
      <AnaliticaViewMobile logic={logic} />
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
