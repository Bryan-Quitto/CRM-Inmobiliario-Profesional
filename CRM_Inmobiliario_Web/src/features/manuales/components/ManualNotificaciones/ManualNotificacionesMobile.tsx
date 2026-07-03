import { Bell, Clock, Bot, RefreshCw } from 'lucide-react';
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
          <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">Recibe alertas directas en tu celular para tareas pendientes o si la IA requiere tu ayuda.</p>
        </ManualSection>

        <ManualSection title="2. Notificaciones Recurrentes" icon={<Clock className="w-5 h-5" />}>
          <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <h3 className="font-bold text-slate-800 text-xs mb-1 flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-indigo-500" /> Activar Notificaciones</h3>
            <p className="text-xs text-slate-600">Botón para autorizar a tu celular a recibir notificaciones emergentes.</p>
          </div>

          <div className="space-y-3">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-800 text-xs mb-1">Tareas Atrasadas</h4>
              <p className="text-xs text-slate-600 mb-1"><strong>Frecuencia:</strong> Cada cuánto avisar (Máx: 24h).</p>
              <p className="text-xs text-slate-600"><strong>Límite:</strong> Hasta cuándo insistir (Máx: 3 días).</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-800 text-xs mb-1">Tareas de Hoy</h4>
              <p className="text-xs text-slate-600 mb-1"><strong>Anticipación:</strong> Cuánto antes avisar (Máx: 3 días).</p>
              <p className="text-xs text-slate-600"><strong>Recordatorio:</strong> Cada cuánto avisar (Máx: 24h).</p>
            </div>

            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <h3 className="font-bold text-indigo-900 text-xs mb-2 flex items-center gap-1.5"><Bot className="w-4 h-4 text-indigo-600" /> Ayuda de IA</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-indigo-800 mb-1"><strong>Frecuencia:</strong> Cada cuánto avisar (Máx 24h).</p>
                  <p className="text-xs text-indigo-800 mb-2"><strong>Reintentos:</strong> Límite de avisos (1 a 5).</p>
                  
                  <div className="bg-white p-2.5 rounded border border-indigo-200 text-xs text-slate-700">
                    <strong className="text-rose-600">¡Importante!</strong> Si no respondes la ayuda de la IA, ésta enviará un mensaje automático al cliente tras 5 minutos.
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
