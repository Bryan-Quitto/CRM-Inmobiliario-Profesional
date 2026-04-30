import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { completarTarea } from '../api/completarTarea';
import { cancelarTarea } from '../api/cancelarTarea';
import { useTareas } from '../context/useTareas';

interface AgendaActionsDeps {
  refreshTareas: () => void;
  setView: (view: 'list' | 'create' | 'edit' | 'detail') => void;
  setSelectedTareaId: (id: string | null) => void;
  setIsConfirmingCancel: (val: boolean) => void;
}

export const useAgendaActions = ({ 
  refreshTareas, 
  setView, 
  setSelectedTareaId, 
  setIsConfirmingCancel 
}: AgendaActionsDeps) => {
  const { mutate } = useSWRConfig();
  const { updateTareaEstado } = useTareas();

  const handleCompletar = (id: string) => {
    // FIRE AND FORGET: Actualización inmediata en el contexto local
    updateTareaEstado(id, 'Completada');
    
    // Petición en background
    completarTarea(id).then(() => {
      // Revalidación proactiva de analíticas y dashboard (UPSP)
      mutate('/dashboard/kpis');
      mutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
      
      // Esperar un momento antes de revalidar para evitar flicker
      setTimeout(() => {
        refreshTareas();
      }, 1500);
    }).catch((err) => {
      console.error('Error al completar tarea en background:', err);
      toast.error('No se pudo sincronizar la tarea');
      refreshTareas(); 
    });
  };

  const handleCancelar = (selectedTareaId: string | null) => {
    if (!selectedTareaId) return;
    const id = selectedTareaId;

    // FIRE AND FORGET: UI instantánea
    updateTareaEstado(id, 'Cancelada');
    setView('list');
    setSelectedTareaId(null);
    setIsConfirmingCancel(false);
    toast.success('Tarea cancelada correctamente');

    // Background process
    cancelarTarea(id).then(() => {
      // Revalidación proactiva de analíticas y dashboard (UPSP)
      mutate('/dashboard/kpis');
      mutate(key => typeof key === 'string' && key.startsWith('/analitica/'));

      setTimeout(() => {
        refreshTareas();
      }, 1500);
    }).catch((err) => {
      console.error('Error al cancelar tarea en background:', err);
      toast.error('No se pudo sincronizar la cancelación');
      refreshTareas();
    });
  };

  return {
    handleCompletar,
    handleCancelar
  };
};
