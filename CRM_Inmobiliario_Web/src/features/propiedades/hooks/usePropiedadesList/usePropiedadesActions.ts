import { useState } from 'react';
import { toast } from 'sonner';
import type { KeyedMutator, ScopedMutator } from 'swr';
import { actualizarEstadoPropiedad } from '../../api/actualizarEstadoPropiedad';
import { limpiarImagenesPropiedad } from '../../api/limpiarImagenesPropiedad';
import { relistPropiedad } from '../../api/relistPropiedad';
import type { Propiedad } from '../../types';

interface UsePropiedadesActionsProps {
  propiedades: Propiedad[];
  mutate: KeyedMutator<Propiedad[]>;
  globalMutate: ScopedMutator;
  setOpenDropdownId: (id: string | null) => void;
  setClosingPropiedad: (val: { propiedad: Propiedad; nuevoEstado: string } | null) => void;
  setShowReversionModal: (val: { type: 'status', id: string, targetStatus: string } | null) => void;
  setStatusConfirmation: (val: { id: string; nuevoEstado: string } | null) => void;
}

export const usePropiedadesActions = ({
  propiedades,
  mutate,
  globalMutate,
  setOpenDropdownId,
  setClosingPropiedad,
  setShowReversionModal,
  setStatusConfirmation
}: UsePropiedadesActionsProps) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, nuevoEstado: string, confirmed = false) => {
    console.log(`[DEBUG] handleStatusChange: id=${id}, nuevoEstado=${nuevoEstado}, confirmed=${confirmed}`);
    
    const propiedad = propiedades.find(p => p.id === id);
    if (!propiedad) {
      console.error("[DEBUG] Propiedad no encontrada");
      return;
    }
    
    if (propiedad.estadoComercial === nuevoEstado) return;

    // 1. Validaciones y Modales de flujo
    if ((propiedad.estadoComercial === 'Vendida' || propiedad.estadoComercial === 'Alquilada') && 
        (nuevoEstado === 'Vendida' || nuevoEstado === 'Alquilada') && 
        !confirmed) {
      setOpenDropdownId(null);
      toast.error('Acción no permitida', {
        description: 'Debes cambiar la propiedad a "Disponible" para cerrar el ciclo anterior antes de registrar una nueva transacción.'
      });
      return;
    }

    if ((nuevoEstado === 'Vendida' || nuevoEstado === 'Alquilada') && !confirmed) {
      setOpenDropdownId(null);
      setClosingPropiedad({ propiedad, nuevoEstado });
      return;
    }

    if ((propiedad.estadoComercial === 'Vendida' || propiedad.estadoComercial === 'Alquilada') && !confirmed) {
      setOpenDropdownId(null);
      setShowReversionModal({ type: 'status', id, targetStatus: nuevoEstado });
      return;
    }

    if (nuevoEstado === 'Inactiva' && !confirmed && propiedad.estadoComercial !== 'Vendida' && propiedad.estadoComercial !== 'Alquilada') {
      setOpenDropdownId(null);
      setStatusConfirmation({ id, nuevoEstado });
      return;
    }

    // 2. Ejecución de cambio
    setStatusConfirmation(null);
    setClosingPropiedad(null);
    setOpenDropdownId(null);

    const optimisticData = propiedades.map(p => p.id === id ? { ...p, estadoComercial: nuevoEstado } : p);

    if (!confirmed) {
      const toastId = toast.loading(`Cambiando a ${nuevoEstado}...`);
      setUpdatingId(id);
      
      try {
        await actualizarEstadoPropiedad(id, nuevoEstado, undefined, undefined, propiedad.version);
        
        await mutate(optimisticData, {
          optimisticData,
          rollbackOnError: true,
          revalidate: true
        });
        
        toast.success(`Inmueble marcado como ${nuevoEstado}`, { id: toastId });
        globalMutate('/dashboard/kpis');
        globalMutate((key: unknown) => typeof key === 'string' && key.startsWith('/analitica/'));
      } catch (error) {
        console.error(`[DEBUG] Error al cambiar estado:`, error);
        toast.error('No se pudo actualizar el estado', { id: toastId });
        mutate();
      } finally {
        setUpdatingId(null);
      }
      return;
    }

    // 3. Flujo de Reversión (con Undo Pattern)
    let isCancelled = false;
    const isReversion = (nuevoEstado === 'Disponible' || nuevoEstado === 'Inactiva') && (propiedad.estadoComercial === 'Vendida' || propiedad.estadoComercial === 'Alquilada');

    const commitStatusChange = async () => {
      if (isCancelled) return;
      setUpdatingId(id);
      try {
        await actualizarEstadoPropiedad(id, nuevoEstado, undefined, undefined, propiedad.version);
        if (nuevoEstado === 'Vendida' || nuevoEstado === 'Inactiva') {
            await limpiarImagenesPropiedad(id);
        }
        await mutate();
        globalMutate('/dashboard/kpis');
        globalMutate((key: unknown) => typeof key === 'string' && key.startsWith('/analitica/'));
        toast.success(isReversion ? "Cierre revertido" : `Propiedad actualizada`);
      } catch {
        toast.error("Error al procesar el cambio");
        mutate();
      } finally {
        setUpdatingId(null);
      }
    };

    toast.warning(isReversion ? "Revirtiendo Cierre" : `Estado: ${nuevoEstado}`, {
      description: "Tienes 5 segundos para deshacer.",
      action: {
        label: "Deshacer",
        onClick: () => {
          isCancelled = true;
          mutate();
          toast.success("Acción cancelada");
        },
      },
      duration: 5500,
      onAutoClose: commitStatusChange,
      onDismiss: commitStatusChange
    });
    
    mutate(optimisticData, false);
  };

  const handleClosingConfirm = async (precioCierre: number, cerradoConId: string, tipoCierre: string, closingPropiedad: { propiedad: Propiedad; nuevoEstado: string } | null) => {
    if (!closingPropiedad) return;
    const { propiedad } = closingPropiedad;
    
    const targetEstado = tipoCierre;

    setClosingPropiedad(null);
    const optimisticData = propiedades.map(p => p.id === propiedad.id ? { ...p, estadoComercial: targetEstado } : p);
    mutate(optimisticData, false);
    
    const toastId = toast.loading(`Procesando ${targetEstado.toLowerCase()}...`);

    const executeClose = async (statusToApply: string, retryCount = 0) => {
      try {
        setUpdatingId(propiedad.id);
        await actualizarEstadoPropiedad(propiedad.id, statusToApply, precioCierre, cerradoConId, propiedad.version);

        if (statusToApply === 'Vendida') {
          await limpiarImagenesPropiedad(propiedad.id);
        }

        await mutate();
        globalMutate('/dashboard/kpis');
        globalMutate((key: unknown) => typeof key === 'string' && key.startsWith('/analitica/'));
        
        toast.success(`Propiedad ${statusToApply.toLowerCase()} con éxito`, { id: toastId });
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error(`[CLOSING] Error:`, error);
        mutate(propiedades, false);
        
        const isConflict = error.response?.status === 409;
        const errorMessage = error.response?.data?.Message || error.response?.data?.message || error.message || "Error al procesar la operación";
        
        toast.error(isConflict ? "Conflicto de actualización" : "Error al procesar", {
          id: toastId,
          description: errorMessage,
          action: isConflict ? undefined : {
            label: "Reintentar",
            onClick: () => executeClose(statusToApply, retryCount + 1)
          }
        });
      } finally {
        setUpdatingId(null);
      }
    };

    executeClose(targetEstado);
  };

  const handleRelistPropiedad = async (id: string, reason: string, type: 'Relist' | 'Cancel') => {
    const propiedad = propiedades.find(p => p.id === id);
    if (!propiedad) return;

    // CAPTURAMOS los datos ANTES de la mutación porque el backend los limpiará
    const idCliente = propiedad.cerradoConId;
    const nombreCliente = propiedad.cerradoConNombre;

    let isCancelled = false;
    const commitRelist = async () => {
      if (isCancelled) return;
      setUpdatingId(id);
      try {
        await relistPropiedad(id, reason, type);
        await mutate();
        toast.success(type === 'Relist' ? "Nuevo ciclo comercial" : "Operación cancelada");
        globalMutate('/dashboard/kpis');
        globalMutate((key: unknown) => typeof key === 'string' && key.startsWith('/analitica/'));

        // Suggestion Toast (Explicitly Bottom-Right) - Solo en Relist natural
        if (type === 'Relist' && idCliente) {
          const clienteLabel = nombreCliente ? ` para ${nombreCliente}` : '';
          toast.info("💡 Sugerencia de Seguimiento", {
            position: 'bottom-right',
            description: `El contrato ha terminado${clienteLabel}. ¿Deseas ofrecerle nuevas opciones?`,
            duration: 10000,
            action: {
              label: "Ir",
              onClick: () => window.open(`/clientes/${idCliente}`, '_blank')
            }
          });
        }
      } catch {
        toast.error("Error en la operación");
        mutate();
      } finally {
        setUpdatingId(null);
      }
    };

    toast.info(type === 'Relist' ? "Relistando..." : "Anulando Operación", {
      description: "Tienes 5 segundos para deshacer.",
      action: { 
        label: "Deshacer", 
        onClick: () => { isCancelled = true; toast.success("Acción cancelada"); } 
      },
      duration: 5000,
      onAutoClose: commitRelist,
      onDismiss: commitRelist
    });
    
    mutate(); 
  };

  return {
    updatingId,
    handleStatusChange,
    handleClosingConfirm,
    handleRelistPropiedad
  };
};
