import { ManualProductividadDesktop } from './ManualProductividadDesktop';
import { ManualProductividadMobile } from './ManualProductividadMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export function ManualProductividad() {
  const isMobile = useIsMobile();
  return (
    <>
      {isMobile ? (
        <ManualProductividadMobile />
      ) : (
        <ManualProductividadDesktop />
      )}
    </>
  );
}
