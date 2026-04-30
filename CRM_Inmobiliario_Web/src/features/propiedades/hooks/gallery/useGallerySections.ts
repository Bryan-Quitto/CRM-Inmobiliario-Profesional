import { useState } from 'react';
import { toast } from 'sonner';
import type { KeyedMutator } from 'swr';
import { crearSeccion } from '../../api/crearSeccion';
import { eliminarSeccion } from '../../api/eliminarSeccion';
import { actualizarSeccion } from '../../api/actualizarSeccion';
import type { Propiedad, SeccionGaleria } from '../../types';

interface UseGallerySectionsProps {
  id: string;
  propiedad?: Propiedad;
  mutate: KeyedMutator<Propiedad>;
}

export const useGallerySections = ({ id, propiedad, mutate }: UseGallerySectionsProps) => {
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

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

  return {
    isAddingSection,
    isCreatingInline,
    newSectionName,
    setNewSectionName,
    setIsCreatingInline,
    handleAddSection,
    handleConfirmAddSection,
    handleDeleteSection,
    handleRenameSection
  };
};
