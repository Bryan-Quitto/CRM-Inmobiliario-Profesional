import React from 'react';
import { Loader2 } from 'lucide-react';
import { useConfiguracionPerfilLogic } from '../hooks/useConfiguracionPerfilLogic';
import ConfiguracionPerfilDesktop from './ConfiguracionPerfilDesktop';
import ConfiguracionPerfilMobile from './ConfiguracionPerfilMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

const ConfiguracionPerfil: React.FC = () => {
  const logic = useConfiguracionPerfilLogic();
  const isMobile = useIsMobile();

  if (logic.isLoading || !logic.perfil) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] animate-in fade-in duration-500">
        <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Sincronizando perfil corporativo...</p>
      </div>
    );
  }

  return (
    <>
      {isMobile ? (
        <ConfiguracionPerfilMobile logic={logic} />
      ) : (
        <ConfiguracionPerfilDesktop logic={logic} />
      )}
    </>
  );
};

export default ConfiguracionPerfil;
