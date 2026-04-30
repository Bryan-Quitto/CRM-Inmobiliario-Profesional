import { useState } from 'react';
import { toast } from 'sonner';
import type { KeyedMutator } from 'swr';
import { establecerImagenPrincipal } from '../api/establecerImagenPrincipal';
import { deleteImagenPropiedad } from '../api/deleteImagenPropiedad';
import { deleteImagenesSeleccionadas } from '../api/deleteImagenesSeleccionadas';
import { crearSeccion } from '../api/crearSeccion';
import { eliminarSeccion } from '../api/eliminarSeccion';
import { actualizarSeccion } from '../api/actualizarSeccion';
import { reordenarSecciones } from '../api/reordenarSecciones';
import { limpiarImagenesPropiedad } from '../api/limpiarImagenesPropiedad';
import type { Propiedad, SeccionGaleria } from '../types';

interface UsePropiedadGalleryProps {
  id: string;
  propiedad?: Propiedad;
  mutate: KeyedMutator<Propiedad>;
  onCoverUpdated?: (newUrl: string) => void;
}

export const usePropiedadGallery = ({ id, propiedad, mutate, onCoverUpdated }: UsePropiedadGalleryProps) => {
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [isReordering, setIsReordering] = useState(false);

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

    mutate((prev: Propiedad | undefined) => {
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

    mutate((prev: Propiedad | undefined) => {
      if (!prev) return prev;
      return {
        ...prev,
        secciones: [...(prev.secciones || []), nuevaSeccionTemp]
      };
    }, false);

    try {
      setIsAddingSection(true);
      const nuevaSeccionReal = await crearSeccion(id, nombreNuevaSeccion, orden);

      mutate((prev: Propiedad | undefined) => {
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
      mutate((prev: Propiedad | undefined) => prev ? { ...prev, secciones: previousSecciones } : prev, false);
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
        mutate((prev: Propiedad | undefined) => prev ? { ...prev, secciones: previousSecciones } : prev, false);
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

    mutate((prev: Propiedad | undefined) => {
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
        mutate((prev: Propiedad | undefined) => prev ? { ...prev, ...previousState } : prev, false);
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

    mutate((prev: Propiedad | undefined) => {
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

    mutate((prev: Propiedad | undefined) => {
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
      mutate((prev: Propiedad | undefined) => prev ? { ...prev, secciones: seccionesOriginales } : prev, false);
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

  return {
    isAddingSection,
    isCreatingInline,
    newSectionName,
    isReordering,
    setNewSectionName,
    setIsCreatingInline,
    handleSetCover,
    handleDeleteMedia,
    handleAddSection,
    handleConfirmAddSection,
    handleDeleteSection,
    handleRenameSection,
    handleClearGallery,
    handleReorder,
    handleMoveSection
  };
};
