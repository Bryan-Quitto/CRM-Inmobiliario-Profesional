import React, { useMemo, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Clock, Maximize2, Minimize2 } from 'lucide-react';
import { ETAPAS, ETAPAS_PROPIETARIO } from '../constants/clientes';
import type { Cliente } from '../types';

interface ClientesKanbanProps {
  clientes: Cliente[];
  activeSegment: 'prospectos' | 'propietarios' | 'todos';
  onStageChange: (id: string, nuevaEtapa: string, data?: { propiedadId: string, precioCierre: number, nuevoEstadoPropiedad: string }, tipo?: 'prospecto' | 'propietario') => void;
  onNavigate: (id: string) => void;
}

export const ClientesKanban: React.FC<ClientesKanbanProps> = ({ clientes, activeSegment, onStageChange, onNavigate }) => {
  const [collapsedColumns, setCollapsedColumns] = useState<string[]>([]);
  const isOwnerMode = activeSegment === 'propietarios';
  const currentEtapas = isOwnerMode ? ETAPAS_PROPIETARIO : ETAPAS;

  const toggleColumn = (value: string) => {
    setCollapsedColumns(prev => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const columns = useMemo(() => {
    const grouped: Record<string, Cliente[]> = {};
    currentEtapas.forEach(e => { grouped[e.value] = []; });
    
    clientes.forEach(cliente => {
      const etapa = isOwnerMode ? cliente.estadoPropietario : cliente.etapaEmbudo;
      if (grouped[etapa]) {
        grouped[etapa].push(cliente);
      } else {
        const defaultEtapa = currentEtapas[0].value;
        if (grouped[defaultEtapa]) grouped[defaultEtapa].push(cliente);
      }
    });
    
    return grouped;
  }, [clientes, currentEtapas, isOwnerMode]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    onStageChange(draggableId, destination.droppableId, undefined, isOwnerMode ? 'propietario' : 'prospecto');
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
    if (diffInDays === 0) return 'Hoy';
    if (diffInDays === 1) return 'Ayer';
    return `Hace ${diffInDays} d`;
  };

  const getEtapaColor = (value: string) => {
    const found = currentEtapas.find(e => e.value === value);
    // Extraer color del border/bg si existe o usar default
    if (found?.color.includes('blue')) return 'border-t-blue-500 bg-blue-50/50';
    if (found?.color.includes('amber')) return 'border-t-amber-500 bg-amber-50/50';
    if (found?.color.includes('indigo')) return 'border-t-indigo-500 bg-indigo-50/50';
    if (found?.color.includes('emerald')) return 'border-t-emerald-500 bg-emerald-50/50';
    if (found?.color.includes('rose')) return 'border-t-rose-500 bg-rose-50/50';
    return 'border-t-slate-500 bg-slate-50/50';
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex h-[calc(100vh-280px)] min-h-[600px] gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200">
        {currentEtapas.map((etapa) => {
          const isCollapsed = collapsedColumns.includes(etapa.value);
          const count = columns[etapa.value]?.length || 0;

          return (
            <div 
              key={etapa.value} 
              className={`flex flex-col transition-all duration-300 ease-in-out ${
                isCollapsed ? 'w-12' : 'flex-1 min-w-[240px] max-w-[350px]'
              }`}
            >
              {/* Header de Columna */}
              <div className={`mb-2 p-3 rounded-xl border-t-4 bg-white shadow-sm flex items-center justify-between overflow-hidden ${getEtapaColor(etapa.value)}`}>
                {!isCollapsed ? (
                  <>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-black text-slate-800 uppercase tracking-tighter text-[11px] truncate">{etapa.label}</span>
                      <span className="bg-white text-slate-500 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-slate-200 shrink-0 shadow-sm">
                        {count}
                      </span>
                    </div>
                    <button 
                      onClick={() => toggleColumn(etapa.value)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-white transition-all shrink-0 cursor-pointer"
                    >
                      <Minimize2 className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => toggleColumn(etapa.value)}
                    className="w-full flex flex-col items-center py-4 px-1 gap-8 h-full cursor-pointer"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Maximize2 className="h-3.5 w-3.5 text-slate-400 hover:text-blue-600 transition-colors" />
                      <span className="bg-slate-900 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full shadow-lg shadow-slate-900/20">
                        {count}
                      </span>
                    </div>
                    
                    <div className="relative h-32 w-full flex items-center justify-center">
                      <span className="absolute rotate-90 whitespace-nowrap font-black text-slate-500 uppercase tracking-[0.2em] text-[10px] origin-center">
                        {etapa.label}
                      </span>
                    </div>
                  </button>
                )}
              </div>

              {/* Area Droppable */}
              {!isCollapsed && (
                <Droppable droppableId={etapa.value}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 overflow-y-auto rounded-xl transition-colors duration-200 p-1.5 scrollbar-hide ${
                        snapshot.isDraggingOver ? 'bg-blue-50/40 ring-2 ring-blue-100 ring-inset' : 'bg-slate-100/40'
                      }`}
                    >
                      {columns[etapa.value]?.map((cliente, index) => (
                        <Draggable key={cliente.id} draggableId={cliente.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => !snapshot.isDragging && onNavigate(cliente.id)}
                              className={`cursor-pointer bg-white p-3 rounded-xl shadow-sm border mb-2 transition-all group cursor-grab active:cursor-grabbing ${
                                snapshot.isDragging 
                                  ? 'rotate-1 scale-105 shadow-xl border-blue-400 z-50 ring-2 blue-500/10' 
                                  : 'border-slate-100 hover:border-blue-200 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <div className="h-8 w-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-[10px] group-hover:bg-blue-600 transition-colors shrink-0">
                                  {cliente.nombre[0]}{cliente.apellido?.[0] || ''}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-black text-slate-900 group-hover:text-blue-600 transition-colors text-[11px] uppercase truncate">
                                    {[cliente.nombre, cliente.apellido].filter(Boolean).join(' ')}
                                  </h4>
                                  <p className="text-[9px] text-slate-400 font-bold truncate tracking-tight">{cliente.telefono}</p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                  <Clock className="h-2.5 w-2.5" />
                                  {formatTimeAgo(cliente.fechaCreacion)}
                                </div>
                                {cliente.intereses && cliente.intereses.length > 0 && (
                                  <div className="bg-indigo-50 text-indigo-600 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-indigo-100">
                                    {cliente.intereses.length}P
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};
