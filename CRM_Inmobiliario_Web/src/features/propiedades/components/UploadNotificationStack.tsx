import React from 'react';
import { Check, X } from 'lucide-react';
import type { UploadProcess } from '../context/UploadContext';

interface UploadNotificationStackProps {
  activeUploads: Record<string, UploadProcess>;
  onDismiss: (id: string) => void;
}

/**
 * Componente UI para mostrar el stack de notificaciones de subida de archivos.
 * Se posiciona de forma fija en la esquina superior derecha.
 */
export const UploadNotificationStack: React.FC<UploadNotificationStackProps> = ({ 
  activeUploads, 
  onDismiss 
}) => {
  const uploadsToShow = Object.values(activeUploads).filter(u => !u.dismissed);

  if (uploadsToShow.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[300] flex flex-col gap-3 pointer-events-none">
      {uploadsToShow.map((upload) => (
        <div 
          key={upload.id}
          className="w-80 bg-white/95 backdrop-blur-md border border-slate-100 shadow-2xl rounded-2xl p-4 animate-in slide-in-from-right-8 duration-500 pointer-events-auto relative group"
        >
          {/* Botón de cierre manual (X) - Solo oculta, no detiene el proceso */}
          <button 
            onClick={() => onDismiss(upload.id)}
            className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                upload.estado === 'loading' ? 'bg-blue-50 text-blue-600' : 
                upload.estado === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                'bg-rose-50 text-rose-600'
              }`}>
                {upload.estado === 'loading' ? (
                  <div className="relative">
                    <div className="h-5 w-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : upload.estado === 'completed' ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <X className="h-5 w-5" />
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Subiendo Imágenes</p>
                <p className="text-sm font-black text-slate-900 truncate tracking-tight pr-4">{upload.nombrePropiedad}</p>
              </div>
            </div>
            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-widest">
              {upload.completedFiles}/{upload.totalFiles}
            </span>
          </div>

          <div className="space-y-2">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ease-out ${
                  upload.estado === 'loading' ? 'bg-blue-600' : 
                  upload.estado === 'completed' ? 'bg-emerald-500' : 
                  'bg-rose-500'
                }`}
                style={{ width: `${upload.progreso}%` }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {upload.estado === 'loading' ? 'En progreso...' : 
                 upload.estado === 'completed' ? 'Finalizado' : 'Error en carga'}
              </span>
              <span className="text-[11px] font-black text-slate-900">{upload.progreso}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
