import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { actualizarEtapaContacto } from '../api/actualizarEtapaContacto';
import { revertirEstadoContacto } from '../api/revertirEstadoContacto';

export const useContactoCommercialLogic = () => {
  const { mutate: globalMutate } = useSWRConfig();

  const cambiarEtapa = async (
    id: string, 
    nuevaEtapa: string, 
    tipo: 'contacto' | 'propietario' | 'cliente',
    confirmedData?: { propiedadId: string, precioCierre: number, nuevoEstadoPropiedad: string },
    options?: {
      onOptimisticUpdate?: () => void;
      onSuccess?: () => Promise<void> | void;
      onError?: () => void;
    }
  ) => {
    const tipoApi = tipo === 'propietario' ? 'propietario' : 'contacto';
    const nombreTipo = tipo === 'propietario' ? 'Propietario' : 'Cliente';

    try {
      if (options?.onOptimisticUpdate) options.onOptimisticUpdate();
      
      await actualizarEtapaContacto(
        id, 
        nuevaEtapa, 
        confirmedData?.propiedadId, 
        confirmedData?.precioCierre, 
        confirmedData?.nuevoEstadoPropiedad, 
        tipoApi
      );
      
      toast.success(`${nombreTipo} movido a ${nuevaEtapa}`);
      
      if (options?.onSuccess) await options.onSuccess();

      globalMutate('/dashboard/kpis');
      globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
      globalMutate('/propiedades');
      globalMutate('/contactos');
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Error al actualizar etapa:', err);
      if (options?.onError) options.onError();
      const errorMessage = err.response?.data?.Message || err.response?.data?.message || err.message || 'No se pudo sincronizar el cambio de estado.';
      toast.error(errorMessage);
    }
  };

  const revertirEtapa = async (
    id: string,
    nuevaEtapa: string,
    liberarPropiedades: boolean,
    options?: {
      onOptimisticUpdate?: () => void;
      onSuccess?: () => Promise<void> | void;
      onError?: () => void;
    }
  ) => {
    try {
      if (options?.onOptimisticUpdate) options.onOptimisticUpdate();

      await revertirEstadoContacto(id, nuevaEtapa, liberarPropiedades);
      toast.success(`Estado revertido a ${nuevaEtapa}`);
      
      if (options?.onSuccess) await options.onSuccess();

      globalMutate('/dashboard/kpis');
      globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
      globalMutate('/propiedades');
      globalMutate('/contactos');
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Error al revertir estado:', err);
      if (options?.onError) options.onError();
      toast.error('No se pudo revertir el estado');
    }
  };

  return { cambiarEtapa, revertirEtapa };
};
