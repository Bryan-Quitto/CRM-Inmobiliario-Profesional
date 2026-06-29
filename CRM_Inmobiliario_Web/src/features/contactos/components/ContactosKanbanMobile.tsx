import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Clock, Lock, RefreshCcw } from 'lucide-react';
import { MobileInfoPopover } from '@/components/ui/MobileInfoPopover';
import type { ContactosKanbanLogicReturn } from '../hooks/useContactosKanbanLogic';

export interface ContactosKanbanMobileProps {
  logic: ContactosKanbanLogicReturn;
}

export const ContactosKanbanMobile: React.FC<ContactosKanbanMobileProps> = ({ logic }) => {
  const {
    currentEstados,
    columns,
    handleDragEnd,
    formatTimeAgo,
    getEtapaColor,
    onNavigate
  } = logic;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-2 pb-6 w-full overflow-y-auto">
        {currentEstados.map((etapa) => {
          const count = columns[etapa.value]?.length || 0;

          return (
            <div key={etapa.value} className="flex flex-col w-full px-2">
              <div className={`mb-2 p-3 rounded-lg border-t-4 bg-white shadow-sm flex items-center justify-between w-full min-w-0 ${getEtapaColor(etapa.value)}`}>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {etapa.value === 'En Negociación' && (
                    <MobileInfoPopover content="Columna automática. Gestiona la transacción desde el catálogo de propiedades. No puedes mover contactos manualmente de esta columna.">
                      <Lock className="w-3.5 h-3.5 text-amber-600/80 shrink-0" />
                    </MobileInfoPopover>
                  )}
                  {(etapa.value === 'Cerrado' || etapa.value === 'Cerrado Ganado') && (
                    <MobileInfoPopover content="Columna automática al concretar operaciones. Puedes arrastrar a estos clientes de regreso a 'Nuevo' o 'Contactado' para iniciar un nuevo ciclo comercial.">
                      <RefreshCcw className="w-3.5 h-3.5 text-emerald-600/80 shrink-0" />
                    </MobileInfoPopover>
                  )}
                  <span className="font-black text-slate-800 uppercase tracking-tighter text-[11px] break-words flex-1 min-w-0 whitespace-normal">{etapa.label}</span>
                  <span className="bg-white text-slate-500 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-slate-200 shrink-0 shadow-sm">
                    {count}
                  </span>
                </div>
              </div>

              <Droppable 
                droppableId={etapa.value}
                isDropDisabled={etapa.value === 'En Negociación' || etapa.value === 'Cerrado' || etapa.value === 'Cerrado Ganado' || etapa.value === 'Cerrado Perdido'}
              >
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`min-h-[80px] w-full rounded-lg transition-all duration-200 p-1.5 ${
                      snapshot.isDraggingOver ? 'bg-blue-50/40 ring-2 ring-blue-100 ring-inset' 
                      : (etapa.value === 'En Negociación' || etapa.value === 'Cerrado' || etapa.value === 'Cerrado Ganado') 
                        ? 'bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(241,245,249,0.8)_10px,rgba(241,245,249,0.8)_20px)] border-2 border-dashed border-slate-200/50' 
                        : 'bg-slate-100/40'
                    }`}
                  >
                    {columns[etapa.value]?.map((contacto, index) => (
                      <Draggable 
                        key={contacto.id} 
                        draggableId={contacto.id} 
                        index={index}
                        isDragDisabled={contacto.estadoEmbudo === 'En Negociación'}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={provided.draggableProps.style as React.CSSProperties}
                            {...provided.dragHandleProps}
                            onClick={() => !snapshot.isDragging && onNavigate(contacto.id)}
                            className={`cursor-pointer w-full min-w-0 flex-1 bg-white p-3 rounded-lg shadow-sm border mb-2 transition-all group ${
                              snapshot.isDragging 
                                ? 'scale-105 shadow-xl border-blue-400 z-50 ring-2 blue-500/10' 
                                : 'border-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2 w-full min-w-0 flex-1">
                              <div className="h-8 w-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-[10px] shrink-0">
                                {contacto.nombre[0]}{contacto.apellido?.[0] || ''}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-black text-slate-900 text-[11px] uppercase break-words flex-1 min-w-0 whitespace-normal">
                                  {[contacto.nombre, contacto.apellido].filter(Boolean).join(' ')}
                                </h4>
                                <p className="text-[9px] text-slate-400 font-bold break-words tracking-tight flex-1 min-w-0 whitespace-normal">{contacto.telefono}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-50 min-w-0 w-full">
                              <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase tracking-widest flex-1 min-w-0 break-words whitespace-normal">
                                <Clock className="h-2.5 w-2.5 shrink-0" />
                                <span className="flex-1 min-w-0 break-words whitespace-normal">{formatTimeAgo(contacto.fechaCreacion)}</span>
                              </div>
                              {contacto.intereses && contacto.intereses.length > 0 && (
                                <div className="bg-indigo-50 text-indigo-600 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-indigo-100 shrink-0">
                                  {contacto.intereses.length}P
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
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};
