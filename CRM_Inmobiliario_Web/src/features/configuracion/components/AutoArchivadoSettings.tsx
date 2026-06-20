import React, { useState, useEffect, useRef } from 'react';
import { useUpdateArchivingConfig, type ArchivingConfig } from '../api/useUpdateArchivingConfig';
import { toast } from 'sonner';
import { Save, Loader2, Archive, ChevronDown, Check } from 'lucide-react';

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

type TimeUnitDays = 'days' | 'weeks' | 'months' | 'years';

const unitLabels: Record<TimeUnitDays, string> = {
  days: 'Días',
  weeks: 'Semanas',
  months: 'Meses',
  years: 'Años'
};

const calculateBaseDays = (num: number, unit: TimeUnitDays) => {
  if (unit === 'weeks') return Math.round(num * 7);
  if (unit === 'months') return Math.round(num * 30);
  if (unit === 'years') return Math.round(num * 365);
  return Math.round(num);
};

const getInitialDaysState = (value: number) => {
  if (value > 0) {
    if (value % 365 === 0) return { num: value / 365, unit: 'years' as TimeUnitDays };
    if (value % 30 === 0) return { num: value / 30, unit: 'months' as TimeUnitDays };
    if (value % 7 === 0) return { num: value / 7, unit: 'weeks' as TimeUnitDays };
  }
  return { num: value || 100, unit: 'days' as TimeUnitDays };
};

interface TimeDurationDaysInputProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

const TimeDurationDaysInput: React.FC<TimeDurationDaysInputProps> = ({ value, onChange, error }) => {
  const [displayNum, setDisplayNum] = useState<string>(getInitialDaysState(value).num.toString());
  const [displayUnit, setDisplayUnit] = useState<TimeUnitDays>(getInitialDaysState(value).unit);

  useEffect(() => {
    const currentCalculated = calculateBaseDays(Number(displayNum), displayUnit);
    if (currentCalculated !== value) {
      const state = getInitialDaysState(value);
      setDisplayNum(state.num.toString());
      setDisplayUnit(state.unit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDisplayNum(val);
    const num = Number(val);
    if (!isNaN(num)) {
      onChange(calculateBaseDays(num, displayUnit));
    }
  };

  const handleUnitChange = (newUnit: TimeUnitDays) => {
    setDisplayUnit(newUnit);
    const num = Number(displayNum);
    if (!isNaN(num)) {
      onChange(calculateBaseDays(num, newUnit));
    }
  };

  return (
    <div className="space-y-1">
      <div className={`flex items-center bg-slate-50 border ${error ? 'border-rose-300 focus-within:border-rose-500 focus-within:ring-rose-100' : 'border-slate-200 focus-within:border-indigo-500 focus-within:ring-indigo-100'} rounded-xl focus-within:ring-2 transition-all shadow-sm overflow-visible`}>
        <div className="pl-4 pr-1 text-sm font-medium text-slate-500 pointer-events-none select-none">
          Tras
        </div>
        <input
          type="number"
          min="1"
          step="1"
          value={displayNum}
          onChange={handleNumChange}
          className={`w-16 sm:w-20 px-2 py-2.5 bg-transparent outline-none text-slate-800 text-sm font-bold text-center border-r ${error ? 'border-rose-200' : 'border-slate-200'} pl-1`}
        />
        <div className="flex-1 min-w-0">
          <CustomSelect<TimeUnitDays>
            value={displayUnit}
            onChange={handleUnitChange}
            options={(Object.keys(unitLabels) as TimeUnitDays[]).map(u => ({ value: u, label: unitLabels[u] }))}
            buttonClassName="w-full px-3 py-2.5 bg-transparent text-left text-sm font-medium transition-all outline-none flex items-center justify-between group cursor-pointer text-slate-700"
          />
        </div>
      </div>
      {error && <p className="text-[11px] text-rose-500 font-medium pl-1 leading-tight">{error}</p>}
    </div>
  );
};

export const AutoArchivadoSettings: React.FC = () => {
  const { data, isLoading, updateConfig } = useUpdateArchivingConfig();
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<ArchivingConfig>({
    autoArchivarContactos: false,
    diasInactividadContactos: 100,
    autoArchivarPropiedades: false,
    diasInactividadPropiedades: 100
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const handleChange = (field: keyof ArchivingConfig, value: number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const isInvalidContactos = settings.diasInactividadContactos < 100 || settings.diasInactividadContactos > 1095;
  const isInvalidPropiedades = settings.diasInactividadPropiedades < 100 || settings.diasInactividadPropiedades > 1095;
  const isFormValid = !isInvalidContactos && !isInvalidPropiedades;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setIsSaving(true);
    try {
      await updateConfig(settings);
      toast.success('Configuración de auto-archivado guardada');
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      const errorMessage = err.response?.data?.error || 'Error al guardar configuración (400 Bad Request)';
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
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Auto-Archivado</h2>
              <p className="text-slate-500 text-sm mt-1">Configura el archivado automático de registros inactivos.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">Contactos Inactivos</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={settings.autoArchivarContactos} onChange={(e) => handleChange('autoArchivarContactos', e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                {settings.autoArchivarContactos && (
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-slate-500 mb-2">Límite de Inactividad</label>
                    <TimeDurationDaysInput
                      value={settings.diasInactividadContactos}
                      onChange={(val) => handleChange('diasInactividadContactos', val)}
                      error={isInvalidContactos ? "Rango permitido: 100 a 1095 días (aprox 3 años)." : undefined}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">Propiedades Inactivas</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={settings.autoArchivarPropiedades} onChange={(e) => handleChange('autoArchivarPropiedades', e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                {settings.autoArchivarPropiedades && (
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-slate-500 mb-2">Límite de Inactividad</label>
                    <TimeDurationDaysInput
                      value={settings.diasInactividadPropiedades}
                      onChange={(val) => handleChange('diasInactividadPropiedades', val)}
                      error={isInvalidPropiedades ? "Rango permitido: 100 a 1095 días (aprox 3 años)." : undefined}
                    />
                  </div>
                )}
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
