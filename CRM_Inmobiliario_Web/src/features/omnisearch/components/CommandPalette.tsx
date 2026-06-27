import React from 'react';
import { useCommandPaletteLogic } from '../hooks/useCommandPaletteLogic';
import { CommandPaletteDesktop } from './CommandPaletteDesktop';
import { CommandPaletteMobile } from './CommandPaletteMobile';

export const CommandPalette: React.FC = () => {
  const logic = useCommandPaletteLogic();

  return (
    <>
      <CommandPaletteDesktop logic={logic} />
      <CommandPaletteMobile logic={logic} />
    </>
  );
};
