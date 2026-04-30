import React from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Plus, 
  ImageIcon, 
  Pencil, 
  Check, 
  X, 
  GripVertical, 
  FileDown, 
  Trash2, 
  Loader2 
} from 'lucide-react';
import type { MultimediaPropiedad } from '../../types';

interface GalleryHeaderProps {
  sectionId?: string | null;
  sectionNombre: string;
  index: number;
  totalSections: number;
  isReadOnly: boolean;
  isEditingName: boolean;
  nombre: string;
  setNombre: (val: string) => void;
  setIsEditingName: (val: boolean) => void;
  handleRenameSubmit: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveTo?: (index: number) => void;
  isOrderDropdownOpen: boolean;
  setIsOrderDropdownOpen: (val: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  mediaCount: number;
  selectedMediaIds: Set<string>;
  isDownloading: boolean;
  handleBulkDownload: (media: MultimediaPropiedad[], filename: string) => void;
  media: MultimediaPropiedad[];
  propiedadId: string;
  clearSelection: () => void;
  setConfirmDeleteSelection: (val: boolean) => void;
  setConfirmDeleteSection: (val: boolean) => void;
}

export const GalleryHeader: React.FC<GalleryHeaderProps> = ({
  sectionId,
  sectionNombre,
  index,
  totalSections,
  isReadOnly,
  isEditingName,
  nombre,
  setNombre,
  setIsEditingName,
  handleRenameSubmit,
  onMoveUp,
  onMoveDown,
  onMoveTo,
  isOrderDropdownOpen,
  setIsOrderDropdownOpen,
  dropdownRef,
  mediaCount,
  selectedMediaIds,
  isDownloading,
  handleBulkDownload,
  media,
  propiedadId,
  clearSelection,
  setConfirmDeleteSelection,
  setConfirmDeleteSection
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
      <div className="flex items-center gap-4">
        {sectionId && (
          <div className={`flex flex-col gap-1 mr-1 ${isReadOnly ? 'opacity-30 pointer-events-none' : ''}`}>
            <button onClick={onMoveUp} disabled={isReadOnly} className="p-1 text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer" title="Subir sección"><ChevronUp size={16} /></button>
            
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => !isReadOnly && setIsOrderDropdownOpen(!isOrderDropdownOpen)}
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
                      className={`cursor-pointer w-full py-1.5 text-center text-[11px] font-black transition-colors hover:bg-indigo-50 ${i === index ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={onMoveDown} disabled={isReadOnly} className="p-1 text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer" title="Bajar sección"><ChevronDown size={16} /></button>
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
              {sectionId && !isReadOnly && (
                <button onClick={() => setIsEditingName(true)} className="p-2 text-slate-300 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                  <Pencil size={16} />
                </button>
              )}
            </div>
          )}
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{mediaCount} Imágenes en total</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {sectionId && !isReadOnly && (
          <div className="p-3 text-slate-300 cursor-grab active:cursor-grabbing hover:text-indigo-400 transition-colors">
            <GripVertical size={24} />
          </div>
        )}

        {mediaCount > 0 && (
          <button 
            disabled={isDownloading}
            onClick={() => {
              const toDownload = selectedMediaIds.size > 0 
                ? media.filter(m => selectedMediaIds.has(m.id)) 
                : media;
              handleBulkDownload(toDownload, `${sectionNombre}_${propiedadId.split('-')[0]}`);
            }}
            className="flex items-center gap-3 px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            {selectedMediaIds.size > 0 ? `Bajar (${selectedMediaIds.size})` : 'Descargar ZIP'}
          </button>
        )}
        
        {!isReadOnly && (sectionId || mediaCount > 0) && (
          <button 
            onClick={() => selectedMediaIds.size > 0 ? setConfirmDeleteSelection(true) : setConfirmDeleteSection(true)}
            className="flex items-center gap-3 px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all cursor-pointer"
          >
            <Trash2 size={16} />
            {selectedMediaIds.size > 0 ? `Borrar Selección` : (sectionId ? 'Eliminar' : 'Limpiar')}
          </button>
        )}
        
        {!isReadOnly && selectedMediaIds.size > 0 && (
          <button onClick={clearSelection} className="h-10 w-10 flex items-center justify-center bg-slate-900 text-white rounded-xl hover:bg-black transition-all cursor-pointer">
            <Plus size={20} className="rotate-45" />
          </button>
        )}
      </div>
    </div>
  );
};
