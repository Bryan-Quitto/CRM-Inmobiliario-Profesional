import React from 'react';
import { History, Search, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import type { Tarea } from '../../types';
import { formatDateTime } from '../../utils';

interface AgendaHistoryProps {
  showHistory: boolean;
  onToggleHistory: () => void;
  historySearch: string;
  onSearchChange: (val: string) => void;
  filteredHistorial: Tarea[];
  onSelectTask: (id: string) => void;
}

export const AgendaHistory: React.FC<AgendaHistoryProps> = ({
  showHistory,
  onToggleHistory,
  historySearch,
  onSearchChange,
  filteredHistorial,
  onSelectTask
}) => {
  return (
    <div className="mt-auto border-t border-slate-100 bg-slate-50/50">
      <button 
        onClick={onToggleHistory}
        aria-label={showHistory ? "Ocultar historial de tareas" : "Mostrar historial de tareas"}
        aria-expanded={showHistory}
        className="w-full p-4 flex items-center justify-between group hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-slate-500 group-hover:text-slate-600 transition-colors" aria-hidden="true" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Historial</span>
        </div>
        <span className="bg-slate-200 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded-full">
          <span className="sr-only">Tareas en historial: </span>{filteredHistorial.length}
        </span>
      </button>

      {showHistory && (
        <div className="px-4 pb-4 animate-in slide-in-from-bottom-2 duration-300">
          {/* Buscador Historial */}
          <div className="relative mb-3">
            <label htmlFor="history-search" className="sr-only">Buscar en historial de tareas</label>
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" aria-hidden="true" />
            <input 
              id="history-search"
              type="text"
              placeholder="Buscar en historial..."
              value={historySearch}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
            />
          </div>

          <div className="max-h-[210px] overflow-y-auto space-y-2 scrollbar-hide pr-1">
            {filteredHistorial.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic text-center py-4">No se encontraron resultados.</p>
            ) : (
              filteredHistorial.map((tarea) => (
                <div 
                  key={tarea.id}
                  onClick={() => onSelectTask(tarea.id)}
                  className="p-3 bg-white border border-slate-100 rounded-xl opacity-60 hover:opacity-100 transition-all grayscale hover:grayscale-0 flex items-center gap-3 group hover:border-blue-100 hover:shadow-sm cursor-pointer"
                >
                  <div className="shrink-0 h-5 w-5 flex items-center justify-center">
                    {tarea.estado === 'Completada' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[11px] font-bold text-slate-700 truncate ${tarea.estado === 'Completada' ? 'line-through' : ''}`}>
                      {tarea.titulo}
                    </p>
                    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter">
                      {tarea.estado} • {formatDateTime(tarea.fechaInicio)}
                    </p>
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-blue-400 transition-colors" />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
