import { ManualBusquedaDesktop } from './ManualBusquedaDesktop';
import { ManualBusquedaMobile } from './ManualBusquedaMobile';

export function ManualBusqueda() {
  return (
    <>
      <div className="hidden lg:block">
        <ManualBusquedaDesktop />
      </div>
      <div className="block lg:hidden">
        <ManualBusquedaMobile />
      </div>
    </>
  );
}
