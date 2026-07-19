import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { Loader2, Plus } from 'lucide-react';
import type { CalendarioViewLogic } from '../hooks/useCalendarioViewLogic';
import { CalendarioHeader } from './calendario-sections/CalendarioHeader';
import { CalendarioEventContent } from './calendario-sections/CalendarioEventContent';
import { CalendarioModals } from './calendario-sections/CalendarioModals';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { toast } from 'sonner';

const FC_LOCALES = [esLocale];

interface Props {
  logic: CalendarioViewLogic;
}

export const CalendarioViewDesktop: React.FC<Props> = ({ logic }) => {
  const {
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
    handleCompletar,
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
    mutate,
    calendarEvents,
    handleEventDidMount,
    handleEventClick
  } = logic;
  const { canWrite } = useSubscriptionGuard();

  const renderDayCell = (arg: { date: Date; dayNumberText: string; isToday: boolean }) => {
    return (
      <div className="flex flex-col h-full w-full group relative min-h-[40px] z-10 transition-colors hover:bg-slate-50/50 cursor-pointer">
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 p-1 bg-blue-600 text-white rounded-md shadow-sm transition-all z-20 pointer-events-none flex items-center justify-center">
          <Plus size={12} strokeWidth={3} />
        </div>
        <div className="absolute top-2 right-2 z-10 pointer-events-none">
          <span className={`text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full transition-all ${arg.isToday
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
    <div className={`flex flex-col bg-slate-50 overflow-hidden transition-all duration-500 ${isFullScreen
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

      <CalendarioHeader 
        calendarRef={calendarRef}
        currentTitle={currentTitle}
        viewType={viewType}
        isFullScreen={isFullScreen}
        toggleFullScreen={toggleFullScreen}
        changeView={changeView}
        onOpenCrear={() => handleOpenCrear()}
      />

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

        <div ref={containerRef} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 h-full">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={viewType}
            headerToolbar={false}
            events={calendarEvents}
            editable={canWrite}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={4}
            moreLinkClick="popover"
            weekends={true}
            locale="es"
            locales={FC_LOCALES}
            datesSet={handleDatesSet}
            eventDrop={handleEventChange}
            eventResize={handleEventChange}
            eventClick={handleEventClick}
            dayCellContent={renderDayCell}
            eventContent={(info) => <CalendarioEventContent eventInfo={info} />}
            eventDidMount={handleEventDidMount}
            select={(arg) => {
              if (!canWrite) {
                toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.');
                return;
              }
              handleOpenCrear(arg.start);
            }}
            timeZone="local"
            nowIndicator={true}
            height="100%"
            dayHeaderClassNames="bg-slate-50 py-3 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200"
            slotLabelClassNames="text-slate-400 font-medium text-[10px]"
          />
        </div>
      </main>

      <CalendarioModals 
        isCrearOpen={isCrearOpen}
        viewingTareaId={viewingTareaId}
        editingTareaId={editingTareaId}
        isConfirmingCancel={isConfirmingCancel}
        selectedDate={selectedDate}
        formKey={formKey}
        selectedTarea={selectedTarea}
        onCloseAll={() => { setIsCrearOpen(false); setViewingTareaId(null); setEditingTareaId(null); setSelectedDate(null); }}
        onSuccessCrear={() => { setIsCrearOpen(false); setSelectedDate(null); mutate(); }}
        onSuccessEdit={() => { setEditingTareaId(null); mutate(); }}
        onCancelConfirm={handleCancelar}
        onEditRequest={() => { setEditingTareaId(viewingTareaId); setViewingTareaId(null); }}
        onCancelTaskRequest={() => setIsConfirmingCancel(true)}
        onCompleteTaskRequest={handleCompletar}
        onBackFromDetail={() => setViewingTareaId(null)}
        onCloseConfirm={() => setIsConfirmingCancel(false)}
      />

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
