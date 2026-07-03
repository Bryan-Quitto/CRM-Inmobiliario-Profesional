import { ManualDashboardDesktop } from './ManualDashboardDesktop';
import { ManualDashboardMobile } from './ManualDashboardMobile';

export function ManualDashboard() {
  return (
    <>
      <div className="hidden lg:block">
        <ManualDashboardDesktop />
      </div>
      <div className="block lg:hidden">
        <ManualDashboardMobile />
      </div>
    </>
  );
}
