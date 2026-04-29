import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { getPropiedadById } from '../../api/getPropiedadById';
import { actualizarEstadoPropiedad } from '../../api/actualizarEstadoPropiedad';
import { relistPropiedad } from '../../api/relistPropiedad';
import { getHistorialPropiedad, type PropertyTransactionResponse } from '../../api/getHistorialPropiedad';
import { updateTransaction } from '../../api/updateTransaction';
import { deleteTransaction } from '../../api/deleteTransaction';
import { limpiarImagenesPropiedad } from '../../api/limpiarImagenesPropiedad';
import { establecerImagenPrincipal } from '../../api/establecerImagenPrincipal';
import { deleteImagenPropiedad } from '../../api/deleteImagenPropiedad';
import { deleteImagenesSeleccionadas } from '../../api/deleteImagenesSeleccionadas';
import { crearSeccion } from '../../api/crearSeccion';
import { eliminarSeccion } from '../../api/eliminarSeccion';
import { actualizarSeccion } from '../../api/actualizarSeccion';
import { reordenarSecciones } from '../../api/reordenarSecciones';
import { swrDefaultConfig } from '@/lib/swr';
import type { Propiedad, SeccionGaleria } from '../../types';

interface UsePropiedadDetalleProps {
  id: string;
  onCoverUpdated?: (newUrl: string) => void;
}

export const usePropiedadDetalle = ({ id, onCoverUpdated }: UsePropiedadDetalleProps) => {
  const { data: propiedad, isValidating: syncing, mutate } = useSWR<Propiedad>(
    id ? `/propiedades/${id}` : null,
    () => getPropiedadById(id),
    swrDefaultConfig
  );

  const { data: historial, mutate: mutateHistorial } = useSWR(
    id ? `/propiedades/${id}/history` : null,
    () => getHistorialPropiedad(id),
    swrDefaultConfig
  );

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [statusConfirmation, setStatusConfirmation] = useState<string | null>(null);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [closingState, setClosingState] = useState<string | undefined>(undefined);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [transactionMenuOpen, setTransactionMenuOpen] = useState<string | null>(null);
  const [showReversionModal, setShowReversionModal] = useState<{ type: 'transaction' | 'status', id?: string, targetStatus?: string } | null>(null);

  const handleClosingConfirm = async (precioCierre: number, cerradoConId: string) => {
    if (!propiedad) return;
    try {
      setIsUpdatingStatus(true);
      await actualizarEstadoPropiedad(propiedad.id, propiedad.operacion === 'Alquiler' ? 'Alquilada' : 'Vendida', precioCierre, cerradoConId);

      if (propiedad.operacion !== 'Alquiler') {
        await limpiarImagenesPropiedad(propiedad.id);
      }

      await mutate();
      toast.success(`Propiedad ${propiedad.operacion === 'Alquiler' ? 'alquilada' : 'vendida'} con éxito`);
      setIsClosingModalOpen(false);
    } catch (error) {
      console.error('Error al cerrar:', error);
      throw error;
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSetCover = async (imagenId: string) => {
    if (!propiedad) return;
    try {
      await establecerImagenPrincipal(propiedad.id, imagenId);
      mutate();
      if (onCoverUpdated) {
        const principal = propiedad.mediaSinSeccion?.find(m => m.id === imagenId) ||
          propiedad.secciones?.flatMap(s => s.media).find(m => m.id === imagenId);
        if (principal) onCoverUpdated(principal.urlPublica);
      }
      toast.success('Imagen de portada actualizada');
    } catch {
      toast.error('Error al actualizar portada');
    }
  };

  const handleDeleteMedia = async (ids: string | string[]) => {
    if (!propiedad) return;
    const idsArray = Array.isArray(ids) ? ids : [ids];

    let isCancelled = false;
    const commitDelete = async () => {
      if (isCancelled) return;
      try {
        if (idsArray.length === 1) {
          await deleteImagenPropiedad(propiedad.id, idsArray[0]);
        } else {
          await deleteImagenesSeleccionadas(propiedad.id, idsArray);
        }
        mutate();
      } catch {
        toast.error("Error al eliminar del servidor");
      }
    };

    toast.warning(`${idsArray.length > 1 ? 'Imágenes eliminadas' : 'Imagen eliminada'}`, {
      description: "Tienes unos segundos para deshacer.",
      action: {
        label: "Deshacer",
        onClick: () => {
          isCancelled = true;
          mutate();
          toast.success("Eliminación cancelada");
        }
      },
      duration: 5000,
      onAutoClose: commitDelete,
      onDismiss: commitDelete
    });

    mutate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        mediaSinSeccion: prev.mediaSinSeccion?.filter(m => !idsArray.includes(m.id)),
        secciones: prev.secciones?.map(s => ({
          ...s,
          media: s.media.filter(m => !idsArray.includes(m.id))
        }))
      };
    }, false);
  };

  const handleAddSection = () => {
    setIsCreatingInline(true);
    setNewSectionName('');
  };

  const handleConfirmAddSection = async () => {
    if (!newSectionName.trim() || !propiedad) {
      setIsCreatingInline(false);
      return;
    }

    const nombreNuevaSeccion = newSectionName.trim();
    const orden = (propiedad.secciones?.length || 0) + 1;
    const previousSecciones = [...(propiedad.secciones || [])];
    const tempId = `temp-${Date.now()}`;
    const nuevaSeccionTemp: SeccionGaleria & { clientId?: string } = {
      id: tempId,
      clientId: tempId,
      nombre: nombreNuevaSeccion,
      orden: orden,
      media: []
    };

    setIsCreatingInline(false);
    setNewSectionName('');

    mutate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        secciones: [...(prev.secciones || []), nuevaSeccionTemp]
      };
    }, false);

    try {
      setIsAddingSection(true);
      const nuevaSeccionReal = await crearSeccion(id, nombreNuevaSeccion, orden);

      mutate((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          secciones: prev.secciones?.map(s =>
            s.id === tempId ? { ...nuevaSeccionReal, clientId: tempId } : s
          )
        };
      }, false);

      toast.success("Sección creada");
    } catch {
      toast.error("Error al crear sección");
      mutate((prev) => prev ? { ...prev, secciones: previousSecciones } : prev, false);
    } finally {
      setIsAddingSection(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!propiedad) return;
    const previousSecciones = [...(propiedad.secciones || [])];

    let isCancelled = false;
    const commitDelete = async () => {
      if (isCancelled) return;
      try {
        await eliminarSeccion(sectionId);
        mutate();
      } catch {
        toast.error("Error al eliminar sección del servidor");
        mutate((prev) => prev ? { ...prev, secciones: previousSecciones } : prev, false);
      }
    };

    toast.warning("Sección eliminada", {
      description: "Tienes unos segundos para deshacer.",
      action: {
        label: "Deshacer",
        onClick: () => {
          isCancelled = true;
          mutate();
          toast.success("Eliminación cancelada");
        }
      },
      duration: 5000,
      onAutoClose: commitDelete,
      onDismiss: commitDelete
    });

    mutate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        secciones: prev.secciones?.filter(s => s.id !== sectionId)
      };
    }, false);
  };

  const handleRenameSection = async (sectionId: string, nombre: string, descripcion: string | null, orden: number) => {
    try {
      await actualizarSeccion(sectionId, nombre, descripcion, orden);
      mutate();
    } catch {
      toast.error("Error al actualizar sección");
    }
  };

  const handleClearGallery = async () => {
    if (!propiedad) return;
    const previousState = {
      mediaSinSeccion: [...(propiedad.mediaSinSeccion || [])],
      secciones: [...(propiedad.secciones || [])]
    };

    let isCancelled = false;
    const commitClear = async () => {
      if (isCancelled) return;
      try {
        await limpiarImagenesPropiedad(id);
        mutate();
      } catch {
        toast.error("Error al limpiar la galería en el servidor");
        mutate((prev) => prev ? { ...prev, ...previousState } : prev, false);
      }
    };

    toast.warning("Galería depurada", {
      description: "Se han eliminado todas las fotos excepto la de portada. Tienes unos segundos para deshacer.",
      action: {
        label: "Deshacer",
        onClick: () => {
          isCancelled = true;
          mutate();
          toast.success("Limpieza cancelada");
        }
      },
      duration: 6000,
      onAutoClose: commitClear,
      onDismiss: commitClear
    });

    mutate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        mediaSinSeccion: prev.mediaSinSeccion?.filter(m => m.urlPublica === prev.imagenPortadaUrl) || [],
        secciones: []
      };
    }, false);
  };

  const handleReorder = async (nuevoOrdenIds: string[]) => {
    if (!propiedad || isReordering) return;

    setIsReordering(true);
    const toastId = toast.loading("Guardando nuevo orden...");
    const seccionesOriginales = [...(propiedad.secciones || [])];

    mutate((prev) => {
      if (!prev || !prev.secciones) return prev;
      const nuevasSecciones = nuevoOrdenIds
        .map(id => prev.secciones!.find(s => s.id === id))
        .filter(Boolean) as SeccionGaleria[];
      return { ...prev, secciones: nuevasSecciones };
    }, false);

    try {
      await reordenarSecciones(propiedad.id, nuevoOrdenIds);
      toast.success("Orden actualizado", { id: toastId });
    } catch {
      toast.error("Error al guardar el nuevo orden", { id: toastId });
      mutate((prev) => prev ? { ...prev, secciones: seccionesOriginales } : prev, false);
    } finally {
      setIsReordering(false);
    }
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down', customTargetIndex?: number) => {
    if (!propiedad?.secciones || isReordering) return;
    const newIndex = customTargetIndex !== undefined ? customTargetIndex : (direction === 'up' ? index - 1 : index + 1);
    if (newIndex < 0 || newIndex >= propiedad.secciones.length || newIndex === index) return;

    const ids = propiedad.secciones.map(s => s.id);
    const [item] = ids.splice(index, 1);
    ids.splice(newIndex, 0, item);
    handleReorder(ids);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!historial) return;
    const transaction = historial.find(t => t.id === transactionId);

    if (transaction && (transaction.transactionType === 'Sale' || transaction.transactionType === 'Rent')) {
      setShowReversionModal({ type: 'transaction', id: transactionId });
      setTransactionMenuOpen(null);
      return;
    }

    let isCancelled = false;
    const previousHistorial = [...historial];

    const commitDelete = async () => {
      if (isCancelled) return;
      try {
        await deleteTransaction(transactionId);
        mutate();
        mutateHistorial();
      } catch {
        toast.error("Error al eliminar del historial");
        mutateHistorial(previousHistorial, false);
      }
    };

    toast.warning("Registro eliminado", {
      description: "Tienes 5 segundos para deshacer.",
      action: {
        label: "Deshacer",
        onClick: () => {
          isCancelled = true;
          mutateHistorial(previousHistorial, false);
          toast.success("Acción cancelada");
        }
      },
      duration: 5000,
      onAutoClose: commitDelete,
      onDismiss: commitDelete
    });

    mutateHistorial(historial.filter(t => t.id !== transactionId), false);
    setTransactionMenuOpen(null);
  };

  const handleInlineUpdateNote = async (transaction: PropertyTransactionResponse, newNotes: string) => {
    try {
      await updateTransaction(transaction.id, {
        transactionDate: transaction.transactionDate,
        transactionType: transaction.transactionType,
        amount: transaction.amount,
        leadId: transaction.leadId,
        notes: newNotes
      });
      mutate();
      mutateHistorial();
      toast.success("Nota actualizada");
    } catch {
      toast.error("Error al actualizar la nota");
    }
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

    const optimisticData = { ...propiedad, estadoComercial: nuevoEstado };
    mutate(optimisticData, false);
    toast.success(`Estado actualizado a ${nuevoEstado}`);

    const action = async () => {
      await actualizarEstadoPropiedad(propiedad.id, nuevoEstado);
      if (confirmed && (nuevoEstado === 'Vendida' || nuevoEstado === 'Inactiva')) {
        await limpiarImagenesPropiedad(propiedad.id);
      }
    };

    action()
      .then(() => {
        mutate();
        mutateHistorial();
      })
      .catch((err) => {
        console.error('Error al cambiar estado:', err);
        mutate();
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
        toast.success("Nuevo ciclo comercial iniciado");
      } catch {
        toast.error("Error al relistar");
      }
    };

    toast.info("Relistando...", {
      description: "Se mantendrá el historial de cierre del cliente. 5s para deshacer.",
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
        toast.success("Operación cancelada con éxito");
      } catch {
        toast.error("Error al cancelar la operación");
      }
    };

    toast.warning("Anulando Operación", {
      description: "El trato se marcará como caído y el cliente revertirá a Negociación. 5s para deshacer.",
      action: { label: "Deshacer", onClick: () => { isCancelled = true; toast.success("Acción cancelada"); } },
      duration: 5000,
      onAutoClose: commitCancel,
      onDismiss: commitCancel
    });

    mutate({ ...propiedad, estadoComercial: targetStatus || 'Disponible' }, false);
  };

  return {
    propiedad,
    historial,
    syncing,
    isUpdatingStatus,
    isAddingSection,
    isCreatingInline,
    newSectionName,
    statusConfirmation,
    isClosingModalOpen,
    closingState,
    isStatusDropdownOpen,
    showEditModal,
    isReordering,
    transactionMenuOpen,
    showReversionModal,
    setNewSectionName,
    setIsCreatingInline,
    setIsStatusDropdownOpen,
    setShowEditModal,
    setTransactionMenuOpen,
    setStatusConfirmation,
    setIsClosingModalOpen,
    setClosingState,
    setShowReversionModal,
    handleClosingConfirm,
    handleSetCover,
    handleDeleteMedia,
    handleAddSection,
    handleConfirmAddSection,
    handleDeleteSection,
    handleRenameSection,
    handleClearGallery,
    handleReorder,
    handleMoveSection,
    handleDeleteTransaction,
    handleInlineUpdateNote,
    handleStatusChange,
    handleRelist,
    handleCancelTransaction,
    mutate,
    mutateHistorial
  };
};
