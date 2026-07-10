import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Link } from 'react-router-dom';
import { Clock, Maximize2, Minimize2, Lock, RefreshCcw } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import type { ContactosKanbanLogicReturn } from '../hooks/useContactosKanbanLogic';
import { TruncatedText } from '@/components/ui/TruncatedText';

export interface ContactosKanbanDesktopProps {
  logic: ContactosKanbanLogicReturn;
}

export const ContactosKanbanDesktop: React.FC<ContactosKanbanDesktopProps> = ({ logic }) => {
  const {
    collapsedColumns,
    currentEstados,
    columns,
    toggleColumn,
    handleDragEnd,
    formatTimeAgo,
    getEtapaColor,
    isOwnerMode
  } = logic;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex h-[calc(100vh-280px)] min-h-[600px] gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200">
        {currentEstados.map((etapa) => {
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
                      {etapa.value === 'En Negociación' && (
                        <Tooltip content="Columna automática. Gestiona la transacción desde el catálogo de propiedades. No puedes mover contactos manualmente de esta columna." position="top">
                          <Lock className="w-3.5 h-3.5 text-amber-600/80 cursor-help shrink-0" />
                        </Tooltip>
                      )}
                      {(etapa.value === 'Cerrado' || etapa.value === 'Cerrado Ganado') && (
                        <Tooltip content={isOwnerMode ? "Columna automática. Un propietario pasa a Cerrado cuando todas sus propiedades han sido Vendidas o Alquiladas. Se reactivará automáticamente si vuelve a tener propiedades Disponibles." : "Columna automática al concretar operaciones. Puedes arrastrar a estos clientes de regreso a 'Nuevo' o 'Contactado' para iniciar un nuevo ciclo comercial."} position="top">
                          <Lock className="w-3.5 h-3.5 text-emerald-600/80 cursor-help shrink-0" />
                        </Tooltip>
                      )}
                      {etapa.value === 'Inactivo' && (
                        <Tooltip content="Aquellos propietarios con todas sus propiedades inactivas serán puestos aquí automáticamente, y de igual manera si a un propietario inactivo se le asigna una propiedad nueva o se le pasa una a disponible se le pondrá automáticamente a propietario activo." position="top">
                          <RefreshCcw className="w-3.5 h-3.5 text-rose-600/80 cursor-help shrink-0" />
                        </Tooltip>
                      )}
                      <TruncatedText as="span" className="font-black text-slate-800 uppercase tracking-tighter text-[11px] truncate">{etapa.label}</TruncatedText>
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
                <Droppable 
                  droppableId={etapa.value}
                  isDropDisabled={etapa.value === 'En Negociación' || etapa.value === 'Cerrado' || etapa.value === 'Cerrado Ganado' || etapa.value === 'Cerrado Perdido'}
                >
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 overflow-y-auto rounded-xl transition-all duration-200 p-1.5 scrollbar-hide ${
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
                          isDragDisabled={(!isOwnerMode && contacto.estadoEmbudo === 'En Negociación') || (isOwnerMode && contacto.estadoPropietario === 'Cerrado')}
                        >
                          {(provided, snapshot) => (
                              <Link
                                to={`/contactos/${contacto.id}`}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={{ ...(provided.draggableProps.style as React.CSSProperties), display: 'block' }}
                                {...provided.dragHandleProps}
                                onClick={(e) => {
                                  if (snapshot.isDragging) e.preventDefault();
                                }}
                                className={`cursor-pointer bg-white p-3 rounded-xl shadow-sm border mb-2 transition-all group cursor-grab active:cursor-grabbing block ${
                                  snapshot.isDragging 
                                    ? 'rotate-1 scale-105 shadow-xl border-blue-400 z-50 ring-2 blue-500/10' 
                                    : 'border-slate-100 hover:border-blue-200 hover:shadow-md'
                                }`}
                              >
                              <div className="flex items-center gap-3 mb-2">
                                <div className="h-8 w-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-[10px] group-hover:bg-blue-600 transition-colors shrink-0">
                                  {contacto.nombre[0]}{contacto.apellido?.[0] || ''}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <TruncatedText as="h4" className="font-black text-slate-900 group-hover:text-blue-600 transition-colors text-[11px] uppercase truncate">
                                    {[contacto.nombre, contacto.apellido].filter(Boolean).join(' ')}
                                  </TruncatedText>
                                  <TruncatedText as="p" className="text-[9px] text-slate-400 font-bold truncate tracking-tight">{contacto.telefono}</TruncatedText>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                  <Clock className="h-2.5 w-2.5" />
                                  {formatTimeAgo(contacto.fechaCreacion)}
                                </div>
                                {contacto.intereses && contacto.intereses.length > 0 && (
                                  <div className="bg-indigo-50 text-indigo-600 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-indigo-100">
                                    {contacto.intereses.length}P
                                  </div>
                                )}
                              </div>
                              </Link>
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
