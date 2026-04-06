import React, { useState, useRef, useMemo } from 'react';
import useSWR, { SWRConfig } from 'swr';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { toast } from 'sonner';
import type { CalendarEvent } from '../types';
import type { Tarea } from '../../tareas/types';
import { getEventos } from '../api/getEventos';
import { reprogramarEvento } from '../api/reprogramarEvento';
import { cancelarTarea } from '../../tareas/api/cancelarTarea';
import { 
  Calendar, 
  Loader2, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2,
  Phone,
  MapPin,
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DatesSetArg, EventChangeArg, EventClickArg, EventContentArg, EventMountArg } from '@fullcalendar/core';
import { localStorageProvider, swrDefaultConfig } from '@/lib/swr';
import { TareaDetalle } from '../../tareas/components/TareaDetalle';
import ConfirmModal from '../../../components/ConfirmModal';

// Mapeo de iconos por tipo de tarea con tipado fuerte
const TIPO_ICONS: Record<string, LucideIcon> = {
  'Llamada': Phone,
  'Visita': MapPin,
  'Reunión': Users,
  'Trámite': Briefcase,
};

// Carga perezosa de los formularios de tareas para no penalizar el calendario
const CrearTareaForm = React.lazy(() => import('../../tareas/components/CrearTareaForm').then(m => ({ default: m.CrearTareaForm })));
const EditarTareaForm = React.lazy(() => import('../../tareas/components/EditarTareaForm').then(m => ({ default: m.EditarTareaForm })));

const CalendarioContent: React.FC = () => {
  const calendarRef = useRef<FullCalendar>(null);
  const [viewType, setViewType] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
  const [currentTitle, setCurrentTitle] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [range, setRange] = useState({ start: '', end: '' });
  
  // SWR: Carga reactiva basada en el rango visible
  const { data: eventos, isValidating: syncing, mutate } = useSWR<CalendarEvent[]>(
    range.start && range.end ? [`/calendario`, range.start, range.end] : null,
    () => getEventos(range.start, range.end),
    swrDefaultConfig
  );

  // listaEventos garantiza un array para evitar errores de tipado 'undefined'
  const listaEventos = useMemo(() => eventos || [], [eventos]);

  // isLoading solo es TRUE cuando no hay datos en absoluto (ni cache ni respuesta) Y se está validando.
  const isLoading = eventos === undefined && syncing;

  // Estados para gestión de modales
  const [isCrearOpen, setIsCrearOpen] = useState(false);
  const [viewingTareaId, setViewingTareaId] = useState<string | null>(null);
  const [editingTareaId, setEditingTareaId] = useState<string | null>(null);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0); 

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

  // Manejador de cambio de fechas/vistas en FullCalendar
  const handleDatesSet = (arg: DatesSetArg) => {
    setCurrentTitle(arg.view.title);
    setRange({ start: arg.startStr, end: arg.endStr });
  };

  // Reprogramación rápida (Drag & Drop / Resizing) - Política Zero Wait
  const handleEventChange = async (arg: EventChangeArg) => {
    const { event } = arg;
    const newStart = event.start?.toISOString();

    if (!newStart) return;

    const duracionNueva = event.end 
      ? Math.round((event.end.getTime() - event.start!.getTime()) / 60000) 
      : (event.extendedProps as CalendarEvent).duracionMinutos;

    // Usamos listaEventos para asegurar el mapeo correcto
    const optimisticData = listaEventos.map(e => e.id === event.id ? { 
      ...e, 
      fechaInicio: newStart, 
      duracionMinutos: duracionNueva 
    } : e);

    try {
      await mutate(reprogramarEvento(event.id, {
        fechaInicio: newStart,
        duracionMinutos: duracionNueva
      }).then(() => optimisticData), {
        optimisticData,
        rollbackOnError: true,
        revalidate: true
      });
      toast.success('Evento reprogramado exitosamente');
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Error al reprogramar evento:', error);
      toast.error('Error al sincronizar el cambio. Revirtiendo...');
      arg.revert(); 
    }
  };

  // Mapeo de eventos de negocio a formato FullCalendar
  const calendarEvents = useMemo(() => listaEventos.map(e => ({
    id: e.id,
    title: e.titulo,
    start: e.fechaInicio,
    end: new Date(new Date(e.fechaInicio).getTime() + (e.duracionMinutos * 60000)).toISOString(),
    backgroundColor: e.estado === 'Completada' ? '#f1f5f9' : `${e.colorHex || '#3b82f6'}15`,
    borderColor: e.estado === 'Completada' ? '#cbd5e1' : (e.colorHex || '#3b82f6'),
    textColor: '#0f172a',
    editable: e.estado === 'Pendiente',
    classNames: [
      'rounded-md border-l-4 shadow-sm transition-all cursor-pointer !border-y-0 !border-r-0',
      e.estado !== 'Pendiente' ? 'opacity-70' : 'hover:shadow-md hover:bg-opacity-100'
    ],
    extendedProps: { ...e },
    description: e.titulo 
  })), [listaEventos]);

  // Renderizado personalizado del contenido del evento
  const renderEventContent = (eventInfo: EventContentArg) => {
    const props = eventInfo.event.extendedProps as CalendarEvent;
    const isCompleted = props.estado === 'Completada';
    const isCancelled = props.estado === 'Cancelada';
    const isOverdue = !isCompleted && !isCancelled && new Date(props.fechaInicio) < new Date();
    
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

        {isOverdue && (
          <div className="absolute top-1 right-1 flex h-1.5 w-1.5">
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
          </div>
        )}
      </div>
    );
  };

  const handleEventDidMount = (info: EventMountArg) => {
    info.el.setAttribute('title', info.event.title);
  };

  const handleEventClick = (arg: EventClickArg) => {
    setViewingTareaId(arg.event.id);
  };

  const renderDayCell = (arg: { date: Date; dayNumberText: string; isToday: boolean }) => (
    <div className="flex flex-col h-full w-full group relative min-h-[40px] z-10 transition-colors hover:bg-slate-50/50">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleOpenCrear(arg.date);
        }}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 p-1 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-all cursor-pointer active:scale-90 z-20"
        title="Añadir evento este día"
      >
        <Plus size={12} strokeWidth={3} />
      </button>

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

  return (
    <div className={`flex flex-col bg-slate-50 overflow-hidden transition-all duration-500 ${
      isFullScreen 
        ? 'fixed inset-0 z-[150] h-screen w-screen' 
        : 'h-screen relative'
    }`}>
      {/* Indicador de Sincronización UPSP */}
      {syncing && listaEventos.length > 0 && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/90 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando Agenda...</span>
          </div>
        </div>
      )}

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
            {['dayGridMonth', 'timeGridWeek', 'timeGridDay'].map((type) => (
              <button 
                key={type}
                onClick={() => { setViewType(type as 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'); calendarRef.current?.getApi().changeView(type); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewType === type ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {type === 'dayGridMonth' ? 'Mes' : type === 'timeGridWeek' ? 'Semana' : 'Día'}
              </button>
            ))}
          </div>

          <button 
            onClick={toggleFullScreen}
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
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-50/50 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={40} className="text-blue-600 animate-spin" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Cargando Agenda...</p>
            </div>
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
            eventContent={renderEventContent}
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

      {/* Capa de Modales Global Fixed */}
      <React.Suspense fallback={null}>
        {(isCrearOpen || viewingTareaId || editingTareaId) && (
          <div className="fixed inset-0 z-[300] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={() => { setIsCrearOpen(false); setViewingTareaId(null); setEditingTareaId(null); setSelectedDate(null); }}></div>
            
            <div className="relative w-full max-w-lg h-full bg-white shadow-2xl animate-in slide-in-from-right duration-500 border-l border-slate-100">
              {isCrearOpen && (
                <CrearTareaForm 
                  key={`crear-${formKey}`}
                  fechaInicial={selectedDate || undefined}
                  onSuccess={() => { setIsCrearOpen(false); setSelectedDate(null); mutate(); }} 
                  onCancel={() => { setIsCrearOpen(false); setSelectedDate(null); }} 
                />
              )}
              {viewingTareaId && selectedTarea && (
                <TareaDetalle 
                  tarea={selectedTarea}
                  onEdit={() => { setEditingTareaId(viewingTareaId); setViewingTareaId(null); }}
                  onCancelTask={() => setIsConfirmingCancel(true)}
                  onBack={() => setViewingTareaId(null)}
                />
              )}
              {editingTareaId && selectedTarea && (
                <EditarTareaForm 
                  tareaId={editingTareaId} 
                  initialData={selectedTarea}
                  onSuccess={() => { setEditingTareaId(null); mutate(); }} 
                  onCancel={() => { setEditingTareaId(null); }} 
                  onCancelTask={() => setIsConfirmingCancel(true)}
                />
              )}
            </div>
          </div>
        )}
        <ConfirmModal 
          isOpen={isConfirmingCancel}
          title="¿Cancelar Tarea?"
          description="Esta acción no se puede deshacer. La tarea quedará marcada como cancelada en el historial."
          confirmText="Sí, cancelar"
          type="danger"
          onConfirm={handleCancelar}
          onClose={() => setIsConfirmingCancel(false)}
        />
      </React.Suspense>

      <style>{`
        .fc { font-family: inherit; --fc-border-color: #cbd5e1; --fc-today-bg-color: transparent; }
        .fc .fc-button-primary { background-color: #3b82f6; border: none; font-weight: 700; border-radius: 0.75rem; }
        .fc-theme-standard td, .fc-theme-standard th { border-color: #cbd5e1; border-width: 1px; }
        .fc-event-main { color: white; padding: 0 !important; height: 100%; width: 100%; }
        .fc-timegrid-event { min-height: 48px !important; border-radius: 8px !important; margin-bottom: 2px !important; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important; }
        .fc-daygrid-event { min-height: 24px !important; margin-top: 2px !important; }
        .fc-day-today { background-color: #eff6ff !important; }
        .fc .fc-toolbar-title { font-size: 1.125rem; font-weight: 800; color: #0f172a; }
        .fc-popover { border-radius: 1.5rem; border: 1px solid #f1f5f9; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); }
        .fc-daygrid-day-frame { min-height: 120px !important; }
      `}</style>
    </div>
  );
};

export const CalendarioView: React.FC = () => {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      <CalendarioContent />
    </SWRConfig>
  );
};

export default CalendarioView;
