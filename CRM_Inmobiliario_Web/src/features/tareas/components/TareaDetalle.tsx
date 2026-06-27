import type { Tarea } from '../types';
import { useTareaDetalleLogic } from '../hooks/useTareaDetalleLogic';
import { TareaDetalleDesktop } from './TareaDetalleDesktop';
import { TareaDetalleMobile } from './TareaDetalleMobile';

interface Props {
  tarea: Tarea;
  onEdit: () => void;
  onCancelTask: () => void;
  onCompleteTask: () => void;
  onBack: () => void;
}

export const TareaDetalle = (props: Props) => {
  const logic = useTareaDetalleLogic(props);

  return (
    <>
      <div className="hidden lg:block h-full">
        <TareaDetalleDesktop logic={logic} />
      </div>
      <div className="block lg:hidden h-full">
        <TareaDetalleMobile logic={logic} />
      </div>
    </>
  );
};
