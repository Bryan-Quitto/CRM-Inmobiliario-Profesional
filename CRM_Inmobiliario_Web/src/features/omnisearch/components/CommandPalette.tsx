import React from 'react';
import { useCommandPaletteLogic } from '../hooks/useCommandPaletteLogic';
import { CommandPaletteDesktop } from './CommandPaletteDesktop';
import { CommandPaletteMobile } from './CommandPaletteMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const CommandPalette: React.FC = () => {
  const logic = useCommandPaletteLogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <CommandPaletteMobile logic={logic} />
      ) : (
        <CommandPaletteDesktop logic={logic} />
      )}
    </>
  );
};
