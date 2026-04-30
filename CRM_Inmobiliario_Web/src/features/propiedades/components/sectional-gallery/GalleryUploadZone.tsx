import React from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface GalleryUploadZoneProps {
  isDragging: boolean;
  setIsDragging: (val: boolean) => void;
  handleFiles: (files: FileList | File[]) => void;
  isUploading: boolean;
  sectionNombre: string;
}

export const GalleryUploadZone: React.FC<GalleryUploadZoneProps> = ({
  isDragging,
  setIsDragging,
  handleFiles,
  isUploading,
  sectionNombre
}) => {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.target instanceof HTMLElement && e.target.closest('textarea')) return;
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  return (
    <label 
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative h-24 flex flex-col items-center justify-center gap-2 transition-all border-t border-slate-50 ${
        isDragging ? 'bg-indigo-600 text-white' : 'bg-slate-50/20 hover:bg-indigo-50/30'
      }`}
    >
      <input 
        type="file" 
        multiple 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => e.target.files && handleFiles(e.target.files)} 
      />
      <div className="flex items-center gap-3">
        {isUploading ? (
          <Loader2 size={18} className="text-indigo-600 animate-spin" />
        ) : (
          <Upload size={18} className={isDragging ? 'animate-bounce' : 'text-indigo-600'} />
        )}
        <span className="text-[11px] font-black uppercase tracking-widest">
          {isDragging ? '¡Suelta para subir!' : 
          isUploading ? `Subiendo a ${sectionNombre}... (Puedes añadir más)` :
          `Arrastra o haz clic para subir a ${sectionNombre}`}
        </span>
      </div>
    </label>
  );
};
