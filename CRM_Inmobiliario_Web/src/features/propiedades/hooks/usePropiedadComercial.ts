import { useState } from 'react';
import { toast } from 'sonner';
import { mutate as globalMutate } from 'swr';
import type { KeyedMutator } from 'swr';
import { actualizarEstadoPropiedad } from '../api/actualizarEstadoPropiedad';
import { relistPropiedad } from '../api/relistPropiedad';
import { limpiarImagenesPropiedad } from '../api/limpiarImagenesPropiedad';
import type { Propiedad } from '../types';
import type { PropertyTransactionResponse } from '../api/getHistorialPropiedad';

interface UsePropiedadComercialProps {
  propiedad?: Propiedad;
  mutate: KeyedMutator<Propiedad>;
  mutateHistorial: KeyedMutator<PropertyTransactionResponse[]>;
}

export const usePropiedadComercial = ({ propiedad, mutate, mutateHistorial }: UsePropiedadComercialProps) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusConfirmation, setStatusConfirmation] = useState<string | null>(null);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [closingState, setClosingState] = useState<string | undefined>(undefined);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [showReversionModal, setShowReversionModal] = useState<{ type: 'transaction' | 'status', id?: string, targetStatus?: string } | null>(null);

  const handleClosingConfirm = async (precioCierre: number, cerradoConId: string, finalStatus: string) => {
    if (!propiedad) return;

    const targetEstado = finalStatus;
    const oldEstado = propiedad.estadoComercial;

    // 1. UI OPTIMISTA: Cerramos modal y actualizamos estado visualmente DE INMEDIATO
    setIsClosingModalOpen(false);
    mutate({ ...propiedad, estadoComercial: targetEstado }, false);
    
    const toastId = toast.loading(`Procesando ${targetEstado.toLowerCase()}...`, {
      description: "Estamos registrando la transacción en segundo plano."
    });

    const executeClose = async (statusToApply: string, retryCount = 0) => {
      try {
        setIsUpdatingStatus(true);
        console.log(`[CLOSING] Iniciando proceso de cierre para ${propiedad.id} como ${statusToApply} (Intento ${retryCount + 1})`);
        
        // Ejecutar cierre en backend usando el estado EXPLÍCITO capturado al inicio
        await actualizarEstadoPropiedad(propiedad.id, statusToApply, precioCierre, cerradoConId, propiedad.version);

        // Limpieza de imágenes (solo si el estado final es Vendida)
        // Antes se basaba en operacion, ahora se basa en el estado resultante para mayor precisión
        if (statusToApply === 'Vendida') {
          await limpiarImagenesPropiedad(propiedad.id);
        }

        // Sincronizar estado final
        await mutate();
        await mutateHistorial();
        globalMutate('/propiedades'); // Invalidar caché global del listado
        
        toast.success(`Propiedad ${statusToApply.toLowerCase()} con éxito`, { id: toastId });
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error(`[CLOSING] Error en intento ${retryCount + 1}:`, error);
        
        // Revertir UI si falla y no hay más reintentos automáticos
        mutate({ ...propiedad, estadoComercial: oldEstado }, false);

        const isConflict = error.response?.status === 409;
        const errorMessage = error.response?.data?.Message || error.response?.data?.message || error.message || "Error al procesar la operación";

        toast.error(isConflict ? "Conflicto de actualización" : `Error al registrar ${statusToApply.toLowerCase()}`, {
          id: toastId,
          duration: Infinity,
          description: isConflict ? errorMessage : (retryCount >= 1 
            ? "El reintento falló. Por favor, intenta de nuevo manualmente o contacta a soporte."
            : errorMessage),
          action: isConflict ? undefined : {
            label: retryCount >= 1 ? "Entendido" : "Reintentar",
            onClick: () => {
              if (retryCount < 1) {
                executeClose(statusToApply, retryCount + 1);
              } else {
                toast.dismiss(toastId);
              }
            }
          }
        });
      } finally {
        setIsUpdatingStatus(false);
      }
    };

    // Lanzar en segundo plano (Fire and Forget) con el estado capturado
    executeClose(targetEstado);
  };

  const handleStatusChange = (nuevoEstado: string, confirmed = false) => {
    if (!propiedad || propiedad.estadoComercial === nuevoEstado) return;
    setIsStatusDropdownOpen(false);

    const esEstadoCerrado = (estado: string) => estado === 'Vendida' || estado === 'Alquilada';
    if (esEstadoCerrado(propiedad.estadoComercial) && esEstadoCerrado(nuevoEstado) && !confirmed) {
      toast.error("Transición inválida", {
        description: `La propiedad está ${propiedad.estadoComercial}. Debes pasarla a 'Disponible' (Relistar) antes de registrar una nueva operación.`
      });
      return;
    }

    if ((nuevoEstado === 'Vendida' || nuevoEstado === 'Alquilada') && !confirmed) {
      setClosingState(nuevoEstado);
      setIsClosingModalOpen(true);
      return;
    }

    if ((nuevoEstado === 'Disponible' || nuevoEstado === 'Inactiva') && (propiedad.estadoComercial === 'Vendida' || propiedad.estadoComercial === 'Alquilada') && !confirmed) {
      setShowReversionModal({ type: 'status', targetStatus: nuevoEstado });
      return;
    }

    if (nuevoEstado === 'Inactiva' && !confirmed && propiedad.estadoComercial !== 'Vendida' && propiedad.estadoComercial !== 'Alquilada') {
      setStatusConfirmation(nuevoEstado);
      return;
    }

    setStatusConfirmation(null);
    setIsClosingModalOpen(false);

    const toastId = toast.loading(`Actualizando a ${nuevoEstado}...`);

    const optimisticData = { ...propiedad, estadoComercial: nuevoEstado };
    mutate(optimisticData, false);

    const action = async () => {
      await actualizarEstadoPropiedad(propiedad.id, nuevoEstado, undefined, undefined, propiedad.version);
      if (confirmed && (nuevoEstado === 'Vendida' || nuevoEstado === 'Inactiva')) {
        await limpiarImagenesPropiedad(propiedad.id);
      }
    };

    action()
      .then(() => {
        toast.success(`Estado actualizado a ${nuevoEstado}`, { id: toastId });
        mutate();
        mutateHistorial();
        globalMutate('/propiedades'); // Invalidar caché global del listado
      })
      .catch((err: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const errorMessage = err.response?.data?.Message || err.response?.data?.message || err.message || "Error al actualizar estado";
        toast.error(errorMessage, { id: toastId });
        console.error('Error al cambiar estado:', err);
        mutate(propiedad, false); // Rollback sincrónico instantáneo
        mutate(); // Forzar revalidación
      });
  };

  const handleRelist = async (targetStatus?: string) => {
    if (!propiedad) return;
    setShowReversionModal(null);

    let isCancelled = false;
    const commitRelist = async () => {
      if (isCancelled) return;
      try {
        await relistPropiedad(propiedad.id, "Fin de contrato / Relistado natural", "Relist");
        mutate();
        mutateHistorial();
        globalMutate('/propiedades'); // Invalidar caché global del listado
        toast.success("Nuevo ciclo comercial iniciado");
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        const errorMessage = err.response?.data?.Message || err.response?.data?.message || err.message || "Error al relistar";
        toast.error(errorMessage);
        mutate(propiedad, false); // Rollback
        mutate();
      }
    };

    toast.info("Relistando...", {
      description: "Se mantendrá el historial de cierre del contacto. 5s para deshacer.",
      action: { label: "Deshacer", onClick: () => { isCancelled = true; toast.success("Acción cancelada"); } },
      duration: 5000,
      onAutoClose: commitRelist,
      onDismiss: commitRelist
    });

    mutate({ ...propiedad, estadoComercial: targetStatus || 'Disponible' }, false);
  };

  const handleCancelTransaction = async (targetStatus?: string) => {
    if (!propiedad) return;
    setShowReversionModal(null);

    let isCancelled = false;
    const commitCancel = async () => {
      if (isCancelled) return;
      try {
        await relistPropiedad(propiedad.id, "Operación anulada / Trato caído", "Cancel");
        mutate();
        mutateHistorial();
        globalMutate('/propiedades'); // Invalidar caché global del listado
        toast.success("Operación cancelada con éxito");
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        const errorMessage = err.response?.data?.Message || err.response?.data?.message || err.message || "Error al cancelar la operación";
        toast.error(errorMessage);
        mutate(propiedad, false); // Rollback
        mutate();
      }
    };

    toast.warning("Anulando Operación", {
      description: "El trato se marcará como caído y el contacto revertirá a Negociación. 5s para deshacer.",
      action: { label: "Deshacer", onClick: () => { isCancelled = true; toast.success("Acción cancelada"); } },
      duration: 5000,
      onAutoClose: commitCancel,
      onDismiss: commitCancel
    });

    mutate({ ...propiedad, estadoComercial: targetStatus || 'Disponible' }, false);
  };

  return {
    isUpdatingStatus,
    statusConfirmation,
    isClosingModalOpen,
    closingState,
    isStatusDropdownOpen,
    showReversionModal,
    setStatusConfirmation,
    setIsClosingModalOpen,
    setClosingState,
    setIsStatusDropdownOpen,
    setShowReversionModal,
    handleClosingConfirm,
    handleStatusChange,
    handleRelist,
    handleCancelTransaction
  };
};
