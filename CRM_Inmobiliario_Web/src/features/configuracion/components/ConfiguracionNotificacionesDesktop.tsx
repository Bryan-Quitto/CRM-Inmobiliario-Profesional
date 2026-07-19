import React from 'react';
import { HelpButton } from '../../../components/ui/HelpButton';
import { Loader2, Bell, RefreshCw, BellOff, Info, Save } from 'lucide-react';
import { TimeDurationInput, type TimeUnit } from './TimeDurationInput';
import type { ConfiguracionNotificacionesLogicReturn } from '../hooks/useConfiguracionNotificacionesLogic';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { toast } from 'sonner';

interface Props {
  logic: ConfiguracionNotificacionesLogicReturn;
}

export const ConfiguracionNotificacionesDesktop: React.FC<Props> = ({ logic }) => {
  const {
    settings,
    isLoading,
    isSaving,
    isFormValid,
    agentId,
    isSupported,
    isSubscribed,
    isSubscribing,
    validation,
    actions
  } = logic;
  const { canWrite } = useSubscriptionGuard();

  const {
    isInvalidOverdueInterval,
    isInvalidOverdueMax,
    isInvalidTodayAdvance,
    isInvalidTodayInterval,
    isInvalidAiInterval,
    isInvalidAiRetries
  } = validation;

  const {
    handleChange,
    handleSubmit,
    subscribeToPush,
    resyncPushSubscription,
    unsubscribeFromPush
  } = actions;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48 max-w-3xl mx-auto hidden lg:flex">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full hidden lg:block">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  Notificaciones Recurrentes
                  <div className="pt-0.5"><HelpButton title="Notificaciones Recurrentes" path="/docs/manuales/manual_notificaciones.md" /></div>
                </h2>
                <p className="text-slate-500 text-sm mt-1">Configura la frecuencia con la que deseas recibir alertas sobre tus tareas.</p>
              </div>
            </div>
            
            {isSupported && !agentId && (
              <div className="flex flex-wrap items-center gap-2">
                {!isSubscribed ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      if (!canWrite) {
                        e.preventDefault();
                        toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.');
                        return;
                      }
                      subscribeToPush();
                    }}
                    disabled={isSubscribing || !canWrite}
                    className={`shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 ${!canWrite ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {isSubscribing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                    {isSubscribing ? 'Activando...' : 'Activar Notificaciones'}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        if (!canWrite) {
                          e.preventDefault();
                          toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.');
                          return;
                        }
                        resyncPushSubscription();
                      }}
                      disabled={isSubscribing || !canWrite}
                      className={`shrink-0 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${!canWrite ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSubscribing ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">{isSubscribing ? 'Sincronizando...' : 'Sincronizar Dispositivo'}</span>
                      <span className="sm:hidden">{isSubscribing ? '...' : 'Sync'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        if (!canWrite) {
                          e.preventDefault();
                          toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.');
                          return;
                        }
                        unsubscribeFromPush();
                      }}
                      disabled={isSubscribing || !canWrite}
                      className={`shrink-0 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl border border-rose-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${!canWrite ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <BellOff className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Desactivar</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <form onSubmit={(e) => {
            if (!canWrite) {
              e.preventDefault();
              toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.');
              return;
            }
            handleSubmit(e);
          }} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Frecuencia Tareas Atrasadas</label>
                <TimeDurationInput
                  value={settings.notifyOverdueTasksIntervalMinutes}
                  onChange={(val) => handleChange('notifyOverdueTasksIntervalMinutes', val)}
                  baseUnit="minutes"
                  allowedUnits={['minutes', 'hours', 'days']}
                  prefix="Cada"
                  disabled={!canWrite}
                  error={isInvalidOverdueInterval ? "Rango permitido: 1 a 1440 minutos (24h)." : undefined}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Límite Tareas Atrasadas</label>
                <TimeDurationInput
                  value={settings.notifyOverdueTasksMaxHours}
                  onChange={(val) => handleChange('notifyOverdueTasksMaxHours', val)}
                  baseUnit="hours"
                  allowedUnits={['hours', 'days']}
                  prefix="Hasta"
                  unitLabels={{ minutes: '', hours: 'Horas después', days: 'Días después' } as Record<TimeUnit, string>}
                  disabled={!canWrite}
                  error={isInvalidOverdueMax ? "Rango permitido: 1 a 72 horas (3 días)." : undefined}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Anticipación Tareas de Hoy</label>
                <TimeDurationInput
                  value={settings.notifyTodayTasksAdvanceMinutes}
                  onChange={(val) => handleChange('notifyTodayTasksAdvanceMinutes', val)}
                  baseUnit="minutes"
                  allowedUnits={['minutes', 'hours', 'days']}
                  unitLabels={{ minutes: 'Minutos antes', hours: 'Horas antes', days: 'Días antes' }}
                  disabled={!canWrite}
                  error={isInvalidTodayAdvance ? "Rango permitido: 1 a 4320 minutos (3 días)." : undefined}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Recordatorio Tareas de Hoy</label>
                <TimeDurationInput
                  value={settings.notifyTodayTasksIntervalMinutes}
                  onChange={(val) => handleChange('notifyTodayTasksIntervalMinutes', val)}
                  baseUnit="minutes"
                  allowedUnits={['minutes', 'hours', 'days']}
                  prefix="Cada"
                  disabled={!canWrite}
                  error={isInvalidTodayInterval ? "Rango permitido: 1 a 1440 minutos (24h)." : undefined}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-slate-700">Tareas de Ayuda de IA</label>
                  <div className="group relative">
                    <Info className="w-4 h-4 text-slate-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-10 text-center">
                      Esta notificación se dispara cuando la IA solicita tu asistencia. Si no respondes ni marcas la tarea como completada, la IA enviará automáticamente un mensaje al cliente después de 5 minutos.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                    </div>
                  </div>
                </div>
                <TimeDurationInput
                  value={settings.notifyAiHelpTasksIntervalMinutes}
                  onChange={(val) => handleChange('notifyAiHelpTasksIntervalMinutes', val)}
                  baseUnit="minutes"
                  allowedUnits={['minutes', 'hours', 'days']}
                  prefix="Cada"
                  disabled={!canWrite}
                  error={isInvalidAiInterval ? "Rango permitido: 1 a 1440 minutos (24h)." : undefined}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Reintentos Ayuda de IA (Max)</label>
                <div className="space-y-1">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    disabled={!canWrite}
                    className={`w-full px-4 py-2.5 bg-slate-50 border ${isInvalidAiRetries ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'} rounded-xl focus:ring-2 outline-none transition-all text-slate-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
                    value={settings.notifyAiHelpTasksMaxRetries}
                    onChange={(e) => handleChange('notifyAiHelpTasksMaxRetries', Number(e.target.value))}
                  />
                  {isInvalidAiRetries && <p className="text-[11px] text-rose-500 font-medium pl-1 leading-tight">Se permite de 1 a 5 reintentos.</p>}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving || !isFormValid}
                className={`px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50 ${!canWrite ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
