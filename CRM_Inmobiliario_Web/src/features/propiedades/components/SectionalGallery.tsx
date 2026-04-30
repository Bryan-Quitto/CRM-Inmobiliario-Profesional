import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { useSectionalGallery } from '../hooks/useSectionalGallery';
import type { MultimediaPropiedad } from '../types';

import { GalleryHeader } from './sectional-gallery/GalleryHeader';
import { GalleryDescription } from './sectional-gallery/GalleryDescription';
import { GalleryUploadZone } from './sectional-gallery/GalleryUploadZone';
import { GalleryGrid } from './sectional-gallery/GalleryGrid';
import { GalleryModals } from './sectional-gallery/GalleryModals';

interface SectionalGalleryProps {
  propiedadId: string;
  propiedadTitulo: string;
  index: number;
  sectionId?: string | null;
  sectionNombre?: string;
  sectionDescripcion?: string | null;
  media: MultimediaPropiedad[];
  onSetCover: (id: string) => Promise<void>;
  onDeleteMedia: (id: string | string[]) => Promise<void>;
  onImageUploaded?: (result: MultimediaPropiedad) => void;
  onRenameSection?: (id: string, nuevoNombre: string, descripcion: string | null) => Promise<void>;
  onDeleteSection?: (id: string) => Promise<void>;
  onClearGallery?: () => Promise<void>;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveTo?: (index: number) => void;
  totalSections?: number;
  isReadOnly?: boolean;
}

export const SectionalGallery = React.memo<SectionalGalleryProps>(({
  propiedadId,
  propiedadTitulo,
  index,
  sectionId = null,
  sectionNombre = "Galería General",
  sectionDescripcion = "",
  media,
  onSetCover,
  onDeleteMedia,
  onImageUploaded,
  onRenameSection,
  onDeleteSection,
  onClearGallery,
  onMoveUp,
  onMoveDown,
  onMoveTo,
  totalSections = 0,
  isReadOnly = false
}) => {
  const sectionalGallery = useSectionalGallery({
    propiedadId,
    propiedadTitulo,
    sectionId,
    sectionNombre,
    sectionDescripcion,
    onSetCover,
    onDeleteMedia,
    onImageUploaded,
    onRenameSection,
    onDeleteSection,
    onClearGallery
  });

  const galleryId = sectionId || 'general';

  const content = (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col gap-6">
          <GalleryHeader 
            sectionId={sectionId}
            sectionNombre={sectionNombre}
            index={index}
            totalSections={totalSections}
            isReadOnly={isReadOnly}
            isEditingName={sectionalGallery.isEditingName}
            nombre={sectionalGallery.nombre}
            setNombre={sectionalGallery.setNombre}
            setIsEditingName={sectionalGallery.setIsEditingName}
            handleRenameSubmit={sectionalGallery.handleRenameSubmit}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onMoveTo={onMoveTo}
            isOrderDropdownOpen={sectionalGallery.isOrderDropdownOpen}
            setIsOrderDropdownOpen={sectionalGallery.setIsOrderDropdownOpen}
            dropdownRef={sectionalGallery.dropdownRef}
            mediaCount={media.length}
            selectedMediaIds={sectionalGallery.selectedMediaIds}
            isDownloading={sectionalGallery.isDownloading}
            handleBulkDownload={sectionalGallery.handleBulkDownload}
            media={media}
            propiedadId={propiedadId}
            clearSelection={sectionalGallery.clearSelection}
            setConfirmDeleteSelection={sectionalGallery.setConfirmDeleteSelection}
            setConfirmDeleteSection={sectionalGallery.setConfirmDeleteSection}
          />

          {sectionId && (
            <GalleryDescription 
              descripcion={sectionalGallery.descripcion}
              setDescripcion={sectionalGallery.setDescripcion}
              isReadOnly={isReadOnly}
              isSavingDesc={sectionalGallery.isSavingDesc}
              saveDescSuccess={sectionalGallery.saveDescSuccess}
            />
          )}
        </div>

        {!isReadOnly && (
          <GalleryUploadZone 
            isDragging={sectionalGallery.isDragging}
            setIsDragging={sectionalGallery.setIsDragging}
            handleFiles={sectionalGallery.handleFiles}
            isUploading={sectionalGallery.isUploading}
            sectionNombre={sectionNombre}
          />
        )}
      </div>

      <GalleryGrid 
        media={media}
        selectedMediaIds={sectionalGallery.selectedMediaIds}
        handleToggleSelection={sectionalGallery.handleToggleSelection}
        handleSetCoverStable={sectionalGallery.handleSetCoverStable}
        handleDeleteMediaStable={sectionalGallery.handleDeleteMediaStable}
        handleDownloadSingle={sectionalGallery.handleDownloadSingle}
        handleSavedStable={sectionalGallery.handleSavedStable}
        isReadOnly={isReadOnly}
        isUploading={sectionalGallery.isUploading}
        propiedadId={propiedadId}
      />

      <GalleryModals 
        confirmDelete={sectionalGallery.confirmDelete}
        setConfirmDelete={sectionalGallery.setConfirmDelete}
        onDeleteMedia={onDeleteMedia}
        confirmDeleteSelection={sectionalGallery.confirmDeleteSelection}
        setConfirmDeleteSelection={sectionalGallery.setConfirmDeleteSelection}
        selectedMediaIds={sectionalGallery.selectedMediaIds}
        clearSelection={sectionalGallery.clearSelection}
        confirmDeleteSection={sectionalGallery.confirmDeleteSection}
        setConfirmDeleteSection={sectionalGallery.setConfirmDeleteSection}
        handleConfirmAction={sectionalGallery.handleConfirmAction}
        sectionId={sectionId}
      />
    </div>
  );

  if (!sectionId) return content;

  return (
    <Draggable draggableId={galleryId} index={index}>
      {(provided) => (
        <div 
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {content}
        </div>
      )}
    </Draggable>
  );
});
