import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { mutate as globalMutateSWR } from 'swr';
import { actualizarEstadoPropiedad } from '../api/actualizarEstadoPropiedad';
import { relistPropiedad } from '../api/relistPropiedad';
import { limpiarImagenesPropiedad } from '../api/limpiarImagenesPropiedad';
import type { Propiedad } from '../types';

interface CommercialLogicOptions {
  onSuccess?: () => void;
  onError?: (error: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  /** Custom optimistic update function */
  mutateOptimistic?: (nuevoEstado: string) => void;
  /** Function to force revalidation of all related data */
  revalidate: () => Promise<void>;
}

/**
 * usePropertyCommercialLogic
 * 
 * Centralized hook for property commercial lifecycle logic.
 * Follows "One Trip Pattern" and "Zero Wait Policy" standards.
 * Agnostic to List or Detail views.
 */
export const usePropertyCommercialLogic = (options: CommercialLogicOptions) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const safeRevalidate = async () => {
    if (!isMounted.current) return;
    try {
      await options.revalidate();
    } catch (e) {
      console.warn('[COMMERCIAL] Revalidation skipped or failed after unmount', e);
    }
  };

  const safeMutateOptimistic = (nuevoEstado: string) => {
    if (!isMounted.current) return;
    options.mutateOptimistic?.(nuevoEstado);
  };

  const invalidateGlobalCaches = () => {
    // Global mutate is safe even if unmounted
    globalMutateSWR('/propiedades');
    globalMutateSWR('/dashboard/kpis');
    globalMutateSWR((key: unknown) => typeof key === 'string' && key.startsWith('/analitica/'));
  };

  /**
   * handleStatusChange
   * Simple status transitions with validations and confirmations
   */
  const handleStatusChange = async (
    propiedad: Propiedad, 
    nuevoEstado: string, 
    confirmed = false,
    callbacks?: { 
      onOpenClosingModal: (estado: string) => void,
      onOpenReversionModal: (estado: string) => void,
      onOpenConfirmationModal: (estado: string) => void
    }
  ) => {
    if (propiedad.estadoComercial === nuevoEstado) return;

    const esEstadoCerrado = (estado: string) => estado === 'Vendida' || estado === 'Alquilada';
    const esCerradoOReservado = (estado: string) => esEstadoCerrado(estado) || estado === 'Reservada';
    
    if (esEstadoCerrado(propiedad.estadoComercial) && (esEstadoCerrado(nuevoEstado) || nuevoEstado === 'Reservada') && !confirmed) {
      toast.error("Transición inválida", {
        description: `La propiedad está ${propiedad.estadoComercial}. Debes pasarla a 'Disponible' antes de registrar una nueva reserva u operación.`
      });
      return;
    }

    if ((nuevoEstado === 'Vendida' || nuevoEstado === 'Alquilada' || nuevoEstado === 'Reservada') && !confirmed) {
      callbacks?.onOpenClosingModal(nuevoEstado);
      return;
    }

    if ((nuevoEstado === 'Disponible' || nuevoEstado === 'Inactiva') && esCerradoOReservado(propiedad.estadoComercial) && !confirmed) {
      callbacks?.onOpenReversionModal(nuevoEstado);
      return;
    }

    if (nuevoEstado === 'Inactiva' && !confirmed && !esCerradoOReservado(propiedad.estadoComercial)) {
      callbacks?.onOpenConfirmationModal(nuevoEstado);
      return;
    }

    const isReversion = (nuevoEstado === 'Disponible' || nuevoEstado === 'Inactiva') && esCerradoOReservado(propiedad.estadoComercial);
    
    if (isReversion) {
      await executeWithUndo(propiedad, nuevoEstado, "Reversion", "Revirtiendo cierre... El contacto volverá a Negociación.");
    } else {
      await executeDirectUpdate(propiedad, nuevoEstado);
    }
  };

  /**
   * handleClosingConfirm
   * Finalizes a sale or rental transaction
   */
  const handleClosingConfirm = async (
    propiedad: Propiedad,
    precioCierre: number | null,
    cerradoConId: string, 
    finalStatus: string
  ) => {
    const oldEstado = propiedad.estadoComercial;
    options.mutateOptimistic?.(finalStatus);
    
    const toastId = toast.loading(`Procesando ${finalStatus.toLowerCase()}...`);

    const executeClose = async (statusToApply: string, retryCount = 0) => {
      try {
        if (isMounted.current) setIsProcessing(true);
        
        await actualizarEstadoPropiedad(propiedad.id, statusToApply, precioCierre ?? undefined, cerradoConId, propiedad.version);

        if (statusToApply === 'Vendida') {
          await limpiarImagenesPropiedad(propiedad.id);
        }

        await safeRevalidate();
        invalidateGlobalCaches();
        
        // Show success toast even if unmounted
        toast.success(`Propiedad ${statusToApply.toLowerCase()} con éxito`, { id: toastId });
        
        if (isMounted.current) options.onSuccess?.();
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error(`[COMMERCIAL] Error en cierre:`, error);
        safeMutateOptimistic(oldEstado);

        const isConflict = error.response?.status === 409;
        const errorMessage = error.response?.data?.Message || error.response?.data?.message || error.message || "Error al procesar la operación";

        toast.error(isConflict ? "Conflicto de actualización" : `Error al registrar ${statusToApply.toLowerCase()}`, {
          id: toastId,
          duration: Infinity,
          description: isConflict ? errorMessage : (retryCount >= 1 
            ? "El reintento falló. Por favor, intenta de nuevo manualmente."
            : errorMessage),
          action: isConflict ? undefined : {
            label: retryCount >= 1 ? "Entendido" : "Reintentar",
            onClick: () => {
              if (retryCount < 1) executeClose(statusToApply, retryCount + 1);
              else toast.dismiss(toastId);
            }
          }
        });

        if (isMounted.current) options.onError?.(error);
      } finally {
        if (isMounted.current) setIsProcessing(false);
      }
    };

    executeClose(finalStatus);
  };

  /**
   * handleRelist
   * Standard relisting or transaction cancellation
   */
  const handleRelist = async (propiedad: Propiedad, type: 'Relist' | 'Cancel', targetStatus = 'Disponible', marcarContactoPerdido = false) => {
    const title = type === 'Relist' ? "Relistando..." : "Anulando Operación";
    const description = type === 'Relist' 
      ? "Se iniciará un nuevo ciclo. 5s para deshacer." 
      : (marcarContactoPerdido ? "El contacto se marcará como Perdido. 5s para deshacer." : "El contacto volverá a Negociación. 5s para deshacer.");

    await executeWithUndo(propiedad, targetStatus, type, description, title, marcarContactoPerdido);
  };

  // --- Private Helpers ---

  const executeDirectUpdate = async (propiedad: Propiedad, nuevoEstado: string) => {
    const toastId = toast.loading(`Actualizando a ${nuevoEstado}...`);
    safeMutateOptimistic(nuevoEstado);

    try {
      if (isMounted.current) setIsProcessing(true);
      await actualizarEstadoPropiedad(propiedad.id, nuevoEstado, undefined, undefined, propiedad.version);
      
      if (nuevoEstado === 'Inactiva' || nuevoEstado === 'Vendida') {
        await limpiarImagenesPropiedad(propiedad.id);
      }

      await safeRevalidate();
      invalidateGlobalCaches();
      
      // Global toast
      toast.success(`Estado actualizado a ${nuevoEstado}`, { id: toastId });
      
      if (isMounted.current) options.onSuccess?.();
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const errorMessage = error.response?.data?.Message || error.response?.data?.message || error.message || "Error al actualizar estado";
      toast.error(errorMessage, { id: toastId });
      safeMutateOptimistic(propiedad.estadoComercial);

      if (isMounted.current) {
        options.revalidate();
        options.onError?.(error);
      }
    } finally {
      if (isMounted.current) setIsProcessing(false);
    }
  };

  const executeWithUndo = async (
    propiedad: Propiedad, 
    targetStatus: string, 
    type: 'Relist' | 'Cancel' | 'Reversion', 
    description: string,
    title?: string,
    marcarContactoPerdido = false
  ) => {
    let isCancelled = false;
    const oldEstado = propiedad.estadoComercial;
    const idCliente = propiedad.cerradoConId;
    const nombreCliente = propiedad.cerradoConNombre;

    const commitAction = async () => {
      if (isCancelled) return;
      
      try {
        if (isMounted.current) setIsProcessing(true);
        
        if (type === 'Reversion') {
          await actualizarEstadoPropiedad(propiedad.id, targetStatus, undefined, undefined, propiedad.version);
        } else {
          await relistPropiedad(propiedad.id, type === 'Relist' ? "Relistado natural" : "Trato caído", type as 'Relist' | 'Cancel', marcarContactoPerdido);
        }

        await safeRevalidate();
        invalidateGlobalCaches();
        
        // Show success toasts globally
        toast.success(type === 'Relist' ? "Nuevo ciclo comercial" : (type === 'Cancel' ? "Operación anulada" : "Cierre revertido"));

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

        if (isMounted.current) options.onSuccess?.();
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        const errorMessage = error.response?.data?.Message || error.response?.data?.message || error.message || "Error en la operación";
        toast.error(errorMessage);
        safeMutateOptimistic(oldEstado);

        if (isMounted.current) {
          options.revalidate();
          options.onError?.(error);
        }
      } finally {
        if (isMounted.current) setIsProcessing(false);
      }
    };

    toast.warning(title || "Procesando...", {
      description,
      action: { 
        label: "Deshacer", 
        onClick: () => { 
          isCancelled = true; 
          safeMutateOptimistic(oldEstado);
          toast.success("Acción cancelada"); 
        } 
      },
      duration: 5000,
      onAutoClose: commitAction,
      onDismiss: commitAction
    });

    safeMutateOptimistic(targetStatus);
  };

  return {
    isProcessing,
    handleStatusChange,
    handleClosingConfirm,
    handleRelist
  };
};
