import React from 'react';
import { Loader2, Plus, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import type { CalendarioViewLogic } from '../hooks/useCalendarioViewLogic';
import { CalendarioModals } from './calendario-sections/CalendarioModals';
import { HelpButton } from '../../../components/ui/HelpButton';
import { TruncatedText } from '@/components/ui/TruncatedText';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { toast } from 'sonner';

interface Props {
  logic: CalendarioViewLogic;
}

export const CalendarioViewMobile: React.FC<Props> = ({ logic }) => {
  const {
    isLoading,
    syncing,
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
    setIsCrearOpen,
    setViewingTareaId,
    setEditingTareaId,
    setIsConfirmingCancel,
    setSelectedDate,
    mutate
  } = logic;
  const { canWrite } = useSubscriptionGuard();

  // Filtrar eventos futuros o pendientes y ordenar
  const eventosOrdenados = [...listaEventos]
    .filter(e => e.estado !== 'Completada')
    .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative">
      {/* Header Móvil */}
      <div className="bg-white px-2 py-2 border-b border-slate-200 shadow-sm sticky top-0 z-20 flex justify-between items-center">
        <div>
          <div className="flex items-start gap-2">
            <h1 className="text-base md:text-xl font-bold text-slate-900">Agenda</h1>
            <div className="pt-0.5 shrink-0">
              <HelpButton title="Productividad y Organización" path="/docs/manuales/manual_productividad.md" />
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">{new Date().toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <button
          onClick={(e) => {
            if (!canWrite) {
              e.preventDefault();
              toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.');
              return;
            }
            handleOpenCrear();
          }}
          className={`bg-blue-600 text-white p-3 rounded-xl shadow-md shadow-blue-600/20 active:scale-95 transition-transform ${!canWrite ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Sincronización */}
      {syncing && listaEventos.length > 0 && (
        <div className="bg-blue-50 px-2 py-2 flex items-center justify-center gap-2 border-b border-blue-100">
          <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
          <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Sincronizando...</span>
        </div>
      )}

      {/* Lista de Eventos */}
      <main className="flex-1 overflow-auto p-2 flex flex-col gap-2">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-50">
            <Loader2 size={32} className="text-slate-400 animate-spin" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cargando...</span>
          </div>
        ) : eventosOrdenados.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center opacity-50 px-3">
            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
              <CalendarIcon size={32} className="text-slate-400" />
            </div>
            <div>
              <p className="font-bold text-slate-700 text-sm md:text-lg mb-1">Día Libre</p>
              <p className="text-sm text-slate-500">No hay tareas pendientes en tu agenda.</p>
            </div>
          </div>
        ) : (
          eventosOrdenados.map(evento => {
            const date = new Date(evento.fechaInicio);
            return (
              <div
                key={evento.id}
                onClick={() => setViewingTareaId(evento.id)}
                className="bg-white w-full p-2 rounded-xl border border-slate-200 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                style={{ borderLeftColor: evento.colorHex || '#3b82f6', borderLeftWidth: '4px' }}
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h3 className="font-bold text-slate-900 text-base leading-tight flex-1 break-words">{evento.titulo}</h3>
                  <span className={`shrink-0 text-xs font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                    evento.estado === 'Pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {evento.estado}
                  </span>
                </div>
                
                <div className="flex flex-col gap-1.5 mt-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <Clock size={14} className="shrink-0 text-slate-400" />
                    <span>
                      {date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })} • {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {evento.lugar && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <MapPin size={14} className="shrink-0 text-slate-400" />
                      <TruncatedText as="span" className="truncate">{evento.lugar}</TruncatedText>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
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
    </div>
  );
};
