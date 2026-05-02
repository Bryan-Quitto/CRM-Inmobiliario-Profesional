import { useState, useRef, useEffect } from 'react';
import { Controller, type Control, type UseFormSetValue, type FieldErrors } from 'react-hook-form';
import { Tag, ChevronDown, Check } from 'lucide-react';
import { type CrearContactoDTO } from '../../api/crearContacto';

interface OrigenSelectProps {
  control: Control<CrearContactoDTO>;
  setValue: UseFormSetValue<CrearContactoDTO>;
  errors: FieldErrors<CrearContactoDTO>;
  isSuccess: boolean;
}

const ORIGENES = [
  { label: 'Facebook Ads', value: 'Facebook Ads' },
  { label: 'Google Search', value: 'Google Search' },
  { label: 'Referido', value: 'Referido' },
  { label: 'Portal Inmobiliario', value: 'Portal Inmobiliario' },
  { label: 'WhatsApp Directo', value: 'WhatsApp Directo' },
];

export const OrigenSelect = ({
  control,
  setValue,
  errors,
  isSuccess
}: OrigenSelectProps) => {
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2 mt-6">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Origen del Contacto</label>
      <div className="relative" ref={selectRef}>
        <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Controller
          name="origen"
          control={control}
          rules={{ required: 'Selecciona un origen' }}
          render={({ field }) => (
            <>
              <button
                type="button"
                disabled={isSuccess}
                onClick={() => setIsSelectOpen(!isSelectOpen)}
                className={`cursor-pointer w-full pl-10 pr-10 py-3 bg-slate-50 border text-left ${errors.origen ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all focus:ring-4 outline-none flex items-center justify-between group disabled:opacity-50`}
              >
                <span className={field.value ? 'text-slate-900' : 'text-slate-400'}>
                  {field.value || 'Selecciona origen...'}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-300 ${isSelectOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSelectOpen && (
                <div className="absolute w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in duration-200 origin-top max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  {ORIGENES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setValue('origen', opt.value, { shouldValidate: true });
                        setIsSelectOpen(false);
                      }}
                      className={`cursor-pointer w-full px-4 py-2.5 text-left text-sm font-bold flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        field.value === opt.value ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'
                      }`}
                    >
                      {opt.label}
                      {field.value === opt.value && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        />
      </div>
      {errors.origen && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.origen.message}</p>}
    </div>
  );
};
