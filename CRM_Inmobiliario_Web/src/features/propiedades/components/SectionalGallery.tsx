import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Trash2, 
  FileDown, 
  Loader2, 
  ImageIcon,
  Pencil,
  Plus,
  AlignLeft,
  Check
} from 'lucide-react';
import { useGalleryCore } from '../hooks/useGalleryCore';
import { useUpload } from '../context/useUpload';
import type { MultimediaPropiedad } from '../types';
import ConfirmModal from '@/components/ConfirmModal';
import { MediaCard } from './MediaCard';

interface SectionalGalleryProps {
  propiedadId: string;
  propiedadTitulo: string;
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
}

export const SectionalGallery: React.FC<SectionalGalleryProps> = ({
  propiedadId,
  propiedadTitulo,
  sectionId = null,
  sectionNombre = "Galería General",
  sectionDescripcion = "",
  media,
  onSetCover,
  onDeleteMedia,
  onImageUploaded,
  onRenameSection,
  onDeleteSection,
  onClearGallery
}) => {
  const { 
    selectedMediaIds, 
    handleToggleSelection, 
    clearSelection, 
    isDownloading, 
    handleDownloadSingle, 
    handleBulkDownload 
  } = useGalleryCore();

  const { uploadFiles, isUploading } = useUpload();
  const [isDragging, setIsDragging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmDeleteSelection, setConfirmDeleteSelection] = useState(false);
  const [confirmDeleteSection, setConfirmDeleteSection] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  
  const [nombre, setNombre] = useState(sectionNombre);
  const [descripcion, setDescripcion] = useState(sectionDescripcion || '');
  const [isSavingDesc, setIsSavingDesc] = useState(false);
  const [saveDescSuccess, setSaveDescSuccess] = useState(false);
  const descTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sincronizar estado local con props (importante para pre-carga de SWR)
  useEffect(() => {
    setNombre(sectionNombre);
    setDescripcion(sectionDescripcion || '');
  }, [sectionNombre, sectionDescripcion]);

  // Auto-save for section description
  useEffect(() => {
    if (descripcion === (sectionDescripcion || '')) return;
    if (!sectionId || !onRenameSection) return;

    if (descTimeoutRef.current) clearTimeout(descTimeoutRef.current);

    descTimeoutRef.current = setTimeout(async () => {
      setIsSavingDesc(true);
      try {
        await onRenameSection(sectionId, nombre, descripcion || null);
        setSaveDescSuccess(true);
        setTimeout(() => setSaveDescSuccess(false), 2000);
      } finally {
        setIsSavingDesc(false);
      }
    }, 1500);

    return () => { if (descTimeoutRef.current) clearTimeout(descTimeoutRef.current); };
  }, [descripcion, sectionId, nombre, onRenameSection, sectionDescripcion]);

  const handleFiles = async (files: FileList | File[]) => {
    const filesArray = Array.from(files);
    uploadFiles(propiedadId, propiedadTitulo, filesArray, onImageUploaded, sectionId);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const handleConfirmAction = async () => {
    setIsProcessing(true);
    try {
      if (sectionId && onDeleteSection) {
        await onDeleteSection(sectionId);
      } else if (!sectionId && onClearGallery) {
        await onClearGallery();
      }
      setConfirmDeleteSection(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRenameSubmit = async () => {
    if (onRenameSection && sectionId && nombre !== sectionNombre) {
      await onRenameSection(sectionId, nombre, descripcion || null);
    }
    setIsEditingName(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header de Sección */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 shrink-0 ${sectionId ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'} rounded-[1.25rem] flex items-center justify-center shadow-inner`}>
                {sectionId ? <Plus size={24} /> : <ImageIcon size={24} />}
              </div>
              
              <div className="flex-1">
                {isEditingName ? (
                  <input 
                    value={nombre} 
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-indigo-100 rounded-xl px-4 py-2 text-xl font-black text-slate-900 outline-none focus:bg-white transition-all"
                    autoFocus
                    onBlur={handleRenameSubmit}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                  />
                ) : (
                  <div className="flex items-center gap-3 group">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{sectionNombre}</h3>
                    {sectionId && (
                      <button onClick={() => setIsEditingName(true)} className="p-2 text-slate-300 hover:text-indigo-600 transition-all cursor-pointer opacity-0 group-hover:opacity-100">
                        <Pencil size={16} />
                      </button>
                    )}
                  </div>
                )}
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{media.length} Imágenes en total</p>
              </div>
            </div>

            {/* Descripción de la Sección */}
            {sectionId && (
              <div className="relative group/desc max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <AlignLeft size={14} className="text-indigo-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumen de la sección</span>
                  {isSavingDesc && <Loader2 size={12} className="text-indigo-500 animate-spin ml-2" />}
                  {saveDescSuccess && <Check size={12} className="text-emerald-500 animate-in zoom-in ml-2" />}
                </div>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe brevemente esta área para el PDF (ej: Vista al jardín, acabados premium...)"
                  className="w-full bg-slate-50/50 border-none rounded-2xl p-4 text-sm font-bold text-slate-600 placeholder:text-slate-300 focus:bg-slate-50 focus:ring-4 focus:ring-indigo-100 transition-all resize-none h-20"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {media.length > 0 && (
              <button 
                disabled={isDownloading}
                onClick={() => {
                  const toDownload = selectedMediaIds.size > 0 
                    ? media.filter(m => selectedMediaIds.has(m.id)) 
                    : media;
                  handleBulkDownload(toDownload, `${sectionNombre}_${propiedadId.split('-')[0]}`);
                }}
                className="flex items-center gap-3 px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                {selectedMediaIds.size > 0 ? `Bajar (${selectedMediaIds.size})` : 'Descargar ZIP'}
              </button>
            )}
            
            {(sectionId || media.length > 0) && (
              <button 
                onClick={() => selectedMediaIds.size > 0 ? setConfirmDeleteSelection(true) : setConfirmDeleteSection(true)}
                className="flex items-center gap-3 px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all cursor-pointer"
              >
                <Trash2 size={16} />
                {selectedMediaIds.size > 0 ? `Borrar Selección` : (sectionId ? 'Eliminar' : 'Limpiar')}
              </button>
            )}
            
            {selectedMediaIds.size > 0 && (
              <button onClick={clearSelection} className="h-10 w-10 flex items-center justify-center bg-slate-900 text-white rounded-xl hover:bg-black transition-all cursor-pointer">
                <Plus size={20} className="rotate-45" />
              </button>
            )}
          </div>
        </div>

        {/* Zona de Arrastre World-Class */}
        <label 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative h-24 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer border-t border-slate-50 ${
            isUploading(propiedadId) ? 'opacity-50 cursor-not-allowed bg-slate-50' : 
            isDragging ? 'bg-indigo-600 text-white' : 'bg-slate-50/20 hover:bg-indigo-50/30'
          }`}
        >
          <input 
            type="file" 
            multiple 
            className="hidden" 
            accept="image/*" 
            onChange={(e) => e.target.files && handleFiles(e.target.files)} 
            disabled={isUploading(propiedadId)}
          />
          <div className="flex items-center gap-3">
            <Upload size={18} className={isDragging ? 'animate-bounce' : 'text-indigo-600'} />
            <span className="text-[11px] font-black uppercase tracking-widest">
              {isDragging ? '¡Suelta para subir!' : `Arrastra o haz clic para subir a ${sectionNombre}`}
            </span>
          </div>
        </label>
      </div>

      {/* Grid de Fotos Rediseñado (Vertical/Card) */}
      {media.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {media.map((item) => (
            <MediaCard 
              key={item.id}
              item={item}
              isSelected={selectedMediaIds.has(item.id)}
              onToggleSelection={handleToggleSelection}
              onSetCover={onSetCover}
              onDelete={(id) => onDeleteMedia(id)}
              onDownload={handleDownloadSingle}
              showActions={selectedMediaIds.size === 0}
              onSaved={() => onImageUploaded?.(item)}
            />
          ))}
        </div>
      ) : !isUploading(propiedadId) && (
        <div className="py-20 bg-slate-50/30 border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-slate-300">
          <ImageIcon size={48} className="mb-4 opacity-10" />
          <p className="text-xs font-black uppercase tracking-[0.3em]">Sección vacía</p>
        </div>
      )}

      {/* Modales de Confirmación */}
      <ConfirmModal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)} 
        onConfirm={() => confirmDelete && onDeleteMedia(confirmDelete)}
        isDeleting={isProcessing}
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
        isDeleting={isProcessing}
        title={`¿Eliminar ${selectedMediaIds.size} imágenes?`}
        description="Se borrarán definitivamente del servidor."
      />

      <ConfirmModal 
        isOpen={confirmDeleteSection} 
        onClose={() => setConfirmDeleteSection(false)} 
        onConfirm={handleConfirmAction}
        isDeleting={isProcessing}
        title={sectionId ? "¿Eliminar sección completa?" : "¿Limpiar galería general?"}
        description={sectionId ? "Se eliminarán todas las imágenes de esta sección." : "Se eliminarán todas las fotos excepto la de portada."}
      />
    </div>
  );
};
