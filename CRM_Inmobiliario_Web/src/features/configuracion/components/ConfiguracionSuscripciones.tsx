import { ConfiguracionSuscripcionesDesktop } from './ConfiguracionSuscripcionesDesktop';
import { ConfiguracionSuscripcionesMobile } from './ConfiguracionSuscripcionesMobile';

export const ConfiguracionSuscripciones = () => {
  return (
    <>
      <div className="hidden lg:block">
        <ConfiguracionSuscripcionesDesktop />
      </div>
      <div className="block lg:hidden">
        <ConfiguracionSuscripcionesMobile />
      </div>
    </>
  );
};
