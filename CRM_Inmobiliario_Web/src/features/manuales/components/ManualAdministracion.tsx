import { ManualAdministracionDesktop } from './ManualAdministracionDesktop';
import { ManualAdministracionMobile } from './ManualAdministracionMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const ManualAdministracion = () => {
  const isMobile = useIsMobile();
  return (
    <div className="w-full">
      {isMobile ? (
        <ManualAdministracionMobile />
      ) : (
        <ManualAdministracionDesktop />
      )}
    </div>
  );
};
