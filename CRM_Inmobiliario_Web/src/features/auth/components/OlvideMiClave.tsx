import React from 'react';
import { OlvideMiClaveDesktop } from './OlvideMiClaveDesktop';
import { OlvideMiClaveMobile } from './OlvideMiClaveMobile';
import { useOlvideMiClaveLogic } from '../hooks/useOlvideMiClaveLogic';

export const OlvideMiClave: React.FC = () => {
  const logic = useOlvideMiClaveLogic();

  return (
    <>
      <div className="hidden lg:block">
        <OlvideMiClaveDesktop logic={logic} />
      </div>
      <div className="block lg:hidden">
        <OlvideMiClaveMobile logic={logic} />
      </div>
    </>
  );
};
