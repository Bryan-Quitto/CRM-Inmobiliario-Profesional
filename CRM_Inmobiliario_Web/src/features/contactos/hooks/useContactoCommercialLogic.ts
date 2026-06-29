import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { actualizarEstadoContacto } from '../api/actualizarEtapaContacto';
import { revertirEstadoContacto } from '../api/revertirEstadoContacto';

export const useContactoCommercialLogic = () => {
  const { mutate: globalMutate } = useSWRConfig();

  const cambiarEstado = async (
    id: string, 
    nuevoEstado: string, 
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
      
      await actualizarEstadoContacto(
        id, 
        nuevoEstado, 
        confirmedData?.propiedadId, 
        confirmedData?.precioCierre, 
        confirmedData?.nuevoEstadoPropiedad, 
        tipoApi
      );
      
      toast.success(`${nombreTipo} movido a ${nuevoEstado}`);
      
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

  const revertirEstado = async (
    id: string,
    nuevoEstado: string,
    liberarPropiedades: boolean,
    options?: {
      onOptimisticUpdate?: () => void;
      onSuccess?: () => Promise<void> | void;
      onError?: () => void;
    }
  ) => {
    try {
      if (options?.onOptimisticUpdate) options.onOptimisticUpdate();

      await revertirEstadoContacto(id, nuevoEstado, liberarPropiedades);
      toast.success(`Estado revertido a ${nuevoEstado}`);
      
      if (options?.onSuccess) await options.onSuccess();

      globalMutate('/dashboard/kpis');
      globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
      globalMutate('/propiedades');
      globalMutate('/contactos');
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Error al revertir estado:', err);
      if (options?.onError) options.onError();
      const errorMessage = err.response?.data?.Message || err.response?.data?.message || err.message || 'No se pudo revertir el estado.';
      toast.error(errorMessage);
    }
  };

  return { cambiarEstado, revertirEstado };
};
