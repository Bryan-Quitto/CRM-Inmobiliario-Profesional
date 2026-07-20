import type { Tarea } from '../types';
import { useTareaDetalleLogic } from '../hooks/useTareaDetalleLogic';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { TareaDetalleDesktop } from './TareaDetalleDesktop';
import { TareaDetalleMobile } from './TareaDetalleMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

interface Props {
  tarea: Tarea;
  onEdit: () => void;
  onCancelTask: () => void;
  onCompleteTask: () => void;
  onBack: () => void;
}

export const TareaDetalle = (props: Props) => {
  const { canWrite } = useSubscriptionGuard();

  const handleAction = (action: () => void) => {
    if (!canWrite) {
      import('sonner').then(({ toast }) => toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.'));
      return;
    }
    action();
  };

  const logic = useTareaDetalleLogic({
    ...props,
    onEdit: () => handleAction(props.onEdit),
    onCancelTask: () => handleAction(props.onCancelTask),
    onCompleteTask: () => handleAction(props.onCompleteTask)
  });

  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <TareaDetalleMobile logic={logic} />
      ) : (
        <TareaDetalleDesktop logic={logic} />
      )}
    </>
  );
};
