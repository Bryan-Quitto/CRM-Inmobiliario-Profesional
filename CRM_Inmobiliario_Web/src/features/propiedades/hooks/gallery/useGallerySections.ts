import { useState } from 'react';
import { toast } from 'sonner';
import type { KeyedMutator } from 'swr';
import { crearSeccion } from '../../api/crearSeccion';
import { eliminarSeccion } from '../../api/eliminarSeccion';
import { actualizarSeccion } from '../../api/actualizarSeccion';
import type { Propiedad, SeccionGaleria } from '../../types';
import { usePendingOperationsStore } from '@/store/usePendingOperationsStore';

interface UseGallerySectionsProps {
  id: string;
  propiedad?: Propiedad;
  mutate: KeyedMutator<Propiedad>;
}

export const useGallerySections = ({ id, propiedad, mutate }: UseGallerySectionsProps) => {
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDesc, setNewSectionDesc] = useState('');

  const handleAddSection = () => {
    setIsCreatingInline(true);
    setNewSectionName('');
    setNewSectionDesc('');
  };

  const handleConfirmAddSection = async () => {
    if (!newSectionName.trim() || !newSectionDesc.trim() || !propiedad) {
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
      descripcion: newSectionDesc.trim(),
      orden: orden,
      media: []
    };

    setIsCreatingInline(false);
    setNewSectionName('');
    setNewSectionDesc('');

    mutate((prev: Propiedad | undefined) => {
      if (!prev) return prev;
      return {
        ...prev,
        secciones: [...(prev.secciones || []), nuevaSeccionTemp]
      };
    }, false);

    try {
      setIsAddingSection(true);
      const nuevaSeccionReal = await crearSeccion(id, nombreNuevaSeccion, newSectionDesc.trim(), orden);

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

  const handleDeleteSection = async (sectionId: string, deleteMedia: boolean = false) => {
    if (!propiedad) return;
    const previousSecciones = [...(propiedad.secciones || [])];
    const previousMediaSinSeccion = [...(propiedad.mediaSinSeccion || [])];

    const seccionAEliminar = propiedad.secciones?.find(s => s.id === sectionId);
    
    // Si deleteMedia es true, la portada (si está en esta sección) se mueve a general.
    // Si deleteMedia es false, TODAS las fotos de esta sección se mueven a general.
    const mediaToMove = seccionAEliminar 
      ? seccionAEliminar.media
          .filter(m => deleteMedia ? m.esPrincipal : true)
          .map(m => ({ ...m, sectionId: null })) 
      : [];

    let isCancelled = false;
    let isProtectionActive = true;
    usePendingOperationsStore.getState().addPendingOperation();

    const commitDelete = async () => {
      if (isProtectionActive) {
        usePendingOperationsStore.getState().removePendingOperation();
        isProtectionActive = false;
      }
      if (isCancelled) return;
      try {
        await eliminarSeccion(sectionId, deleteMedia);
        mutate();
      } catch {
        toast.error("Error al eliminar sección del servidor");
        mutate((prev: Propiedad | undefined) => prev ? { ...prev, secciones: previousSecciones, mediaSinSeccion: previousMediaSinSeccion } : prev, false);
      }
    };

    toast.success(deleteMedia ? "Sección completa eliminada" : "Sección eliminada", {
      description: deleteMedia ? "Fotos de la sección eliminadas. Tienes unos segundos para deshacer." : "Las fotos se han movido a la galería general. Tienes unos segundos para deshacer.",
      action: {
        label: "Deshacer",
        onClick: () => {
          isCancelled = true;
          mutate();
          toast.success("Eliminación cancelada");
          if (isProtectionActive) {
            usePendingOperationsStore.getState().removePendingOperation();
            isProtectionActive = false;
          }
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
        secciones: prev.secciones?.filter(s => s.id !== sectionId),
        mediaSinSeccion: [...(prev.mediaSinSeccion || []), ...mediaToMove]
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

  return {
    isAddingSection,
    isCreatingInline,
    newSectionName,
    newSectionDesc,
    setNewSectionName,
    setNewSectionDesc,
    setIsCreatingInline,
    handleAddSection,
    handleConfirmAddSection,
    handleDeleteSection,
    handleRenameSection
  };
};