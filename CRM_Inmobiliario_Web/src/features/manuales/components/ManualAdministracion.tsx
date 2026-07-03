import { ManualAdministracionDesktop } from './ManualAdministracionDesktop';
import { ManualAdministracionMobile } from './ManualAdministracionMobile';

export const ManualAdministracion = () => {
  return (
    <div className="w-full">
      <div className="hidden lg:block">
        <ManualAdministracionDesktop />
      </div>
      <div className="block lg:hidden">
        <ManualAdministracionMobile />
      </div>
    </div>
  );
};
