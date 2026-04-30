import React from 'react';
import { AlignLeft, Loader2, Check } from 'lucide-react';

interface GalleryDescriptionProps {
  descripcion: string;
  setDescripcion: (val: string) => void;
  isReadOnly: boolean;
  isSavingDesc: boolean;
  saveDescSuccess: boolean;
}

export const GalleryDescription: React.FC<GalleryDescriptionProps> = ({
  descripcion,
  setDescripcion,
  isReadOnly,
  isSavingDesc,
  saveDescSuccess
}) => {
  return (
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
        readOnly={isReadOnly}
        placeholder={isReadOnly ? "Sin descripción..." : "Describe brevemente esta área para el PDF (ej: Vista al jardín, acabados premium...)"}
        className={`w-full border-none rounded-2xl p-4 text-sm font-bold text-slate-600 placeholder:text-slate-300 transition-all resize-none h-24 block ${isReadOnly ? 'bg-slate-50 cursor-default' : 'bg-slate-50/50 focus:bg-slate-50 focus:ring-4 focus:ring-indigo-100'}`}
      />
    </div>
  );
};
