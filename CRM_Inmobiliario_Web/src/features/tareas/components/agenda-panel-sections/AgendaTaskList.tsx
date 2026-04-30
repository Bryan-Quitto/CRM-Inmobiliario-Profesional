import React from 'react';
import { Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { Tarea } from '../../types';

interface AgendaTaskListProps {
  loading: boolean;
  allTareasCount: number;
  tareasPendientes: Tarea[];
  tareasAtrasadas: Tarea[];
  tareasHoy: Tarea[];
  tareasFuturas: Tarea[];
  isFuturasExpanded: boolean;
  onToggleFuturas: () => void;
  onComplete: (id: string) => void;
  onSelectTask: (id: string) => void;
  onEditTask: (id: string) => void;
}

export const AgendaTaskList: React.FC<AgendaTaskListProps> = ({
  loading,
  allTareasCount,
  tareasPendientes,
  tareasAtrasadas,
  tareasHoy,
  tareasFuturas,
  isFuturasExpanded,
  onToggleFuturas,
  onComplete,
  onSelectTask,
  onEditTask
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
      {loading && allTareasCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronizando...</p>
        </div>
      ) : tareasPendientes.length === 0 ? (
        <div className="py-20 text-center px-6">
          <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <CheckCircle2 className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-900">¡Todo al día!</p>
          <p className="text-xs text-slate-500 mt-1 italic">No tienes tareas pendientes para mostrar.</p>
        </div>
      ) : (
        <>
          {/* Sección Atrasadas */}
          {tareasAtrasadas.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <span className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-ping"></span>
                <h3 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Atrasadas ({tareasAtrasadas.length})</h3>
              </div>
              <div className="space-y-3">
                {tareasAtrasadas.map((tarea) => (
                  <TaskCard 
                    key={tarea.id} 
                    tarea={tarea} 
                    onComplete={onComplete}
                    onClick={() => onSelectTask(tarea.id)}
                    onEdit={() => onEditTask(tarea.id)}
                    isCompleting={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sección Hoy */}
          {tareasHoy.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <span className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Para Hoy</h3>
              </div>
              <div className="space-y-3">
                {tareasHoy.map((tarea) => (
                  <TaskCard 
                    key={tarea.id} 
                    tarea={tarea} 
                    onComplete={onComplete}
                    onClick={() => onSelectTask(tarea.id)}
                    onEdit={() => onEditTask(tarea.id)}
                    isCompleting={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sección Próximamente */}
          {tareasFuturas.length > 0 && (
            <div className="space-y-4">
              <button 
                onClick={onToggleFuturas}
                className="w-full flex items-center justify-between px-2 group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-slate-200 rounded-full"></span>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">
                    Próximamente ({tareasFuturas.length})
                  </h3>
                </div>
                <ChevronRight 
                  className={`h-3 w-3 text-slate-300 transition-transform duration-300 ${isFuturasExpanded ? 'rotate-90' : ''}`} 
                />
              </button>
              
              {isFuturasExpanded && (
                <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                  {tareasFuturas.map((tarea) => (
                    <TaskCard 
                      key={tarea.id} 
                      tarea={tarea} 
                      onComplete={onComplete}
                      onClick={() => onSelectTask(tarea.id)}
                      onEdit={() => onEditTask(tarea.id)}
                      isCompleting={false}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
