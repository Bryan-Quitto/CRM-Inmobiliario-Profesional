import { ChevronLeft } from 'lucide-react';

interface CrearTareaHeaderProps {
  onCancel: () => void;
  isPrefill: boolean;
}

export const CrearTareaHeader = ({ onCancel, isPrefill }: CrearTareaHeaderProps) => {
  return (
    <div className="p-6 border-b border-slate-50 flex items-center gap-4 bg-white sticky top-0 z-10">
      <button
        onClick={onCancel}
        type="button"
        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div>
        <h2 className="text-lg font-black text-slate-900 tracking-tight">Nueva Tarea</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
          {isPrefill ? 'Completado por el asistente · revisa y guarda' : 'Programar seguimiento'}
        </p>
      </div>
      {isPrefill && (
        <div className="ml-auto shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 border border-violet-100 rounded-full">
          <span className="h-1.5 w-1.5 bg-violet-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-black text-violet-600 uppercase tracking-widest">Asistente</span>
        </div>
      )}
    </div>
  );
};
