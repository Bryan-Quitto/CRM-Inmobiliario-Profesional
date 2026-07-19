import React from 'react';
import { HelpButton } from '../../../components/ui/HelpButton';
import { Loader2, Bell, RefreshCw, BellOff, Info, Save } from 'lucide-react';
import { TimeDurationInput, type TimeUnit } from './TimeDurationInput';
import type { ConfiguracionNotificacionesLogicReturn } from '../hooks/useConfiguracionNotificacionesLogic';
import { TruncatedText } from '@/components/ui/TruncatedText';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { toast } from 'sonner';

interface Props {
  logic: ConfiguracionNotificacionesLogicReturn;
}

export const ConfiguracionNotificacionesMobile: React.FC<Props> = ({ logic }) => {
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
      <div className="flex justify-center items-center h-48 w-full lg:hidden">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full block lg:hidden">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-4">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 leading-tight break-words flex items-center gap-2">
                Notificaciones Recurrentes
                <div className="shrink-0"><HelpButton title="Notificaciones Recurrentes" path="/docs/manuales/manual_notificaciones.md" /></div>
              </h2>
              <p className="text-slate-500 text-xs mt-1 leading-snug break-words">Configura la frecuencia de alertas sobre tus tareas.</p>
            </div>
          </div>
          
          {isSupported && !agentId && (
            <div className="flex flex-col gap-2 mb-4">
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
                  className={`w-full min-w-0 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 ${!canWrite ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {isSubscribing ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Bell className="w-4 h-4 shrink-0" />}
                  <TruncatedText as="span" className="truncate">{isSubscribing ? 'Activando...' : 'Activar Notificaciones'}</TruncatedText>
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
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
                    className={`w-full flex-1 min-w-0 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${!canWrite ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <RefreshCw className={`w-4 h-4 shrink-0 ${isSubscribing ? 'animate-spin' : ''}`} />
                    <TruncatedText as="span" className="truncate">{isSubscribing ? 'Sincronizando...' : 'Sincronizar'}</TruncatedText>
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
                    className={`w-full flex-1 min-w-0 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-semibold rounded-xl border border-rose-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${!canWrite ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <BellOff className="w-4 h-4 shrink-0" />
                    <TruncatedText as="span" className="truncate">Desactivar</TruncatedText>
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={(e) => {
            if (!canWrite) {
              e.preventDefault();
              toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.');
              return;
            }
            handleSubmit(e);
          }} className="space-y-5 w-full">
            <div className="flex flex-col gap-5 w-full">
              <div className="space-y-1.5 w-full">
                <label className="text-sm font-semibold text-slate-700 block break-words">Frecuencia Tareas Atrasadas</label>
                <TimeDurationInput
                  value={settings.notifyOverdueTasksIntervalMinutes}
                  onChange={(val) => handleChange('notifyOverdueTasksIntervalMinutes', val)}
                  baseUnit="minutes"
                  allowedUnits={['minutes', 'hours', 'days']}
                  prefix="Cada"
                  disabled={!canWrite}
                  error={isInvalidOverdueInterval ? "Rango: 1 a 1440 min (24h)." : undefined}
                />
              </div>

              <div className="space-y-1.5 w-full">
                <label className="text-sm font-semibold text-slate-700 block break-words">Límite Tareas Atrasadas</label>
                <TimeDurationInput
                  value={settings.notifyOverdueTasksMaxHours}
                  onChange={(val) => handleChange('notifyOverdueTasksMaxHours', val)}
                  baseUnit="hours"
                  allowedUnits={['hours', 'days']}
                  prefix="Hasta"
                  unitLabels={{ minutes: '', hours: 'Horas después', days: 'Días después' } as Record<TimeUnit, string>}
                  disabled={!canWrite}
                  error={isInvalidOverdueMax ? "Rango: 1 a 72 hrs (3 días)." : undefined}
                />
              </div>

              <div className="space-y-1.5 w-full">
                <label className="text-sm font-semibold text-slate-700 block break-words">Anticipación Tareas de Hoy</label>
                <TimeDurationInput
                  value={settings.notifyTodayTasksAdvanceMinutes}
                  onChange={(val) => handleChange('notifyTodayTasksAdvanceMinutes', val)}
                  baseUnit="minutes"
                  allowedUnits={['minutes', 'hours', 'days']}
                  unitLabels={{ minutes: 'Min. antes', hours: 'Horas antes', days: 'Días antes' }}
                  disabled={!canWrite}
                  error={isInvalidTodayAdvance ? "Rango: 1 a 4320 min (3 días)." : undefined}
                />
              </div>

              <div className="space-y-1.5 w-full">
                <label className="text-sm font-semibold text-slate-700 block break-words">Recordatorio Tareas de Hoy</label>
                <TimeDurationInput
                  value={settings.notifyTodayTasksIntervalMinutes}
                  onChange={(val) => handleChange('notifyTodayTasksIntervalMinutes', val)}
                  baseUnit="minutes"
                  allowedUnits={['minutes', 'hours', 'days']}
                  prefix="Cada"
                  disabled={!canWrite}
                  error={isInvalidTodayInterval ? "Rango: 1 a 1440 min (24h)." : undefined}
                />
              </div>

              <div className="space-y-1.5 w-full">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-semibold text-slate-700 flex-1 min-w-0 break-words">Tareas de Ayuda de IA</label>
                  <div className="group relative shrink-0">
                    <Info className="w-4 h-4 text-slate-400 active:text-slate-600" />
                    <div className="absolute bottom-full right-0 mb-2 w-56 p-2.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-active:opacity-100 group-active:visible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-10 shadow-lg leading-relaxed">
                      Esta notificación se dispara cuando la IA solicita tu asistencia. Si no respondes, enviará mensaje al cliente tras 5 min.
                      <div className="absolute top-full right-1 border-4 border-transparent border-t-slate-800"></div>
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
                  error={isInvalidAiInterval ? "Rango: 1 a 1440 min (24h)." : undefined}
                />
              </div>

              <div className="space-y-1.5 w-full">
                <label className="text-sm font-semibold text-slate-700 block break-words">Reintentos Ayuda de IA (Max)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  disabled={!canWrite}
                  className={`w-full px-4 py-2.5 bg-slate-50 border ${isInvalidAiRetries ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'} rounded-xl focus:ring-2 outline-none transition-all text-slate-700 text-sm font-bold text-center disabled:opacity-50 disabled:cursor-not-allowed`}
                  value={settings.notifyAiHelpTasksMaxRetries}
                  onChange={(e) => handleChange('notifyAiHelpTasksMaxRetries', Number(e.target.value))}
                />
                {isInvalidAiRetries && <p className="text-[11px] text-rose-500 font-medium pl-1 leading-tight mt-1 break-words">Se permite de 1 a 5 reintentos.</p>}
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving || !isFormValid}
                className={`w-full min-w-0 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:bg-indigo-800 focus:ring-4 focus:ring-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${!canWrite ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} shadow-sm`}
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                ) : (
                  <Save className="w-5 h-5 shrink-0" />
                )}
                <TruncatedText as="span" className="truncate">{isSaving ? 'Guardando...' : 'Guardar Cambios'}</TruncatedText>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
