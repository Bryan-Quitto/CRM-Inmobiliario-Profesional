import { toast } from 'sonner';
import type { KeyedMutator } from 'swr';
import { establecerImagenPrincipal } from '../../api/establecerImagenPrincipal';
import { deleteImagenPropiedad } from '../../api/deleteImagenPropiedad';
import { deleteImagenesSeleccionadas } from '../../api/deleteImagenesSeleccionadas';
import { limpiarImagenesPropiedad } from '../../api/limpiarImagenesPropiedad';
import type { Propiedad } from '../../types';

interface UseGalleryMediaProps {
  id: string;
  propiedad?: Propiedad;
  mutate: KeyedMutator<Propiedad>;
  onCoverUpdated?: (newUrl: string) => void;
}

export const useGalleryMedia = ({ id, propiedad, mutate, onCoverUpdated }: UseGalleryMediaProps) => {
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

  return {
    handleSetCover,
    handleDeleteMedia,
    handleClearGallery
  };
};
