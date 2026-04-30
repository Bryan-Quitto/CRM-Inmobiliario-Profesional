import type { KeyedMutator } from 'swr';
import type { Propiedad } from '../types';
import { useGalleryMedia } from './gallery/useGalleryMedia';
import { useGallerySections } from './gallery/useGallerySections';
import { useGalleryOrdering } from './gallery/useGalleryOrdering';

interface UsePropiedadGalleryProps {
  id: string;
  propiedad?: Propiedad;
  mutate: KeyedMutator<Propiedad>;
  onCoverUpdated?: (newUrl: string) => void;
}

export const usePropiedadGallery = ({ id, propiedad, mutate, onCoverUpdated }: UsePropiedadGalleryProps) => {
  const media = useGalleryMedia({ id, propiedad, mutate, onCoverUpdated });
  const sections = useGallerySections({ id, propiedad, mutate });
  const ordering = useGalleryOrdering({ propiedad, mutate });

  return {
    // State from sub-hooks
    isAddingSection: sections.isAddingSection,
    isCreatingInline: sections.isCreatingInline,
    newSectionName: sections.newSectionName,
    isReordering: ordering.isReordering,
    
    // Setters
    setNewSectionName: sections.setNewSectionName,
    setIsCreatingInline: sections.setIsCreatingInline,

    // Actions
    handleSetCover: media.handleSetCover,
    handleDeleteMedia: media.handleDeleteMedia,
    handleAddSection: sections.handleAddSection,
    handleConfirmAddSection: sections.handleConfirmAddSection,
    handleDeleteSection: sections.handleDeleteSection,
    handleRenameSection: sections.handleRenameSection,
    handleClearGallery: media.handleClearGallery,
    handleReorder: ordering.handleReorder,
    handleMoveSection: ordering.handleMoveSection
  };
};
