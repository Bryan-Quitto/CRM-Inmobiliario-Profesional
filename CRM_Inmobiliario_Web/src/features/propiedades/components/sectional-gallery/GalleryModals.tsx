import React from 'react';
import ConfirmModal from '@/components/ConfirmModal';

interface GalleryModalsProps {
  confirmDelete: string | null;
  setConfirmDelete: (val: string | null) => void;
  onDeleteMedia: (id: string | string[]) => Promise<void>;
  confirmDeleteSelection: boolean;
  setConfirmDeleteSelection: (val: boolean) => void;
  selectedMediaIds: Set<string>;
  clearSelection: () => void;
  confirmDeleteSection: boolean;
  setConfirmDeleteSection: (val: boolean) => void;
  handleConfirmAction: () => void;
  sectionId?: string | null;
}

export const GalleryModals: React.FC<GalleryModalsProps> = ({
  confirmDelete,
  setConfirmDelete,
  onDeleteMedia,
  confirmDeleteSelection,
  setConfirmDeleteSelection,
  selectedMediaIds,
  clearSelection,
  confirmDeleteSection,
  setConfirmDeleteSection,
  handleConfirmAction,
  sectionId
}) => {
  return (
    <>
      <ConfirmModal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)} 
        onConfirm={() => {
          if (confirmDelete) onDeleteMedia(confirmDelete);
          setConfirmDelete(null);
        }}
        title="¿Eliminar imagen?"
        description="Esta acción es permanente."
      />

      <ConfirmModal 
        isOpen={confirmDeleteSelection} 
        onClose={() => setConfirmDeleteSelection(false)} 
        onConfirm={async () => {
          await onDeleteMedia(Array.from(selectedMediaIds));
          clearSelection();
          setConfirmDeleteSelection(false);
        }}
        title={`¿Eliminar ${selectedMediaIds.size} imágenes?`}
        description="Se borrarán definitivamente del servidor."
      />

      <ConfirmModal 
        isOpen={confirmDeleteSection} 
        onClose={() => setConfirmDeleteSection(false)} 
        onConfirm={handleConfirmAction}
        title={sectionId ? "¿Eliminar sección completa?" : "¿Limpiar galería general?"}
        description={sectionId ? "Se eliminarán todas las imágenes de esta sección." : "Se eliminarán todas las secciones y fotos (excepto la de portada)."}
      />
    </>
  );
};
