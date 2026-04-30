import React from 'react';
import { ImageIcon } from 'lucide-react';
import { MediaCard } from '../MediaCard';
import type { MultimediaPropiedad } from '../../types';

interface GalleryGridProps {
  media: MultimediaPropiedad[];
  selectedMediaIds: Set<string>;
  handleToggleSelection: (id: string) => void;
  handleSetCoverStable: (id: string) => Promise<void>;
  handleDeleteMediaStable: (id: string | string[]) => Promise<void>;
  handleDownloadSingle: (url: string, filename: string) => void;
  handleSavedStable: () => void;
  isReadOnly: boolean;
  isUploading: boolean;
  propiedadId: string;
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({
  media,
  selectedMediaIds,
  handleToggleSelection,
  handleSetCoverStable,
  handleDeleteMediaStable,
  handleDownloadSingle,
  handleSavedStable,
  isReadOnly,
  isUploading,
  propiedadId
}) => {
  if (media.length > 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {media.map((item) => (
          <MediaCard 
            key={item.id}
            item={item}
            isSelected={selectedMediaIds.has(item.id)}
            onToggleSelection={handleToggleSelection}
            onSetCover={handleSetCoverStable}
            onDelete={handleDeleteMediaStable}
            onDownload={handleDownloadSingle}
            showActions={!isReadOnly && selectedMediaIds.size === 0}
            onSaved={handleSavedStable}
            propiedadId={propiedadId}
            isReadOnly={isReadOnly}
          />
        ))}
      </div>
    );
  }

  if (!isUploading) {
    return (
      <div className="py-20 bg-slate-50/30 border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-slate-300">
        <ImageIcon size={48} className="mb-4 opacity-10" />
        <p className="text-xs font-black uppercase tracking-[0.3em]">Sección vacía</p>
      </div>
    );
  }

  return null;
};
