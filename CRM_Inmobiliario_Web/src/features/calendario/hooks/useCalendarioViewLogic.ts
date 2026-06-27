import { useMemo } from 'react';
import type { EventClickArg, EventMountArg } from '@fullcalendar/core';
import { useCalendario } from './useCalendario';

export const useCalendarioViewLogic = () => {
  const logic = useCalendario();

  // Mapeo de eventos de negocio a formato FullCalendar
  const calendarEvents = useMemo(() => logic.listaEventos.map(e => ({
    id: e.id,
    title: e.titulo,
    start: e.fechaInicio,
    end: new Date(new Date(e.fechaInicio).getTime() + (e.duracionMinutos * 60000)).toISOString(),
    backgroundColor: e.estado === 'Completada' ? '#f1f5f9' : `${e.colorHex || '#3b82f6'}15`,
    borderColor: e.estado === 'Completada' ? '#cbd5e1' : (e.colorHex || '#3b82f6'),
    textColor: '#0f172a',
    editable: e.estado === 'Pendiente',
    classNames: [
      'rounded-md border-l-4 shadow-sm transition-all !border-y-0 !border-r-0',
      e.estado !== 'Pendiente' ? 'opacity-70' : 'hover:shadow-md hover:bg-opacity-100'
    ],
    extendedProps: { ...e },
    description: e.titulo
  })), [logic.listaEventos]);

  const handleEventDidMount = (info: EventMountArg) => {
    info.el.setAttribute('title', info.event.title);
  };

  const handleEventClick = (arg: EventClickArg) => {
    logic.setViewingTareaId(arg.event.id);
  };

  return {
    ...logic,
    calendarEvents,
    handleEventDidMount,
    handleEventClick
  };
};

export type CalendarioViewLogic = ReturnType<typeof useCalendarioViewLogic>;
