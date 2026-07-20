import { ConfiguracionSuscripcionesDesktop } from './ConfiguracionSuscripcionesDesktop';
import { ConfiguracionSuscripcionesMobile } from './ConfiguracionSuscripcionesMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const ConfiguracionSuscripciones = () => {
  const isMobile = useIsMobile();
  return (
    <>
      {isMobile ? (
        <ConfiguracionSuscripcionesMobile />
      ) : (
        <ConfiguracionSuscripcionesDesktop />
      )}
    </>
  );
};
