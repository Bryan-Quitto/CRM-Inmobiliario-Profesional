import { ManualComunicacionesDesktop } from './ManualComunicacionesDesktop';
import { ManualComunicacionesMobile } from './ManualComunicacionesMobile';

export const ManualComunicaciones = () => {
  return (
    <div className="w-full">
      <div className="hidden lg:block">
        <ManualComunicacionesDesktop />
      </div>
      <div className="block lg:hidden">
        <ManualComunicacionesMobile />
      </div>
    </div>
  );
};
