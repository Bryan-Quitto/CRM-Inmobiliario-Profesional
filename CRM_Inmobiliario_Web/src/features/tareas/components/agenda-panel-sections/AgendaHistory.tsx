import React from 'react';
import { History, CheckCircle2, XCircle, ChevronRight, Filter } from 'lucide-react';
import type { Tarea } from '../../types';
import { formatDateTime } from '../../utils';
import { TruncatedText } from '@/components/ui/TruncatedText';
import { AgendaToolbar } from './AgendaToolbar';

interface AgendaHistoryProps {
  showHistory: boolean;
  onToggleHistory: () => void;
  historySearch: string;
  onSearchChange: (val: string) => void;
  filteredHistorial: Tarea[];
  onSelectTask: (id: string) => void;
  historySortOrder: 'asc' | 'desc';
  onHistorySortOrderChange: (val: 'asc' | 'desc') => void;
  historyFilterTipos: string[];
  onHistoryFilterTiposChange: (val: string[]) => void;
  historyFilterColores: string[];
  onHistoryFilterColoresChange: (val: string[]) => void;
  historySortBy: 'fechaInicio' | 'fechaCreacion';
  onHistorySortByChange: (val: 'fechaInicio' | 'fechaCreacion') => void;
  isHistoryToolbarOpen: boolean;
  onToggleHistoryToolbar: () => void;
}

export const AgendaHistory: React.FC<AgendaHistoryProps> = ({
  showHistory,
  onToggleHistory,
  historySearch,
  onSearchChange,
  filteredHistorial,
  onSelectTask,
  historySortOrder,
  onHistorySortOrderChange,
  historyFilterTipos,
  onHistoryFilterTiposChange,
  historyFilterColores,
  onHistoryFilterColoresChange,
  historySortBy,
  onHistorySortByChange,
  isHistoryToolbarOpen,
  onToggleHistoryToolbar
}) => {
  return (
    <div className={`border-t border-slate-100 bg-slate-50/50 flex flex-col ${(showHistory && isHistoryToolbarOpen) ? 'flex-1 overflow-hidden' : 'mt-auto shrink-0'}`}>
      <button 
        onClick={onToggleHistory}
        aria-label={showHistory ? "Ocultar historial de tareas" : "Mostrar historial de tareas"}
        aria-expanded={showHistory}
        className="w-full p-4 flex items-center justify-between group hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
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
        <div className={`flex flex-col animate-in slide-in-from-bottom-2 duration-300 ${isHistoryToolbarOpen ? 'flex-1 overflow-hidden' : ''}`}>
          <div className="px-4 pb-2 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controles de Historial</span>
            <button 
              onClick={onToggleHistoryToolbar}
              className={`h-6 w-6 flex items-center justify-center rounded-md transition-all active:scale-95 border cursor-pointer ${
                isHistoryToolbarOpen 
                  ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' 
                  : 'bg-white text-slate-400 hover:text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm'
              }`}
              title="Filtros del Historial"
            >
              <Filter className="h-3 w-3" />
            </button>
          </div>

          {isHistoryToolbarOpen && (
            <div className="mb-2 border-y border-slate-100 bg-white">
              <AgendaToolbar
                searchQuery={historySearch}
                onSearchChange={onSearchChange}
                filterTipos={historyFilterTipos}
                onFilterTiposChange={onHistoryFilterTiposChange}
                filterColores={historyFilterColores}
                onFilterColoresChange={onHistoryFilterColoresChange}
                sortBy={historySortBy}
                onSortByChange={onHistorySortByChange}
                sortOrder={historySortOrder}
                onSortOrderChange={onHistorySortOrderChange}
              />
            </div>
          )}

          <div className={`overflow-y-auto space-y-2 scrollbar-hide px-4 pb-4 ${isHistoryToolbarOpen ? 'flex-1' : 'max-h-[350px]'}`}>
            {filteredHistorial.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic text-center py-4">No se encontraron resultados.</p>
            ) : (
              filteredHistorial.map((tarea) => (
                <div 
                  key={tarea.id}
                  onClick={() => onSelectTask(tarea.id)}
                  style={{ borderLeftColor: tarea.colorHex || '#e2e8f0', borderLeftWidth: '3px' }}
                  className="p-3 bg-white border border-slate-100 rounded-xl opacity-75 hover:opacity-100 transition-all flex items-center gap-3 group hover:shadow-sm cursor-pointer"
                >
                  <div className="shrink-0 h-5 w-5 flex items-center justify-center">
                    {tarea.estado === 'Completada' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <TruncatedText as="p" className={`text-[11px] font-bold text-slate-700 truncate ${tarea.estado === 'Completada' ? 'line-through' : ''}`}>
                        {tarea.titulo}
                      </TruncatedText>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span 
                        className="text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest text-white"
                        style={{ backgroundColor: tarea.colorHex || '#94a3b8' }}
                      >
                        {tarea.tipoTarea}
                      </span>
                      <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter">
                        {tarea.estado} • {formatDateTime(tarea.fechaInicio)}
                      </p>
                    </div>
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
