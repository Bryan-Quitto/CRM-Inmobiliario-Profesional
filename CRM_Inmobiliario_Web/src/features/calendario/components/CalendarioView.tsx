import React, { useState, useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { toast } from 'sonner';
import type { CalendarEvent } from '../types';
import { getEventos } from '../api/getEventos';
import { reprogramarEvento } from '../api/reprogramarEvento';
import { Calendar, Loader2, Plus, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import type { DatesSetArg, EventChangeArg, EventClickArg, EventMountArg } from '@fullcalendar/core';

// Carga perezosa de los formularios de tareas para no penalizar el calendario
const CrearTareaForm = React.lazy(() => import('../../tareas/components/CrearTareaForm').then(m => ({ default: m.CrearTareaForm })));
const EditarTareaForm = React.lazy(() => import('../../tareas/components/EditarTareaForm').then(m => ({ default: m.EditarTareaForm })));

const CalendarioView: React.FC = () => {
  const [eventos, setEventos] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);
  const [viewType, setViewType] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
  const [currentTitle, setCurrentTitle] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Estados para gestión de modales
  const [isCrearOpen, setIsCrearOpen] = useState(false);
  const [editingTareaId, setEditingTareaId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0); // Llave para forzar reinicio del formulario

  // Función unificada para abrir creación con corrección de desfase
  const handleOpenCrear = (dateInput?: Date) => {
    let dateStr: string | null = null;

    if (dateInput) {
      const date = new Date(dateInput.getTime());
      
      // Si la fecha viene de una celda de cuadrícula (medianoche), sumamos 1 día para compensar FullCalendar
      if (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0) {
        date.setDate(date.getDate() + 1);
      }

      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      dateStr = `${y}-${m}-${d}`;
    }

    setSelectedDate(dateStr);
    setFormKey(prev => prev + 1);
    setIsCrearOpen(true);
  };

  // Manejador de selección de rango (clic en cuadrícula)
  const handleSelect = (arg: { start: Date }) => {
    handleOpenCrear(arg.start);
  };

  // Función para alternar pantalla completa
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    // Forzamos un re-render del calendario para que se ajuste al nuevo tamaño tras la animación
    setTimeout(() => {
      calendarRef.current?.getApi().updateSize();
    }, 350);
  };

  // Carga de eventos según el rango visible en el calendario
  const cargarEventos = useCallback(async (start: string, end: string) => {
    setIsLoading(true);
    try {
      const data = await getEventos(start, end);
      setEventos(data);
    } catch (error: unknown) {
      console.error('Error al cargar eventos del calendario:', error);
      toast.error('No se pudieron cargar los eventos del calendario.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para forzar el refresco de los eventos en el rango actual
  const refreshActualRange = () => {
    const api = calendarRef.current?.getApi();
    if (api) {
      cargarEventos(api.view.activeStart.toISOString(), api.view.activeEnd.toISOString());
    }
  };

  // Manejador de cambio de fechas/vistas en FullCalendar
  const handleDatesSet = (arg: DatesSetArg) => {
    setCurrentTitle(arg.view.title);
    cargarEventos(arg.startStr, arg.endStr);
  };

  // Reprogramación rápida (Drag & Drop / Resizing) - Política Zero Wait
  const handleEventChange = async (arg: EventChangeArg) => {
    const { event } = arg;
    const newStart = event.start?.toISOString();

    if (!newStart) return;

    try {
      await reprogramarEvento(event.id, {
        fechaInicio: newStart,
        duracionMinutos: event.end 
          ? Math.round((event.end.getTime() - event.start!.getTime()) / 60000) 
          : undefined
      });
      toast.success('Evento reprogramado exitosamente');
    } catch (error: unknown) {
      console.error('Error al reprogramar evento:', error);
      toast.error('Error al sincronizar el cambio. Revirtiendo...');
      arg.revert(); // Revierte el movimiento visual si la API falla
    }
  };

  // Mapeo de eventos de negocio a formato FullCalendar
  const calendarEvents = eventos.map(e => ({
    id: e.id,
    title: e.titulo,
    start: e.fechaInicio,
    end: new Date(new Date(e.fechaInicio).getTime() + (e.duracionMinutos * 60000)).toISOString(),
    backgroundColor: e.estado === 'Completada' ? '#94a3b8' : (e.colorHex || '#3b82f6'),
    borderColor: e.estado === 'Completada' ? '#94a3b8' : (e.colorHex || '#3b82f6'),
    editable: e.estado === 'Pendiente', // Solo tareas pendientes son editables/movibles
    classNames: [
      'rounded-lg border-none px-2 py-1 text-[11px] font-bold shadow-sm transition-all cursor-pointer',
      e.estado !== 'Pendiente' ? 'opacity-60 grayscale-[0.3]' : 'hover:scale-[1.02] hover:shadow-md'
    ],
    extendedProps: { ...e },
    // Tooltip nativo para legibilidad rápida
    description: e.titulo 
  }));

  // Manejador de renderizado de evento para añadir el tooltip
  const handleEventDidMount = (info: EventMountArg) => {
    info.el.setAttribute('title', info.event.title);
  };

  // Manejador de clic en un evento
  const handleEventClick = (arg: EventClickArg) => {
    const { event } = arg;
    if (event.extendedProps.estado !== 'Pendiente') {
      toast.info('Este evento ya está finalizado y es de solo lectura.');
      return;
    }
    setEditingTareaId(event.id);
  };

  // Renderizado personalizado de la celda del día (Mes)
  const renderDayCell = (arg: { date: Date; dayNumberText: string; isToday: boolean }) => {
    return (
      <div className="flex flex-col h-full w-full group relative min-h-[40px] z-10 transition-colors hover:bg-slate-50/50">
        {/* Botón "+" en la esquina superior izquierda */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Pasamos el objeto Date directamente para que handleOpenCrear lo gestione
            handleOpenCrear(arg.date);
          }}
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 p-1 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-all cursor-pointer active:scale-90 z-20"
          title="Añadir evento este día"
        >
          <Plus size={12} strokeWidth={3} />
        </button>

        {/* Número del día en la esquina superior derecha */}
        <div className="absolute top-2 right-2 z-10">
          <span className={`text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full transition-all ${
            arg.isToday 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-200 ring-2 ring-blue-50' 
              : 'text-slate-500 group-hover:text-slate-900 group-hover:bg-white group-hover:shadow-sm'
          }`}>
            {arg.dayNumberText}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col bg-slate-50 overflow-hidden transition-all duration-500 ${
      isFullScreen 
        ? 'fixed inset-0 z-[150] h-screen w-screen' 
        : 'h-screen relative'
    }`}>
      {/* Header Profesional */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Calendario</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestión de Agenda</p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-100 hidden md:block"></div>

          {/* Navegación y Título Dinámico */}
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button 
                onClick={() => calendarRef.current?.getApi().prev()}
                className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg transition-all text-slate-500 cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => calendarRef.current?.getApi().today()}
                className="px-3 py-1.5 hover:bg-white hover:text-blue-600 rounded-lg text-xs font-bold transition-all text-slate-500 cursor-pointer"
              >
                Hoy
              </button>
              <button 
                onClick={() => calendarRef.current?.getApi().next()}
                className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg transition-all text-slate-500 cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <h2 className="text-sm font-black text-slate-700 capitalize min-w-[150px]">
              {currentTitle}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => { setViewType('dayGridMonth'); calendarRef.current?.getApi().changeView('dayGridMonth'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewType === 'dayGridMonth' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Mes
            </button>
            <button 
              onClick={() => { setViewType('timeGridWeek'); calendarRef.current?.getApi().changeView('timeGridWeek'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewType === 'timeGridWeek' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Semana
            </button>
            <button 
              onClick={() => { setViewType('timeGridDay'); calendarRef.current?.getApi().changeView('timeGridDay'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewType === 'timeGridDay' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Día
            </button>
          </div>

          <button 
            onClick={toggleFullScreen}
            title={isFullScreen ? "Salir de pantalla completa" : "Pantalla completa"}
            className="p-2 bg-slate-100 text-slate-500 hover:bg-white hover:text-blue-600 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-sm active:scale-90"
          >
            {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>

          <div className="h-8 w-px bg-slate-100 mx-1"></div>

          <button 
            onClick={() => handleOpenCrear()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-100 cursor-pointer active:scale-95"
          >
            <Plus size={18} />
            <span>Nuevo Evento</span>
          </button>
        </div>
      </header>

      {/* Área Principal del Calendario */}
      <main className="flex-1 p-6 relative overflow-auto">
        {isLoading && (
          <div className="absolute top-10 right-10 z-20 bg-white/80 backdrop-blur-sm p-2 rounded-full border border-slate-200 shadow-sm">
            <Loader2 size={20} className="text-blue-600 animate-spin" />
          </div>
        )}
        
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 h-full">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={viewType}
            headerToolbar={false}
            events={calendarEvents}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={4}
            moreLinkClick="popover"
            weekends={true}
            locale="es"
            datesSet={handleDatesSet}
            eventDrop={handleEventChange}
            eventResize={handleEventChange}
            eventClick={handleEventClick}
            dayCellContent={renderDayCell}
            eventDidMount={handleEventDidMount}
            select={handleSelect}
            timeZone="local"
            nowIndicator={true}
            height="100%"
            dayHeaderClassNames="bg-slate-50 py-3 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200"
            slotLabelClassNames="text-slate-400 font-medium text-[10px]"
          />
        </div>
      </main>

      {/* Capa de Modales Global Fixed (Fuera del overflow del calendario) */}
      <React.Suspense fallback={null}>
        {(isCrearOpen || editingTareaId) && (
          <div className="fixed inset-0 z-[200] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Click fuera para cerrar */}
            <div className="absolute inset-0" onClick={() => { setIsCrearOpen(false); setEditingTareaId(null); setSelectedDate(null); }}></div>
            
            <div className="relative w-full max-w-lg h-full bg-white shadow-2xl animate-in slide-in-from-right duration-500 border-l border-slate-100">
              {isCrearOpen && (
                <CrearTareaForm 
                  key={`crear-${formKey}`}
                  fechaInicial={selectedDate || undefined}
                  onSuccess={() => { setIsCrearOpen(false); setSelectedDate(null); refreshActualRange(); }} 
                  onCancel={() => { setIsCrearOpen(false); setSelectedDate(null); }} 
                />
              )}
              {editingTareaId && (
                <EditarTareaForm 
                  tareaId={editingTareaId} 
                  onSuccess={() => { setEditingTareaId(null); refreshActualRange(); }} 
                  onCancel={() => { setEditingTareaId(null); }} 
                />
              )}
            </div>
          </div>
        )}
      </React.Suspense>

      {/* Inyección de estilos CSS para FullCalendar en Tailwind */}
      <style>{`
        .fc { font-family: inherit; --fc-border-color: #cbd5e1; --fc-today-bg-color: transparent; }
        .fc .fc-button-primary { background-color: #3b82f6; border: none; font-weight: 700; border-radius: 0.75rem; }
        .fc .fc-col-header-cell-cushion { padding: 8px 4px; }
        .fc-theme-standard td, .fc-theme-standard th { border-color: #cbd5e1; border-width: 1px; }
        .fc-event-main { color: white; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fc-daygrid-event { overflow: hidden; cursor: pointer; }
        .fc-day-today { background-color: #eff6ff !important; }
        .fc .fc-toolbar-title { font-size: 1.125rem; font-weight: 800; color: #0f172a; }
        .fc-more-link { font-size: 10px; font-weight: 800; color: #3b82f6; padding: 2px 8px; cursor: pointer; }
        .fc-popover { border-radius: 1.5rem; border: 1px solid #f1f5f9; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); }
        .fc-popover-header { background: #f8fafc; border-radius: 1.5rem 1.5rem 0 0; font-weight: 800; font-size: 12px; }
        .fc-daygrid-day-frame { min-height: 120px !important; }
        .fc-timegrid-now-indicator-line { border-color: #ef4444; border-width: 2px; }
        .fc-timegrid-now-indicator-arrow { border-color: #ef4444; border-width: 5px; }
      `}</style>
    </div>
  );
};

export default CalendarioView;
