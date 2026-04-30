import { useState, useRef, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import FullCalendar from '@fullcalendar/react';
import { toast } from 'sonner';
import { swrDefaultConfig } from '@/lib/swr';
import type { DatesSetArg, EventChangeArg } from '@fullcalendar/core';
import type { CalendarEvent } from '../types';
import type { Tarea } from '../../tareas/types';
import { getEventos } from '../api/getEventos';
import { reprogramarEvento } from '../api/reprogramarEvento';
import { cancelarTarea } from '../../tareas/api/cancelarTarea';

export const useCalendario = () => {
  const calendarRef = useRef<FullCalendar>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewType, setViewType] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
  const [currentTitle, setCurrentTitle] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [range, setRange] = useState({ start: '', end: '' });

  // Estados para gestión de modales
  const [isCrearOpen, setIsCrearOpen] = useState(false);
  const [viewingTareaId, setViewingTareaId] = useState<string | null>(null);
  const [editingTareaId, setEditingTareaId] = useState<string | null>(null);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  // ResizeObserver para corregir el bug de responsive
  useEffect(() => {
    if (!containerRef.current || !calendarRef.current) return;
    const calendarApi = calendarRef.current.getApi();
    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        calendarApi.updateSize();
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // SWR: Carga reactiva basada en el rango visible
  const { data: eventos, isValidating: syncing, mutate } = useSWR<CalendarEvent[]>(
    range.start && range.end ? [`/calendario`, range.start, range.end] : null,
    () => getEventos(range.start, range.end),
    swrDefaultConfig
  );

  const listaEventos = useMemo(() => eventos || [], [eventos]);
  const isLoading = eventos === undefined && syncing;

  const selectedTarea = useMemo(() =>
    listaEventos.find(e => e.id === (viewingTareaId || editingTareaId)) as unknown as Tarea,
    [listaEventos, viewingTareaId, editingTareaId]);

  const handleCancelar = async () => {
    const id = viewingTareaId || editingTareaId;
    if (!id) return;
    try {
      await cancelarTarea(id);
      toast.success('Tarea cancelada correctamente');
      setViewingTareaId(null);
      setEditingTareaId(null);
      mutate();
    } catch (err) {
      console.error('Error al cancelar tarea:', err);
      toast.error('No se pudo cancelar la tarea');
    } finally {
      setIsConfirmingCancel(false);
    }
  };

  const handleOpenCrear = (dateInput?: Date | string) => {
    let dateStr: string | null = null;
    if (typeof dateInput === 'string') {
      dateStr = dateInput;
    } else if (dateInput) {
      const y = dateInput.getFullYear();
      const m = String(dateInput.getMonth() + 1).padStart(2, '0');
      const d = String(dateInput.getDate()).padStart(2, '0');
      if (dateInput.getHours() !== 0 || dateInput.getMinutes() !== 0) {
        const h = String(dateInput.getHours()).padStart(2, '0');
        const min = String(dateInput.getMinutes()).padStart(2, '0');
        dateStr = `${y}-${m}-${d}T${h}:${min}`;
      } else {
        dateStr = `${y}-${m}-${d}`;
      }
    }
    setSelectedDate(dateStr);
    setFormKey(prev => prev + 1);
    setIsCrearOpen(true);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    setTimeout(() => {
      calendarRef.current?.getApi().updateSize();
    }, 350);
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    setCurrentTitle(arg.view.title);
    setRange({ start: arg.startStr, end: arg.endStr });
  };

  const handleEventChange = (arg: EventChangeArg) => {
    const { event } = arg;
    const newStart = event.start?.toISOString();
    if (!newStart) return;

    const duracionNueva = event.end
      ? Math.round((event.end.getTime() - event.start!.getTime()) / 60000)
      : (event.extendedProps as CalendarEvent).duracionMinutos;

    const optimisticData = listaEventos.map(e => e.id === event.id ? {
      ...e,
      fechaInicio: newStart,
      duracionMinutos: duracionNueva
    } : e);

    mutate(optimisticData, false);
    toast.success('Evento reprogramado localmente');

    reprogramarEvento(event.id, {
      fechaInicio: newStart,
      duracionMinutos: duracionNueva
    })
      .then(() => mutate())
      .catch((error) => {
        console.error('Error al reprogramar evento:', error);
        toast.error('Error al sincronizar el cambio. Revirtiendo...');
        arg.revert();
        mutate();
      });
  };

  const changeView = (type: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => {
    setViewType(type);
    calendarRef.current?.getApi().changeView(type);
  };

  return {
    calendarRef,
    containerRef,
    viewType,
    currentTitle,
    isFullScreen,
    syncing,
    isLoading,
    listaEventos,
    isCrearOpen,
    viewingTareaId,
    editingTareaId,
    isConfirmingCancel,
    selectedDate,
    formKey,
    selectedTarea,
    handleCancelar,
    handleOpenCrear,
    toggleFullScreen,
    handleDatesSet,
    handleEventChange,
    changeView,
    setIsCrearOpen,
    setViewingTareaId,
    setEditingTareaId,
    setIsConfirmingCancel,
    setSelectedDate,
    mutate
  };
};
