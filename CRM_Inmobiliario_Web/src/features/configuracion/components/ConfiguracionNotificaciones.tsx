import React, { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/axios';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import { Save, Bell, Loader2, Info, Check, ChevronDown, RefreshCw } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface NotificationSettings {
  notifyOverdueTasksIntervalMinutes: number;
  notifyTodayTasksAdvanceMinutes: number;
  notifyTodayTasksIntervalMinutes: number;
  notifyAiHelpTasksIntervalMinutes: number;
  notifyAiHelpTasksMaxRetries: number;
  notifyOverdueTasksMaxHours: number;
}

export interface ConfiguracionNotificacionesProps {
  agentId?: string;
}

function CustomSelect<T extends string | number>({ 
  value, 
  onChange, 
  options,
  buttonClassName
}: { 
  value: T; 
  onChange: (value: T) => void; 
  options: { value: T; label: string }[]; 
  buttonClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative w-full" ref={selectRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClassName || `w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl text-left text-sm font-medium transition-all outline-none flex items-center justify-between group cursor-pointer text-slate-700`}
      >
        <span className="truncate pr-2">{selectedOpt?.label}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-2 animate-in fade-in zoom-in duration-200 origin-top">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`cursor-pointer w-full px-4 py-2.5 text-left text-sm font-medium flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  value === opt.value ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600'
                }`}
              >
                {opt.label}
                {value === opt.value && <Check className="h-4 w-4 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type TimeUnit = 'minutes' | 'hours' | 'days';

interface TimeDurationInputProps {
  value: number;
  onChange: (value: number) => void;
  baseUnit: 'minutes' | 'hours';
  allowedUnits: TimeUnit[];
  prefix?: string;
  unitLabels?: Record<TimeUnit, string>;
  error?: string;
}

const calculateBaseValue = (num: number, unit: TimeUnit, baseUnit: 'minutes' | 'hours') => {
  if (baseUnit === 'minutes') {
    if (unit === 'days') return Math.round(num * 1440);
    if (unit === 'hours') return Math.round(num * 60);
    return Math.round(num);
  } else {
    if (unit === 'days') return Math.round(num * 24);
    return Math.round(num);
  }
};

const getInitialState = (value: number, baseUnit: 'minutes' | 'hours', allowedUnits: TimeUnit[]) => {
  if (baseUnit === 'minutes') {
    if (allowedUnits.includes('days') && value % 1440 === 0 && value !== 0) return { num: value / 1440, unit: 'days' as TimeUnit };
    if (allowedUnits.includes('hours') && value % 60 === 0 && value !== 0) return { num: value / 60, unit: 'hours' as TimeUnit };
    return { num: value, unit: 'minutes' as TimeUnit };
  } else {
    if (allowedUnits.includes('days') && value % 24 === 0 && value !== 0) return { num: value / 24, unit: 'days' as TimeUnit };
    return { num: value, unit: 'hours' as TimeUnit };
  }
};

const TimeDurationInput: React.FC<TimeDurationInputProps> = ({ 
  value, 
  onChange, 
  baseUnit, 
  allowedUnits,
  prefix,
  unitLabels = { minutes: 'Minutos', hours: 'Horas', days: 'Días' },
  error
}) => {
  const [displayNum, setDisplayNum] = useState<string>(getInitialState(value, baseUnit, allowedUnits).num.toString());
  const [displayUnit, setDisplayUnit] = useState<TimeUnit>(getInitialState(value, baseUnit, allowedUnits).unit);

  useEffect(() => {
    const currentCalculated = calculateBaseValue(Number(displayNum), displayUnit, baseUnit);
    if (currentCalculated !== value) {
      const state = getInitialState(value, baseUnit, allowedUnits);
      setDisplayNum(state.num.toString());
      setDisplayUnit(state.unit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, baseUnit, allowedUnits]);

  const handleNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDisplayNum(val);
    const num = Number(val);
    if (!isNaN(num)) {
      onChange(calculateBaseValue(num, displayUnit, baseUnit));
    }
  };

  const handleUnitChange = (newUnit: TimeUnit) => {
    setDisplayUnit(newUnit);
    const num = Number(displayNum);
    if (!isNaN(num)) {
      onChange(calculateBaseValue(num, newUnit, baseUnit));
    }
  };

  return (
    <div className="space-y-1">
      <div className={`flex items-center bg-slate-50 border ${error ? 'border-rose-300 focus-within:border-rose-500 focus-within:ring-rose-100' : 'border-slate-200 focus-within:border-indigo-500 focus-within:ring-indigo-100'} rounded-xl focus-within:ring-2 transition-all shadow-sm overflow-visible`}>
        {prefix && (
          <div className="pl-4 pr-1 text-sm font-medium text-slate-500 pointer-events-none select-none">
            {prefix}
          </div>
        )}
        <input
          type="number"
          min="1"
          step="1"
          value={displayNum}
          onChange={handleNumChange}
          className={`w-16 sm:w-20 px-2 py-2.5 bg-transparent outline-none text-slate-800 text-sm font-bold text-center border-r ${error ? 'border-rose-200' : 'border-slate-200'} ${prefix ? 'pl-1' : 'pl-4'}`}
        />
        <div className="flex-1 min-w-0">
          <CustomSelect<TimeUnit>
            value={displayUnit}
            onChange={handleUnitChange}
            options={allowedUnits.map(u => ({ value: u, label: unitLabels[u] }))}
            buttonClassName="w-full px-3 py-2.5 bg-transparent text-left text-sm font-medium transition-all outline-none flex items-center justify-between group cursor-pointer text-slate-700"
          />
        </div>
      </div>
      {error && <p className="text-[11px] text-rose-500 font-medium pl-1 leading-tight">{error}</p>}
    </div>
  );
};

export const ConfiguracionNotificaciones: React.FC<ConfiguracionNotificacionesProps> = ({ agentId }) => {
  const { user } = useAuth();
  const targetId = agentId || user?.id;
  const { resyncPushSubscription, subscribeToPush, isSubscribed, isSubscribing, isSupported } = usePushNotifications();
  
  const { data, isLoading, mutate } = useSWR<NotificationSettings>(
    targetId ? `/agents/${targetId}/notifications` : null,
    (url: string) => api.get(url).then(res => res.data)
  );

  const [settings, setSettings] = useState<NotificationSettings>({
    notifyOverdueTasksIntervalMinutes: 60,
    notifyTodayTasksAdvanceMinutes: 300,
    notifyTodayTasksIntervalMinutes: 60,
    notifyAiHelpTasksIntervalMinutes: 1,
    notifyAiHelpTasksMaxRetries: 3,
    notifyOverdueTasksMaxHours: 24
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const handleChange = (field: keyof NotificationSettings, value: number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  // Validaciones
  const isInvalidOverdueInterval = settings.notifyOverdueTasksIntervalMinutes < 1 || settings.notifyOverdueTasksIntervalMinutes > 1440;
  const isInvalidOverdueMax = settings.notifyOverdueTasksMaxHours < 1 || settings.notifyOverdueTasksMaxHours > 72;
  const isInvalidTodayAdvance = settings.notifyTodayTasksAdvanceMinutes < 1 || settings.notifyTodayTasksAdvanceMinutes > 4320;
  const isInvalidTodayInterval = settings.notifyTodayTasksIntervalMinutes < 1 || settings.notifyTodayTasksIntervalMinutes > 1440;
  const isInvalidAiInterval = settings.notifyAiHelpTasksIntervalMinutes < 1 || settings.notifyAiHelpTasksIntervalMinutes > 1440;
  const isInvalidAiRetries = settings.notifyAiHelpTasksMaxRetries < 1 || settings.notifyAiHelpTasksMaxRetries > 5;

  const isFormValid = !isInvalidOverdueInterval && !isInvalidOverdueMax && !isInvalidTodayAdvance && !isInvalidTodayInterval && !isInvalidAiInterval && !isInvalidAiRetries;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || !isFormValid) return;
    
    setIsSaving(true);
    try {
      await api.put(`/agents/${targetId}/notifications`, settings);
      await mutate(settings, false); // Optimistic UI
      toast.success('Configuración de notificaciones guardada');
    } catch (error) {
      if (data) {
        setSettings(data);
      }
      const err = error as { response?: { data?: { error?: string } } };
      const errorMessage = err.response?.data?.error || 'Error al guardar las configuraciones';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48 max-w-3xl mx-auto">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Notificaciones Recurrentes</h2>
                <p className="text-slate-500 text-sm mt-1">Configura la frecuencia con la que deseas recibir alertas sobre tus tareas.</p>
              </div>
            </div>
            
            {isSupported && !agentId && ( // Show only for own profile, not when editing another agent
              <div className="flex items-center gap-2">
                {!isSubscribed ? (
                  <button
                    type="button"
                    onClick={subscribeToPush}
                    disabled={isSubscribing}
                    className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSubscribing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                    {isSubscribing ? 'Activando...' : 'Activar Notificaciones'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resyncPushSubscription}
                    disabled={isSubscribing}
                    className="shrink-0 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSubscribing ? 'animate-spin' : ''}`} />
                    {isSubscribing ? 'Sincronizando...' : 'Sincronizar Dispositivo'}
                  </button>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Frecuencia Tareas Atrasadas</label>
                <TimeDurationInput
                  value={settings.notifyOverdueTasksIntervalMinutes}
                  onChange={(val) => handleChange('notifyOverdueTasksIntervalMinutes', val)}
                  baseUnit="minutes"
                  allowedUnits={['minutes', 'hours', 'days']}
                  prefix="Cada"
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
                  error={isInvalidTodayInterval ? "Rango permitido: 1 a 1440 minutos (24h)." : undefined}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-slate-700">Tareas de Ayuda de IA</label>
                  <div className="group relative">
                    <Info className="w-4 h-4 text-slate-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-10 text-center">
                      Esta notificación se dispara cuando la IA requiere de tu ayuda
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
                    className={`w-full px-4 py-2.5 bg-slate-50 border ${isInvalidAiRetries ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'} rounded-xl focus:ring-2 outline-none transition-all text-slate-700 text-sm font-medium`}
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
                className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
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
