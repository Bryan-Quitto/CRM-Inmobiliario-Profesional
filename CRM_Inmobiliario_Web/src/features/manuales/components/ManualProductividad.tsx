import { ManualProductividadDesktop } from './ManualProductividadDesktop';
import { ManualProductividadMobile } from './ManualProductividadMobile';

export function ManualProductividad() {
  return (
    <>
      <div className="hidden lg:block">
        <ManualProductividadDesktop />
      </div>
      <div className="block lg:hidden">
        <ManualProductividadMobile />
      </div>
    </>
  );
}
