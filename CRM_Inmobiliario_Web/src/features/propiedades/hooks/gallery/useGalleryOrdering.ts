import { useState } from 'react';
import { toast } from 'sonner';
import type { KeyedMutator } from 'swr';
import { reordenarSecciones } from '../../api/reordenarSecciones';
import type { Propiedad, SeccionGaleria } from '../../types';

interface UseGalleryOrderingProps {
  propiedad?: Propiedad;
  mutate: KeyedMutator<Propiedad>;
}

export const useGalleryOrdering = ({ propiedad, mutate }: UseGalleryOrderingProps) => {
  const [isReordering, setIsReordering] = useState(false);

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
    isReordering,
    handleReorder,
    handleMoveSection
  };
};
