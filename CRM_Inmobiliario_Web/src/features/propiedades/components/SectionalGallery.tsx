import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { 
  Upload, 
  Trash2, 
  FileDown,
  Loader2, 
  ImageIcon,
  Pencil,
  Plus,
  AlignLeft,
  Check,
  X,
  GripVertical,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';
import { useGalleryCore } from '../hooks/useGalleryCore';
import { useUpload } from '../context/useUpload';
import { useSWRConfig } from 'swr';
import type { MultimediaPropiedad, Propiedad } from '../types';
import ConfirmModal from '@/components/ConfirmModal';
import { MediaCard } from './MediaCard';

interface SectionalGalleryProps {
// ... (rest of the interface remains same)
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
  totalSections = 0
}) => {
  const { mutate } = useSWRConfig();
  const [, startTransition] = useTransition();

  // Handlers estables para evitar re-renders innecesarios en MediaCard
  const handleSetCoverStable = useCallback((id: string) => onSetCover(id), [onSetCover]);
  const handleDeleteMediaStable = useCallback((id: string | string[]) => onDeleteMedia(id), [onDeleteMedia]);
  const handleSavedStable = useCallback(() => {
    // Sincronización silenciosa con el servidor
    mutate(`/propiedades/${propiedadId}`);
  }, [mutate, propiedadId]);

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
  const [isEditingName, setIsEditingName] = useState(false);
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false);
  
  const [nombre, setNombre] = useState(sectionNombre);
  const [descripcion, setDescripcion] = useState(sectionDescripcion || '');
  const [isSavingDesc, setIsSavingDesc] = useState(false);
  const [saveDescSuccess, setSaveDescSuccess] = useState(false);
  const descTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOrderDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sincronizar estado local con props solo si no hay cambios pendientes locales
  useEffect(() => {
    // Si no estamos guardando y no hay un cambio local en curso (timeout activo), sincronizamos
    if (!isSavingDesc && !descTimeoutRef.current) {
      setNombre(sectionNombre);
      setDescripcion(sectionDescripcion || '');
    }
  }, [sectionNombre, sectionDescripcion, isSavingDesc]);

  // Auto-save for section description
  useEffect(() => {
    if (descripcion === (sectionDescripcion || '')) return;
    if (!sectionId || !onRenameSection) return;
    
    // IMPORTANTE: No guardar si el ID es temporal (comienza con temp-)
    // Esto evita errores 404 y permite que la key estable maneje la transición
    if (sectionId.startsWith('temp-')) return;

    if (descTimeoutRef.current) clearTimeout(descTimeoutRef.current);

    descTimeoutRef.current = setTimeout(async () => {
      setIsSavingDesc(true);
      const swrKey = `/propiedades/${propiedadId}`;

      // Actualización Optimista para Descripción de Sección
      mutate(swrKey, (prev: Propiedad | undefined) => {
        if (!prev || !sectionId) return prev;
        return {
          ...prev,
          secciones: prev.secciones?.map(s => 
            s.id === sectionId ? { ...s, descripcion } : s
          )
        };
      }, false);

      try {
        await onRenameSection(sectionId, nombre, descripcion || null);
        setSaveDescSuccess(true);
        startTransition(() => {
          mutate(swrKey);
        });
        setTimeout(() => setSaveDescSuccess(false), 2000);
      } catch {
        mutate(swrKey);
      } finally {
        setIsSavingDesc(false);
      }
    }, 1500);

    return () => { if (descTimeoutRef.current) clearTimeout(descTimeoutRef.current); };
  }, [descripcion, sectionId, nombre, onRenameSection, sectionDescripcion, propiedadId, mutate]);

  const handleFiles = async (files: FileList | File[]) => {
    const filesArray = Array.from(files);
    uploadFiles(propiedadId, propiedadTitulo, filesArray, onImageUploaded, sectionId);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.target instanceof HTMLElement && e.target.closest('textarea')) return;
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const handleConfirmAction = () => {
    // Ya no usamos isProcessing porque el patrón Undo devuelve inmediatamente
    if (sectionId && onDeleteSection) {
      onDeleteSection(sectionId);
    } else if (!sectionId && onClearGallery) {
      onClearGallery();
    }
    setConfirmDeleteSection(false);
  };

  const handleRenameSubmit = () => {
    // Cerramos el modo edición inmediatamente para una respuesta instantánea (Zero Wait)
    setIsEditingName(false);

    if (onRenameSection && sectionId && nombre !== sectionNombre) {
      const swrKey = `/propiedades/${propiedadId}`;
      
      // 1. Actualización Optimista inmediata en el cache local
      mutate(swrKey, (prev: Propiedad | undefined) => {
        if (!prev) return prev;
        return {
          ...prev,
          secciones: prev.secciones?.map(s => 
            s.id === sectionId ? { ...s, nombre } : s
          )
        };
      }, false);

      // 2. Ejecutar la petición en segundo plano (Fire and Forget)
      onRenameSection(sectionId, nombre, descripcion || null)
        .then(() => {
          // Revalidar silenciosamente al terminar para asegurar integridad
          mutate(swrKey);
        })
        .catch((err) => {
          console.error("Error al renombrar sección:", err);
          // Revertir automáticamente disparando una revalidación desde el servidor
          mutate(swrKey);
        });
    }
  };

  const galleryId = sectionId || 'general';

  const content = (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header de Sección */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              {sectionId && (
                <div className="flex flex-col gap-1 mr-1">
                  <button onClick={onMoveUp} className="p-1 text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer" title="Subir sección"><ChevronUp size={16} /></button>
                  
                  {/* Selector de Orden Dinámico */}
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      onClick={() => setIsOrderDropdownOpen(!isOrderDropdownOpen)}
                      className="h-6 w-6 rounded-md bg-slate-50 text-[10px] font-black text-indigo-600 flex items-center justify-center border border-indigo-100 hover:bg-indigo-50 transition-all cursor-pointer"
                      title="Cambiar orden"
                    >
                      {index + 1}
                    </button>
                    {isOrderDropdownOpen && (
                      <div className="absolute left-0 mt-1 w-16 bg-white border border-slate-100 rounded-xl shadow-2xl z-[100] py-1 max-h-40 overflow-y-auto animate-in zoom-in-95 duration-200 scrollbar-hide">
                        {Array.from({ length: totalSections }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              onMoveTo?.(i);
                              setIsOrderDropdownOpen(false);
                            }}
                            className={`w-full py-1.5 text-center text-[11px] font-black transition-colors hover:bg-indigo-50 cursor-pointer ${i === index ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button onClick={onMoveDown} className="p-1 text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer" title="Bajar sección"><ChevronDown size={16} /></button>
                </div>
              )}
              <div className={`h-12 w-12 shrink-0 ${sectionId ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'} rounded-[1.25rem] flex items-center justify-center shadow-inner`}>
                {sectionId ? <Plus size={24} /> : <ImageIcon size={24} />}
              </div>
              
              <div className="flex-1">
                {isEditingName ? (
                  <div className="flex items-center gap-2 w-full animate-in zoom-in-95 duration-200">
                    <input 
                      value={nombre} 
                      onChange={(e) => setNombre(e.target.value)}
                      className="flex-1 bg-slate-50 border-2 border-indigo-100 rounded-xl px-4 py-2 text-xl font-black text-slate-900 outline-none focus:bg-white transition-all"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit();
                        if (e.key === 'Escape') {
                          setNombre(sectionNombre);
                          setIsEditingName(false);
                        }
                      }}
                    />
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={handleRenameSubmit}
                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all cursor-pointer"
                        title="Confirmar"
                      >
                        <Check size={16} strokeWidth={3} />
                      </button>
                      <button 
                        onClick={() => {
                          setNombre(sectionNombre);
                          setIsEditingName(false);
                        }}
                        className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-rose-50 hover:text-rose-500 transition-all cursor-pointer"
                        title="Cancelar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
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

            <div className="flex items-center gap-3 shrink-0">
              {sectionId && (
                <div className="p-3 text-slate-300 cursor-grab active:cursor-grabbing hover:text-indigo-400 transition-colors">
                  <GripVertical size={24} />
                </div>
              )}

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

          {/* Descripción de la Sección */}
          {sectionId && (
            <div className="flex flex-col w-full group/desc">
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
                className="w-full bg-slate-50/50 border-none rounded-2xl p-4 text-sm font-bold text-slate-600 placeholder:text-slate-300 focus:bg-slate-50 focus:ring-4 focus:ring-indigo-100 transition-all resize-none h-24 block"
              />
            </div>
          )}
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
              onSetCover={handleSetCoverStable}
              onDelete={handleDeleteMediaStable}
              onDownload={handleDownloadSingle}
              showActions={selectedMediaIds.size === 0}
              onSaved={handleSavedStable}
              propiedadId={propiedadId}
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
