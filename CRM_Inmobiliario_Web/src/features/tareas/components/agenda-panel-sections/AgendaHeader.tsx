import React from 'react';
import { Bot, Plus, XCircle } from 'lucide-react';

interface AgendaHeaderProps {
  tareasPendientesCount: number;
  onOpenComando: () => void;
  onCreateTask: () => void;
  onClose?: () => void;
}

export const AgendaHeader: React.FC<AgendaHeaderProps> = ({
  tareasPendientesCount,
  onOpenComando,
  onCreateTask,
  onClose
}) => {
  return (
    <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
      <div>
        <h2 className="text-lg font-black text-slate-900 tracking-tight">Agenda Diaria</h2>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
          {tareasPendientesCount} Tareas Pendientes
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenComando}
          aria-label="Abrir asistente de agenda"
          title="Asistente de Agenda"
          className="h-8 w-8 bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-lg flex items-center justify-center hover:from-violet-500 hover:to-violet-600 transition-all shadow-lg shadow-violet-500/20 active:scale-95 cursor-pointer"
        >
          <Bot className="h-4 w-4" aria-hidden="true" />
        </button>
        <button 
          onClick={onCreateTask}
          aria-label="Crear nueva tarea"
          className="h-8 w-8 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
        {onClose && (
          <button 
            onClick={onClose}
            aria-label="Cerrar panel de agenda"
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors active:scale-95 border border-slate-100 cursor-pointer"
          >
            <XCircle className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
