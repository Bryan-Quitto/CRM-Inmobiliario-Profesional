import { ManualBusquedaDesktop } from './ManualBusquedaDesktop';
import { ManualBusquedaMobile } from './ManualBusquedaMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export function ManualBusqueda() {
  const isMobile = useIsMobile();
  return (
    <>
      {isMobile ? (
        <ManualBusquedaMobile />
      ) : (
        <ManualBusquedaDesktop />
      )}
    </>
  );
}
