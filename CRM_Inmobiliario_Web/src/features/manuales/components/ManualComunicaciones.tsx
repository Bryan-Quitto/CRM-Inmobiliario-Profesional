import { ManualComunicacionesDesktop } from './ManualComunicacionesDesktop';
import { ManualComunicacionesMobile } from './ManualComunicacionesMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const ManualComunicaciones = () => {
  const isMobile = useIsMobile();
  return (
    <div className="w-full">
      {isMobile ? (
        <ManualComunicacionesMobile />
      ) : (
        <ManualComunicacionesDesktop />
      )}
    </div>
  );
};
