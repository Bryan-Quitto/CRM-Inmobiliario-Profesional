import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { getAgentesCompartidos } from '../api/getAgentesCompartidos';
import { compartirContacto } from '../api/compartirContacto';
import { revocarCompartido } from '../api/revocarCompartido';
import { useGlobalMutationLock } from '@/contexts/GlobalMutationLockContext';

export const useCompartirContacto = (contactoId?: string) => {
  const { mutate: globalMutate } = useSWRConfig();
  const { withOptimisticLock } = useGlobalMutationLock();
  
  const { data: agentesCompartidos, error, isLoading, mutate } = useSWR(
    contactoId ? `/contactos/${contactoId}/compartir` : null,
    () => getAgentesCompartidos(contactoId!)
  );

  const handleCompartir = async (agenteIds: string[]) => {
    if (!contactoId) return;
    
    try {
      await withOptimisticLock(compartirContacto(contactoId, agenteIds));
      toast.success('Visibilidad compartida exitosamente');
      mutate(); // Revalidar lista local de agentes compartidos
      globalMutate('/contactos'); // Revalidar lista global de contactos por si acaso
    } catch (err) {

      toast.error('Error al compartir contacto');
      throw err;
    }
  };

  const handleRevocar = async (agenteIds: string[]) => {
    if (!contactoId) return;

    try {
      await withOptimisticLock(revocarCompartido(contactoId, agenteIds));
      toast.success('Visibilidad revocada exitosamente');
      mutate(); // Revalidar lista local
      globalMutate('/contactos');
    } catch (err) {

      toast.error('Error al revocar visibilidad');
      throw err;
    }
  };

  return {
    agentesCompartidos: agentesCompartidos || [],
    isLoading,
    isError: error,
    compartir: handleCompartir,
    revocar: handleRevocar
  };
};
