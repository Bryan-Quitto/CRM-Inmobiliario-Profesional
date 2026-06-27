import React from 'react';
import { useAutoArchivadoSettingsLogic } from '../hooks/useAutoArchivadoSettingsLogic';
import { AutoArchivadoSettingsDesktop } from './AutoArchivadoSettingsDesktop';
import { AutoArchivadoSettingsMobile } from './AutoArchivadoSettingsMobile';

export const AutoArchivadoSettings: React.FC = () => {
  const logic = useAutoArchivadoSettingsLogic();

  return (
    <>
      <div className="hidden lg:block">
        <AutoArchivadoSettingsDesktop logic={logic} />
      </div>
      <div className="block lg:hidden w-full">
        <AutoArchivadoSettingsMobile logic={logic} />
      </div>
    </>
  );
};
