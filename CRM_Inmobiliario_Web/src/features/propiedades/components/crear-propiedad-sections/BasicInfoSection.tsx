import { useFormContext, Controller } from 'react-hook-form';
import { PenLine, AlignLeft, Mic, MicOff, Building, ChevronDown, Check } from 'lucide-react';
import type { CrearPropiedadDTO } from '../../api/crearPropiedad';
import { TIPOS_PROPIEDAD } from '../../constants/propertyForm';
import { useState, useRef, useEffect } from 'react';

interface Props {
  isSuccess: boolean;
  isListening: boolean;
  onToggleVoice: () => void;
}

export const BasicInfoSection = ({ isSuccess, isListening, onToggleVoice }: Props) => {
  const { register, control, setValue, getValues, formState: { errors } } = useFormContext<CrearPropiedadDTO>();
  const [activeSelect, setActiveSelect] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  console.log('[DEBUG] BasicInfoSection - Current values in Context:', getValues());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setActiveSelect(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* 1. TÍTULO */}
      <div className="md:col-span-6 space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Título de la Propiedad</label>
        <div className="relative">
          <PenLine className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            {...register('titulo', { required: 'El título es obligatorio' })}
            type="text" 
            disabled={isSuccess}
            placeholder="Ej. Penthouse de Lujo en La Carolina"
            className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.titulo ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all focus:ring-4 outline-none disabled:opacity-50`}
          />
        </div>
        {errors.titulo && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.titulo.message}</p>}
      </div>

      {/* 2. DESCRIPCIÓN */}
      <div className="md:col-span-6 space-y-2">
        <div className="flex items-center justify-between pl-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Descripción Detallada</label>
          <button
            type="button"
            onClick={onToggleVoice}
            className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight transition-all active:scale-95 ${
              isListening 
                ? 'bg-rose-500 text-white animate-pulse' 
                : 'bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white'
            }`}
          >
            {isListening ? (
              <><MicOff className="h-3 w-3" /> Detener dictado</>
            ) : (
              <><Mic className="h-3 w-3" /> Dictar descripción</>
            )}
          </button>
        </div>
        <div className="relative">
          <AlignLeft className="absolute left-3.5 top-4 h-4 w-4 text-slate-400" />
          <textarea 
            {...register('descripcion', { required: 'La descripción es obligatoria' })}
            disabled={isSuccess}
            placeholder="Describe las características principales, acabados, seguridad, etc."
            rows={3}
            className={`w-full pl-10 pr-12 py-3 bg-slate-50 border ${errors.descripcion ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all focus:ring-4 outline-none resize-none disabled:opacity-50`}
          />
          {isListening && (
            <div className="absolute right-4 top-4">
              <div className="flex gap-1">
                <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
        </div>
        {errors.descripcion && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.descripcion.message}</p>}
      </div>

      {/* 3. TIPO */}
      <div className="md:col-span-6 space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Tipo de Propiedad</label>
        <div className="relative" ref={selectRef}>
          <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Controller
            name="tipoPropiedad"
            control={control}
            rules={{ required: 'Selecciona un tipo' }}
            render={({ field }) => (
              <>
                <button
                  type="button"
                  disabled={isSuccess}
                  onClick={() => setActiveSelect(!activeSelect)}
                  className={`cursor-pointer w-full pl-10 pr-10 py-3 bg-slate-50 border text-left ${errors.tipoPropiedad ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all focus:ring-4 outline-none flex items-center justify-between group disabled:opacity-50`}
                >
                  <span className={field.value ? 'text-slate-900' : 'text-slate-400'}>
                    {field.value || 'Seleccionar tipo de inmueble...'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-300 ${activeSelect ? 'rotate-180' : ''}`} />
                </button>
                {activeSelect && (
                  <div className="absolute w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in duration-200 origin-top max-h-48 overflow-y-auto">
                    {TIPOS_PROPIEDAD.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setValue('tipoPropiedad', opt.value, { shouldValidate: true, shouldDirty: true }); setActiveSelect(false); }}
                        className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between hover:bg-slate-50 transition-colors ${field.value === opt.value ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}`}
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
        {errors.tipoPropiedad && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.tipoPropiedad.message}</p>}
      </div>
    </>
  );
};
