import React from 'react';
import type { EventContentArg } from '@fullcalendar/core';
import { 
  Phone, 
  MapPin, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  XCircle 
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CalendarEvent } from '../../types';

const TIPO_ICONS: Record<string, LucideIcon> = {
  'Llamada': Phone,
  'Visita': MapPin,
  'Reunión': Users,
  'Trámite': Briefcase,
};

export const CalendarioEventContent: React.FC<{ eventInfo: EventContentArg }> = ({ eventInfo }) => {
  const props = eventInfo.event.extendedProps as CalendarEvent;
  const isCompleted = props.estado === 'Completada';
  const isCancelled = props.estado === 'Cancelada';

  // El pin rojo solo se muestra para tareas PENDIENTES que sean de HOY o VENCIDAS
  const finDeHoy = new Date();
  finDeHoy.setHours(23, 59, 59, 999);
  const isOverdueOrToday = props.estado === 'Pendiente' && new Date(props.fechaInicio) <= finDeHoy;

  const activeColor = isCompleted ? '#64748b' : (props.colorHex || '#3b82f6');

  let StatusIcon = TIPO_ICONS[props.tipoTarea] || Clock;
  if (isCompleted) StatusIcon = CheckCircle2;
  if (isCancelled) StatusIcon = XCircle;

  return (
    <div className={`flex flex-col w-full h-full p-1.5 gap-0.5 overflow-hidden ${isCompleted ? 'line-through decoration-slate-400' : ''}`}>
      <div className="flex items-center gap-1.5 shrink-0">
        <StatusIcon size={12} style={{ color: activeColor }} className="shrink-0" />
        <span className="truncate leading-none uppercase tracking-tight font-black text-slate-900 text-[10px]">
          {eventInfo.event.title}
        </span>
      </div>

      {(eventInfo.view.type !== 'dayGridMonth' || props.duracionMinutos > 45) && (
        <div className="flex flex-col gap-0.5 mt-0.5 font-bold overflow-hidden opacity-80">
          {props.clienteNombre && (
            <div className="flex items-center gap-1 truncate text-[9px] text-slate-600">
              <Users size={10} className="shrink-0" />
              <span className="truncate">{props.clienteNombre}</span>
            </div>
          )}
          {props.propiedadTitulo && (
            <div className="flex items-center gap-1 truncate text-[9px] text-slate-600">
              <MapPin size={10} className="shrink-0" />
              <span className="truncate">{props.propiedadTitulo}</span>
            </div>
          )}
          {props.lugar && !props.propiedadTitulo && (
            <div className="flex items-center gap-1 truncate text-[9px] text-slate-600">
              <MapPin size={10} className="shrink-0" />
              <span className="truncate">{props.lugar}</span>
            </div>
          )}
        </div>
      )}

      {isOverdueOrToday && (
        <div className="absolute top-1 right-1 flex h-1.5 w-1.5">
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
        </div>
      )}
    </div>
  );
};
