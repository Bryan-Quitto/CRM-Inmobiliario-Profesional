import React, { useState, useEffect, useRef } from 'react';
import { 
  Trash2, 
  Star, 
  Download, 
  CheckCircle2, 
  Check, 
  Loader2,
  FileText
} from 'lucide-react';
import type { MultimediaPropiedad } from '../types';
import { actualizarDescripcionMultimedia } from '../api/actualizarDescripcionMultimedia';
import { toast } from 'sonner';

interface MediaCardProps {
  item: MultimediaPropiedad;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onSetCover: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (url: string, filename: string) => void;
  showActions: boolean;
  onSaved?: () => void; // Nueva prop para avisar al padre
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  isSelected,
  onToggleSelection,
  onSetCover,
  onDelete,
  onDownload,
  showActions,
  onSaved
}) => {
  const [descripcion, setDescripcion] = useState(item.descripcion || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sincronizar estado local con props (Crítico para SWR)
  useEffect(() => {
    setDescripcion(item.descripcion || '');
  }, [item.descripcion]);

  // Auto-save logic with debounce
  useEffect(() => {
    // Si el texto es igual al que ya está en la prop, no hacer nada
    if (descripcion === (item.descripcion || '')) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await actualizarDescripcionMultimedia(item.id, descripcion || null);
        setSaveSuccess(true);
        if (onSaved) onSaved(); // Avisar al padre para que SWR sepa que hay datos nuevos
        setTimeout(() => setSaveSuccess(false), 2000);
      } catch (error) {
        console.error('Error auto-guardando descripción:', error);
        toast.error('Error al guardar descripción');
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [descripcion, item.id, item.descripcion, onSaved]);

  return (
    <div className={`group flex flex-col bg-white rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden ${
      isSelected ? 'border-indigo-600 ring-8 ring-indigo-600/5 translate-y-[-4px]' : 'border-slate-50 hover:border-indigo-200 hover:shadow-2xl hover:translate-y-[-4px]'
    }`}>
      {/* Visualización de Imagen */}
      <div 
        className="relative aspect-[4/5] cursor-pointer overflow-hidden"
        onClick={() => onToggleSelection(item.id)}
      >
        <img 
          src={item.urlPublica} 
          alt="Propiedad" 
          className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 ${isSelected ? 'scale-105' : ''}`}
        />
        
        {/* Overlay Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Check Selection */}
        <div className={`absolute top-4 left-4 h-8 w-8 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 ${
          isSelected ? 'bg-indigo-600 border-indigo-600 text-white scale-110' : 'bg-white/40 border-white backdrop-blur-md opacity-0 group-hover:opacity-100'
        }`}>
          <Check size={18} strokeWidth={4} />
        </div>

        {/* Quick Actions (Floating) */}
        {showActions && !isSelected && (
          <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
            <button 
              onClick={(e) => { e.stopPropagation(); onDownload(item.urlPublica, `foto_${item.id.split('-')[0]}.webp`); }}
              className="bg-white/90 backdrop-blur-xl p-3 rounded-2xl hover:bg-indigo-600 hover:text-white shadow-xl transition-all cursor-pointer"
            >
              <Download size={18} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              className="bg-rose-500/90 backdrop-blur-xl p-3 rounded-2xl text-white hover:bg-rose-600 shadow-xl transition-all cursor-pointer"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}

        {/* Badge Portada */}
        {item.esPrincipal ? (
          <div className="absolute bottom-4 left-4 px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-left-4 duration-500">
            <CheckCircle2 size={14} /> Foto Portada
          </div>
        ) : (
          !isSelected && (
            <button 
              onClick={(e) => { e.stopPropagation(); onSetCover(item.id); }}
              className="absolute bottom-4 left-4 px-4 py-2 bg-white/90 backdrop-blur-xl text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 hover:text-white cursor-pointer"
            >
              <Star size={14} /> Hacer Portada
            </button>
          )
        )}
      </div>

      {/* Área de Descripción (Input Vertical) */}
      <div className="p-5 space-y-3 bg-slate-50/30">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <FileText size={12} className="text-indigo-400" /> Pie de foto
          </label>
          <div className="h-4 flex items-center">
            {isSaving && <Loader2 size={12} className="text-indigo-500 animate-spin" />}
            {saveSuccess && <Check size={12} className="text-emerald-500 animate-in zoom-in" />}
          </div>
        </div>
        
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Añade un detalle..."
          className="w-full bg-white border-none rounded-2xl p-4 text-sm font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium focus:ring-4 focus:ring-indigo-100 transition-all resize-none min-h-[80px] shadow-sm"
          onFocus={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};
