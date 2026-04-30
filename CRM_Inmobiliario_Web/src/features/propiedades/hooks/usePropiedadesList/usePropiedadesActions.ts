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
    setOpenDropdownId(null);
    const propiedad = propiedades.find(p => p.id === id);
    if (!propiedad || propiedad.estadoComercial === nuevoEstado) return;

    if ((nuevoEstado === 'Vendida' || nuevoEstado === 'Alquilada') && !confirmed) {
      setClosingPropiedad({ propiedad, nuevoEstado });
      return;
    }

    if ((nuevoEstado === 'Disponible' || nuevoEstado === 'Inactiva') && (propiedad.estadoComercial === 'Vendida' || propiedad.estadoComercial === 'Alquilada') && !confirmed) {
      setShowReversionModal({ type: 'status', id, targetStatus: nuevoEstado });
      return;
    }

    if (nuevoEstado === 'Inactiva' && !confirmed && propiedad.estadoComercial !== 'Vendida' && propiedad.estadoComercial !== 'Alquilada') {
      setStatusConfirmation({ id, nuevoEstado });
      return;
    }

    setStatusConfirmation(null);
    setClosingPropiedad(null);
    const optimisticData = propiedades.map(p => p.id === id ? { ...p, estadoComercial: nuevoEstado } : p);

    if (!confirmed) {
      try {
        setUpdatingId(id);
        await mutate(actualizarEstadoPropiedad(id, nuevoEstado).then(() => optimisticData), {
          optimisticData,
          rollbackOnError: true,
          revalidate: true
        });
        toast.success(`Inmueble marcado como ${nuevoEstado}`);
        globalMutate('/dashboard/kpis');
        globalMutate((key: unknown) => typeof key === 'string' && key.startsWith('/analitica/'));
      } catch (error) {
        const err = error as { response?: { data?: { message?: string } } };
        if (nuevoEstado === 'Reservada' && (propiedad.estadoComercial === 'Vendida' || propiedad.estadoComercial === 'Alquilada')) {
            toast.error("Acción no permitida", {
                description: "Debe primero cambiar la propiedad a Disponible antes de reservarla."
            });
        } else {
            toast.error(err.response?.data?.message || 'No se pudo actualizar el estado.');
        }
      } finally {
        setUpdatingId(null);
      }
      return;
    }

    let isCancelled = false;
    const isReversion = (nuevoEstado === 'Disponible' || nuevoEstado === 'Inactiva') && (propiedad.estadoComercial === 'Vendida' || propiedad.estadoComercial === 'Alquilada');

    const commitStatusChange = async () => {
      if (isCancelled) return;

      try {
        setUpdatingId(id);
        await actualizarEstadoPropiedad(id, nuevoEstado);
        if (nuevoEstado === 'Vendida' || nuevoEstado === 'Inactiva') {
            await limpiarImagenesPropiedad(id);
        }
        mutate();
        globalMutate('/dashboard/kpis');
        globalMutate((key: unknown) => typeof key === 'string' && key.startsWith('/analitica/'));
        toast.success(isReversion ? "Cierre revertido con éxito" : `Propiedad "${propiedad.titulo}" actualizada y depurada.`);
      } catch {
        toast.error("Error al procesar el cambio de estado.");
      } finally {
        setUpdatingId(null);
      }
    };

    toast.warning(isReversion ? "Revirtiendo Cierre" : `Estado: ${nuevoEstado}`, {
      description: isReversion 
        ? "El cliente volverá a En Negociación. Tienes 5 segundos para deshacer."
        : "La galería ha sido depurada. Tienes 5 segundos para deshacer.",
      action: {
        label: "Deshacer",
        onClick: () => {
          isCancelled = true;
          mutate();
          toast.success("Acción cancelada");
        },
      },
      duration: 6000,
      onAutoClose: commitStatusChange,
      onDismiss: commitStatusChange
    });
    
    mutate(optimisticData, false);
  };

  const handleClosingConfirm = async (precioCierre: number, cerradoConId: string, tipoCierre: string, closingPropiedad: { propiedad: Propiedad; nuevoEstado: string } | null) => {
    if (!closingPropiedad) return;
    const { propiedad } = closingPropiedad;
    
    try {
      setUpdatingId(propiedad.id);
      await actualizarEstadoPropiedad(propiedad.id, tipoCierre, precioCierre, cerradoConId);
      if (tipoCierre === 'Vendida') {
        await limpiarImagenesPropiedad(propiedad.id);
      }
      await mutate();
      globalMutate('/dashboard/kpis');
      globalMutate((key: unknown) => typeof key === 'string' && key.startsWith('/analitica/'));
      toast.success(`Propiedad ${tipoCierre === 'Vendida' ? 'vendida' : 'alquilada'} con éxito`);
    } catch (error) {
      console.error('Error al cerrar:', error);
      throw error;
    } finally {
      setUpdatingId(null);
      setClosingPropiedad(null);
    }
  };

  const handleRelistPropiedad = async (id: string, reason: string, type: 'Relist' | 'Cancel') => {
    const propiedad = propiedades.find(p => p.id === id);
    if (!propiedad) return;

    let isCancelled = false;
    const commitRelist = async () => {
      if (isCancelled) return;
      try {
        setUpdatingId(id);
        await relistPropiedad(id, reason, type);
        mutate();
        toast.success(type === 'Relist' ? "Nuevo ciclo comercial iniciado" : "Operación cancelada con éxito");
        globalMutate('/dashboard/kpis');
        globalMutate((key: unknown) => typeof key === 'string' && key.startsWith('/analitica/'));
      } catch {
        toast.error(type === 'Relist' ? "Error al relistar" : "Error al cancelar la operación");
      } finally {
        setUpdatingId(null);
      }
    };

    if (type === 'Relist') {
      toast.info("Relistando...", {
        description: "Se mantendrá el historial de cierre del cliente. 5s para deshacer.",
        action: { 
          label: "Deshacer", 
          onClick: () => { 
            isCancelled = true; 
            toast.success("Acción cancelada"); 
          } 
        },
        duration: 5000,
        onAutoClose: commitRelist,
        onDismiss: commitRelist
      });
    } else {
      toast.warning("Anulando Operación", {
        description: "El trato se marcará como caído y el cliente revertirá a Negociación. 5s para deshacer.",
        action: { 
          label: "Deshacer", 
          onClick: () => { 
            isCancelled = true; 
            toast.success("Acción cancelada"); 
          } 
        },
        duration: 5000,
        onAutoClose: commitRelist,
        onDismiss: commitRelist
      });
    }
    
    mutate(); // Revalidación local previa
  };

  return {
    updatingId,
    handleStatusChange,
    handleClosingConfirm,
    handleRelistPropiedad
  };
};


