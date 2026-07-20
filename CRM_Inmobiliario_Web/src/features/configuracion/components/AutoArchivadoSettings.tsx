import React from 'react';
import { useAutoArchivadoSettingsLogic } from '../hooks/useAutoArchivadoSettingsLogic';
import { AutoArchivadoSettingsDesktop } from './AutoArchivadoSettingsDesktop';
import { AutoArchivadoSettingsMobile } from './AutoArchivadoSettingsMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const AutoArchivadoSettings: React.FC = () => {
  const logic = useAutoArchivadoSettingsLogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <AutoArchivadoSettingsMobile logic={logic} />
      ) : (
        <AutoArchivadoSettingsDesktop logic={logic} />
      )}
    </>
  );
};
