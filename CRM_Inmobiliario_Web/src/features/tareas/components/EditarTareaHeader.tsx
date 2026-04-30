import { ChevronLeft, RefreshCw, Trash2 } from 'lucide-react';

interface EditarTareaHeaderProps {
  isReadOnly: boolean;
  isSyncing: boolean;
  onCancel: () => void;
  onCancelTask: () => void;
}

export const EditarTareaHeader = ({ 
  isReadOnly, 
  isSyncing, 
  onCancel, 
  onCancelTask 
}: EditarTareaHeaderProps) => {
  return (
    <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button 
          type="button"
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            {isReadOnly ? 'Detalle de Tarea' : 'Editar Tarea'}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {isReadOnly ? 'Vista de solo lectura' : 'Modificar seguimiento'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isSyncing && (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 text-slate-400 rounded-full animate-pulse">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">Sincronizando...</span>
          </div>
        )}
        {!isReadOnly && (
          <button 
            type="button"
            onClick={onCancelTask}
            title="Cancelar Tarea"
            className="p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 cursor-pointer"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};
