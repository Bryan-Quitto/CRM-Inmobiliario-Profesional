import { ManualAnaliticaDesktop } from './ManualAnaliticaDesktop';
import { ManualAnaliticaMobile } from './ManualAnaliticaMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export function ManualAnalitica() {
  const isMobile = useIsMobile();
  return (
    <>
      {isMobile ? (
        <ManualAnaliticaMobile />
      ) : (
        <ManualAnaliticaDesktop />
      )}
    </>
  );
}
