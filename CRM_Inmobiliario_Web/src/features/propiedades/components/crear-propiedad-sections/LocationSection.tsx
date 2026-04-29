import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { KeySquare, ChevronDown, Check, Coins, Calendar, Map, Building2, Navigation, Globe, AlertCircle } from 'lucide-react';
import type { CrearPropiedadDTO } from '../../api/crearPropiedad';
import { useState, useRef, useEffect } from 'react';

interface Props {
  isSuccess: boolean;
}

export const LocationSection = ({ isSuccess }: Props) => {
  const { register, control, setValue, formState: { errors } } = useFormContext<CrearPropiedadDTO>();
  const [activeSelect, setActiveSelect] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  
  const googleMapsUrl = useWatch({ control, name: 'googleMapsUrl' });

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
    <div className="md:col-span-6 grid grid-cols-1 md:grid-cols-6 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
      
      {/* Operación */}
      <div className="md:col-span-3 space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Operación</label>
        <div className="relative" ref={selectRef}>
          <KeySquare className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10 pointer-events-none" />
          <Controller
            name="operacion"
            control={control}
            rules={{ required: 'Selecciona operación' }}
            render={({ field }) => (
              <>
                <button
                  type="button"
                  disabled={isSuccess}
                  onClick={() => setActiveSelect(!activeSelect)}
                  className={`cursor-pointer w-full pl-10 pr-10 py-3 bg-slate-50 border text-left ${errors.operacion ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all focus:ring-4 outline-none flex items-center justify-between group disabled:opacity-50 relative`}
                >
                  <span className={field.value ? 'text-slate-900' : 'text-slate-400'}>
                    {field.value || 'Seleccionar...'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-300 ${activeSelect ? 'rotate-180' : ''}`} />
                </button>
                {activeSelect && (
                  <div className="absolute w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in duration-200 origin-top max-h-48 overflow-y-auto">
                    {['Venta', 'Alquiler', 'Anticresis'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onClick={() => { setValue('operacion', opt as any, { shouldValidate: true, shouldDirty: true }); setActiveSelect(false); }}
                        className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between hover:bg-slate-50 transition-colors ${field.value === opt ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}`}
                      >
                        {opt}
                        {field.value === opt && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          />
        </div>
        {errors.operacion && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.operacion.message}</p>}
      </div>

      {/* Precio */}
      <div className="md:col-span-3 space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Precio ($)</label>
        <div className="relative">
          <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            {...register('precio', { required: 'Requerido', min: 1 })}
            type="number" 
            disabled={isSuccess}
            step="any"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Fecha de Captación */}
      <div className="md:col-span-6 space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Fecha de Captación (Opcional)</label>
        <div className="relative">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            {...register('fechaIngreso')}
            type="date" 
            disabled={isSuccess}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-50"
          />
        </div>
        <p className="text-[10px] text-slate-400 font-bold uppercase pl-1 opacity-80">
          Si se deja vacío, se usará la fecha actual. Útil para corregir KPIs históricos.
        </p>
      </div>

      <div className="md:col-span-3 space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Sector</label>
        <div className="relative">
          <Map className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            {...register('sector', { required: 'Requerido' })}
            type="text" 
            disabled={isSuccess}
            placeholder="Ej. La Carolina"
            className="w-full pl-10 px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Ciudad */}
      <div className="md:col-span-3 space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Ciudad</label>
        <div className="relative">
          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            {...register('ciudad', { required: 'Requerido' })}
            type="text" 
            disabled={isSuccess}
            placeholder="Ej. Quito"
            className="w-full pl-10 px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Dirección Exacta */}
      <div className="md:col-span-6 space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Dirección Exacta</label>
        <div className="relative">
          <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            {...register('direccion', { required: 'La dirección es obligatoria' })}
            type="text" 
            disabled={isSuccess}
            placeholder="Calle principal, número y calle secundaria"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Google Maps */}
      <div className="md:col-span-6 space-y-2">
        <div className="flex items-center justify-between pl-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Google Maps (opcional)</label>
          {googleMapsUrl?.includes('maps.app.goo.gl') && (
            <span className="text-[9px] font-black text-amber-500 uppercase tracking-tight flex items-center gap-1 animate-pulse">
              <AlertCircle className="h-2.5 w-2.5" /> Enlace corto detectado: se usará dirección física para centrar
            </span>
          )}
        </div>
        <div className="relative">
          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            {...register('googleMapsUrl')}
            type="url" 
            disabled={isSuccess}
            placeholder="Pega aquí el enlace de Google Maps"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
};
