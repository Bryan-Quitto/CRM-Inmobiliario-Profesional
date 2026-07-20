import { ManualDashboardDesktop } from './ManualDashboardDesktop';
import { ManualDashboardMobile } from './ManualDashboardMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export function ManualDashboard() {
  const isMobile = useIsMobile();
  return (
    <>
      {isMobile ? (
        <ManualDashboardMobile />
      ) : (
        <ManualDashboardDesktop />
      )}
    </>
  );
}
