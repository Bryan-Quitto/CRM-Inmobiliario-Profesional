import { useState, useRef, useEffect } from 'react';
import { Controller, type Control, type FieldErrors, type UseFormSetValue } from 'react-hook-form';
import { Check, ChevronDown } from 'lucide-react';
import { TIPOS_TAREA } from '../constants';
import type { EditarTareaFormValues } from '../hooks/useEditarTarea';

interface TipoTareaSelectProps {
  control: Control<EditarTareaFormValues>;
  errors: FieldErrors<EditarTareaFormValues>;
  isReadOnly: boolean;
  setValue: UseFormSetValue<EditarTareaFormValues>;
}

export const TipoTareaSelect = ({ 
  control, 
  errors, 
  isReadOnly, 
  setValue 
}: TipoTareaSelectProps) => {
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
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Tipo de Tarea</label>
      <div className="relative" ref={selectRef}>
        <Controller
          name="tipoTarea"
          control={control}
          rules={{ required: 'Selecciona un tipo' }}
          render={({ field }) => {
            const selectedTipo = TIPOS_TAREA.find(t => t.value === field.value) || TIPOS_TAREA[0];
            return (
              <>
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => setIsSelectOpen(!isSelectOpen)}
                  className={`w-full px-4 py-3 bg-slate-50 border text-left ${errors.tipoTarea ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all outline-none flex items-center justify-between group disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer`}
                >
                  <div className="flex items-center gap-2">
                    <selectedTipo.icon className={`h-4 w-4 ${selectedTipo.color.split(' ')[0]}`} />
                    <span className="text-slate-900">{field.value}</span>
                  </div>
                  {!isReadOnly && <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-300 ${isSelectOpen ? 'rotate-180' : ''}`} />}
                </button>

                {isSelectOpen && !isReadOnly && (
                  <div className="absolute w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in duration-200 origin-top">
                    {TIPOS_TAREA.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setValue('tipoTarea', opt.value, { shouldValidate: true });
                          setIsSelectOpen(false);
                        }}
                        className={`cursor-pointer w-full px-4 py-2.5 text-left text-sm font-bold flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                          field.value === opt.value ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'
                        }`}
                      >
                        <opt.icon className={`h-4 w-4 ${opt.color.split(' ')[0]}`} />
                        {opt.label}
                        {field.value === opt.value && <Check className="ml-auto h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </>
            );
          }}
        />
      </div>
      {errors.tipoTarea && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.tipoTarea.message}</p>}
    </div>
  );
};
