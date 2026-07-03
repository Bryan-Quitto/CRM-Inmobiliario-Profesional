import { ManualAnaliticaDesktop } from './ManualAnaliticaDesktop';
import { ManualAnaliticaMobile } from './ManualAnaliticaMobile';

export function ManualAnalitica() {
  return (
    <>
      <div className="hidden lg:block">
        <ManualAnaliticaDesktop />
      </div>
      <div className="block lg:hidden">
        <ManualAnaliticaMobile />
      </div>
    </>
  );
}
