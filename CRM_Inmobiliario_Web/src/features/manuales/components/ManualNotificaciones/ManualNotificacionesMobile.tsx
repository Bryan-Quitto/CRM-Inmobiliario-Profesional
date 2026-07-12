import React from 'react';
import { Bell, Clock, Bot, RefreshCw, AlertTriangle } from 'lucide-react';
import { ManualSection } from '../../../../components/ui/manuales/ManualSection';

export const ManualNotificacionesMobile: React.FC = () => {
  return (
    <div className="bg-white min-h-screen font-sans text-slate-800 p-4 pb-12">
      <header className="mb-8 border-b border-slate-100 pb-6 text-center">
        <div className="inline-flex items-center justify-center p-2 bg-indigo-50 rounded-xl mb-3">
          <Bell className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Notificaciones y Alertas</h1>
        <p className="text-sm text-slate-500 leading-relaxed">Configura el seguimiento de tareas y avisos de la IA.</p>
      </header>

      <div className="space-y-6">
        <ManualSection title="1. Alertas Generales" icon={<Bell className="w-5 h-5" />}>
          <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">Recibe alertas directas en tu celular para tareas pendientes o si la IA requiere tu ayuda (las alertas llegan en aprox. 1-2 minutos).</p>
        </ManualSection>

        <ManualSection title="2. ¿Cuándo vence una tarea?" icon={<AlertTriangle className="w-5 h-5 text-rose-500" />}>
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl mt-2">
            <p className="text-xs text-slate-700 mb-2">Una tarea se considera <strong className="text-rose-700">Atrasada</strong> cuando su hora de finalización queda en el pasado (se agrupa visualmente):</p>
            <div className="bg-white border border-rose-100 rounded p-2 text-center text-xs font-mono text-rose-800 mb-2">
              Fecha Inicio + Duración = Hora de Vencimiento
            </div>
            <p className="text-xs text-slate-600">El sistema calculará el vencimiento según el horario de Ecuador (UTC-5).</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mt-2 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">⚠️ <strong>Duración 0:</strong> Si no asignas duración, la tarea vencerá exactamente a su Fecha de Inicio (estará atrasada al instante). Configura siempre la duración.</p>
          </div>
        </ManualSection>

        <ManualSection title="3. Notificaciones Recurrentes" icon={<Clock className="w-5 h-5" />}>
          <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <h3 className="font-bold text-slate-800 text-xs mb-1 flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-indigo-500" /> Activar Notificaciones</h3>
            <p className="text-xs text-slate-600">Botón para autorizar a tu celular a recibir notificaciones emergentes.</p>
          </div>

          <div className="space-y-3">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-800 text-xs mb-1">Tareas Atrasadas</h4>
              <p className="text-xs text-slate-600 mb-1"><strong>Frecuencia:</strong> Cada cuánto avisar desde que venció (Rango: 1 min a 7 días).</p>
              <p className="text-xs text-slate-600"><strong>Límite:</strong> Hasta cuándo insistir desde el vencimiento (Rango: 1 hora a 3 días).</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-800 text-xs mb-1">Tareas de Hoy</h4>
              <p className="text-xs text-slate-600 mb-1"><strong>Anticipación:</strong> Cuánto antes de la Fecha de Inicio avisar (Rango: 1 min a 7 días).</p>
              <p className="text-xs text-slate-600"><strong>Recordatorio:</strong> Cada cuánto avisar mientras esté vigente (Rango: 1 min a 7 días).</p>
            </div>

            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <h3 className="font-bold text-indigo-900 text-xs mb-2 flex items-center gap-1.5"><Bot className="w-4 h-4 text-indigo-600" /> Ayuda de IA</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-indigo-800 mb-1"><strong>Frecuencia:</strong> Cada cuánto avisar (Rango: 1 min a 7 días).</p>
                  <p className="text-xs text-indigo-800 mb-2"><strong>Reintentos:</strong> Límite de avisos (1 a 5).</p>
                  
                  <div className="bg-white p-2.5 rounded border border-indigo-200 text-xs text-slate-700">
                    <strong className="text-rose-600">¡Importante!</strong> Si la IA escala y no respondes ni cierras la tarea en 5 min, enviará al cliente automáticamente: <em>"En unos momentos [tu nombre] le ayudará con esa información."</em>
                    <br/><br/>(Se cancela si respondes directamente o completas la tarea).
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ManualSection>
      </div>
    </div>
  );
};
