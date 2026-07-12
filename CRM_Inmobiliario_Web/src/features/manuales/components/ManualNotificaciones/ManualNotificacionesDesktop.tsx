import React from 'react';
import { Bell, Clock, Bot, RefreshCw, AlertTriangle } from 'lucide-react';
import { ManualSection } from '../../../../components/ui/manuales/ManualSection';

export const ManualNotificacionesDesktop: React.FC = () => {
  return (
    <div className="bg-slate-50 p-8 min-h-screen font-sans text-slate-800">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-2xl mb-4">
            <Bell className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Manual de Notificaciones y Alertas</h1>
          <p className="text-lg text-slate-500">Configura tus preferencias para mantener un seguimiento adecuado de tus tareas y mensajes importantes de la IA.</p>
        </header>

        <div className="space-y-8">
          <ManualSection title="1. Alertas y Notificaciones" icon={<Bell className="w-6 h-6 text-indigo-500" />}>
            <p className="text-slate-700"><strong>Notificaciones Directas:</strong> Recibe alertas en tu navegador web o celular para mantenerte al día con tu agenda y con las solicitudes de asistencia de la IA. Las notificaciones se envían tan pronto como el sistema las procesa, en aproximadamente <strong>1-2 minutos</strong>.</p>
          </ManualSection>

          <ManualSection title="2. ¿Cuándo se considera una tarea Vencida?" icon={<AlertTriangle className="w-6 h-6 text-rose-500" />}>
            <div className="bg-rose-50 border border-rose-200 p-5 rounded-xl mb-4">
              <p className="text-slate-700 mb-3">Una tarea se considera <strong className="text-rose-700">Atrasada</strong> en el momento exacto en que su <strong>hora de finalización</strong> queda en el pasado. (Nota: En el sistema la tarea sigue siendo "Pendiente", pero se agrupa visualmente como atrasada).</p>
              <div className="bg-white border border-rose-100 rounded-lg p-4 font-mono text-sm text-center text-rose-800">
                Hora de finalización = <strong>Fecha de Inicio</strong> + <strong>Duración (minutos)</strong>
              </div>
              <p className="text-sm text-slate-600 mt-3">Si una tarea tiene <strong>Fecha de Inicio: hoy a las 3:41 PM</strong> y <strong>Duración: 2 horas</strong>, el sistema calculará su vencimiento a las <strong>5:41 PM</strong> según el horario de Ecuador (UTC-5).</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="font-semibold text-amber-900">⚠️ Duración por defecto: 0 minutos</span>
              </div>
              <p className="text-sm text-amber-800">Si creas una tarea sin configurar duración (0 minutos), el sistema considerará que vence exactamente en su <strong>Fecha de Inicio</strong>, por lo que aparecerá como Atrasada en ese mismo instante. Te recomendamos configurar siempre la duración estimada.</p>
            </div>
          </ManualSection>

          <ManualSection title="3. Configuración de Notificaciones Recurrentes" icon={<Clock className="w-6 h-6 text-amber-500" />}>
            <p className="mb-4 text-slate-600">A continuación, te explicamos cómo ajustar tus preferencias para mantener un seguimiento adecuado de tus pendientes:</p>

            <div className="mb-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><RefreshCw className="w-5 h-5 text-indigo-500" /> Botones de Activación</h3>
              <p className="text-sm text-slate-700"><strong>Activar Notificaciones / Sincronizar Dispositivo / Desactivar:</strong> Sirve para autorizar a tu navegador o celular a recibir las alertas (notificaciones emergentes).</p>
            </div>

            <h3 className="font-bold text-slate-900 mb-3 text-lg">Campos de Configuración:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-1">Frecuencia Tareas Atrasadas</h4>
                <p className="text-sm text-slate-600 mb-2">Cada cuánto tiempo te recordaremos que tienes una tarea atrasada.</p>
                <div className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-medium">Desde 1 min hasta 7 días</div>
              </div>
              
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-1">Límite Tareas Atrasadas</h4>
                <p className="text-sm text-slate-600 mb-2">Hasta cuándo dejaremos de insistir en recordarte la tarea desde que venció.</p>
                <div className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-medium">Desde 1 hora hasta 3 días</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-1">Anticipación Tareas de Hoy</h4>
                <p className="text-sm text-slate-600 mb-2">Cuánto tiempo antes de la Fecha de Inicio de la tarea deseas recibir el primer aviso.</p>
                <div className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-medium">Desde 1 min hasta 7 días</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-1">Recordatorio Tareas de Hoy</h4>
                <p className="text-sm text-slate-600 mb-2">Cada cuánto tiempo se repetirá el aviso de la tarea mientras esté vigente (antes de vencer).</p>
                <div className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-medium">Desde 1 min hasta 7 días</div>
              </div>
            </div>

            <div className="mt-4 bg-indigo-50/50 p-5 rounded-xl border border-indigo-100/50">
              <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2"><Bot className="w-5 h-5 text-indigo-600" /> Configuración de Ayuda de IA</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-indigo-900 mb-1">Tareas de Ayuda de IA</h4>
                  <p className="text-sm text-slate-700 mb-2">Cada cuánto tiempo avisar cuando la IA pide ayuda. (Rango: Desde 1 min hasta 7 días).</p>
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm text-amber-900">
                    <strong>Importante:</strong> Si la IA escala una conversación y no respondes ni cierras la tarea en 5 minutos, se enviará al cliente automáticamente: <em>"En unos momentos [tu nombre] le ayudará con esa información."</em><br/><br/>
                    Esto se cancela si: respondiste al cliente o marcaste la tarea como Completada/Cancelada.
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-indigo-900 mb-1">Reintentos Ayuda de IA (Max)</h4>
                  <p className="text-sm text-slate-700">Cuántas veces como máximo la IA te enviará la alerta pidiendo ayuda.</p>
                  <div className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded font-medium mt-1">Entre 1 y 5 veces</div>
                </div>
              </div>
            </div>

          </ManualSection>
        </div>
      </div>
    </div>
  );
};
