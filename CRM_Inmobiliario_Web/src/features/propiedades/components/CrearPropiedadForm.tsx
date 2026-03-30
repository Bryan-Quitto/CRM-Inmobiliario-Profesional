import { useForm, Controller } from 'react-hook-form';
import { 
  Home, 
  Tag, 
  MapPin, 
  DollarSign, 
  Maximize, 
  BedDouble, 
  Bath, 
  Loader2, 
  AlertCircle, 
  X, 
  Trash2, 
  Check, 
  RotateCcw, 
  ChevronDown,
  Type,
  FileText
} from 'lucide-react';
import { crearPropiedad, type CrearPropiedadDTO } from '../api/crearPropiedad';
import { useState, useEffect, useRef } from 'react';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

const TIPOS_PROPIEDAD = [
  { label: 'Casa', value: 'Casa' },
  { label: 'Departamento', value: 'Departamento' },
  { label: 'Oficina', value: 'Oficina' },
  { label: 'Terreno', value: 'Terreno' },
  { label: 'Local Comercial', value: 'Local Comercial' },
  { label: 'Suite', value: 'Suite' },
];

const OPERACIONES = [
  { label: 'Venta', value: 'Venta' },
  { label: 'Alquiler', value: 'Alquiler' },
];

const DRAFT_STORAGE_KEY = 'crm_propiedad_draft';

export const CrearPropiedadForm = ({ onSuccess, onCancel }: Props) => {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeSelect, setActiveSelect] = useState<'tipo' | 'operacion' | null>(null);
  const selectRef = useRef<HTMLDivElement>(null);

  const getInitialValues = (): Partial<CrearPropiedadDTO> => {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error al parsear borrador:', e);
      }
    }
    return {
      tipoPropiedad: '',
      operacion: '',
    };
  };

  const { register, handleSubmit, watch, formState: { errors }, reset, control, setValue, getValues } = useForm<CrearPropiedadDTO>({
    defaultValues: getInitialValues() as CrearPropiedadDTO
  });

  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    // Sincronización inicial y suscripción optimizada para borrador
    const currentValues = getValues();
    const checkHasData = (vals: Record<string, unknown>) => Object.values(vals).some(v => v && v !== '' && v !== 0);
    setHasData(checkHasData(currentValues as unknown as Record<string, unknown>));

    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = watch((value) => {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(value));
      const isNowDirty = checkHasData(value as unknown as Record<string, unknown>);
      if (isNowDirty !== hasData) setHasData(isNowDirty);
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues, hasData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setActiveSelect(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    reset({
      titulo: '',
      descripcion: '',
      tipoPropiedad: '',
      operacion: '',
      precio: 0,
      direccion: '',
      sector: '',
      ciudad: '',
      habitaciones: 0,
      banos: 0,
      areaTotal: 0
    });
    setIsConfirmingClear(false);
  };

  const onSubmit = async (data: CrearPropiedadDTO) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const payload = {
        ...data,
        precio: Number(data.precio),
        habitaciones: Number(data.habitaciones),
        banos: Number(data.banos),
        areaTotal: Number(data.areaTotal)
      };

      await crearPropiedad(payload);
      
      // Transición Satisfy
      setIsSuccess(true);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      
      setTimeout(() => {
        reset(); 
        onSuccess();
      }, 800);
    } catch (err) {
      console.error('Error al crear propiedad:', err);
      setError('No se pudo registrar la propiedad. Verifica la conexión.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-300 relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
      {/* Botón de cierre */}
      <button 
        onClick={onCancel}
        disabled={isSuccess}
        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-0"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Nueva Propiedad</h2>
        <div className="flex flex-wrap items-center gap-2 mt-1 min-h-[24px]">
          <p className="text-slate-500 font-medium text-sm">Ingresa los detalles del inmueble para el catálogo.</p>
          
          {hasData && !isSuccess && (
            <div className="flex items-center gap-1.5 animate-in slide-in-from-left-2 duration-300">
              {!isConfirmingClear ? (
                <button 
                  type="button"
                  onClick={() => setIsConfirmingClear(true)}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 px-2 py-1 rounded-full transition-all cursor-pointer group"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                  Limpiar borrador
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-full border border-rose-100 shadow-sm animate-in zoom-in duration-200">
                  <button 
                    type="button"
                    onClick={handleClearDraft}
                    className="flex items-center gap-1 text-[10px] font-black text-white bg-rose-500 hover:bg-rose-600 px-2.5 py-1 rounded-full transition-all cursor-pointer"
                  >
                    <Check className="h-2.5 w-2.5" />
                    Confirmar
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsConfirmingClear(false)}
                    className="p-1 text-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Cancelar"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-bold">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {/* Título - Full Width */}
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Título de la Propiedad</label>
            <div className="relative">
              <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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

          {/* Descripción - Full Width */}
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Descripción Detallada</label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-4 h-4 w-4 text-slate-400" />
              <textarea 
                {...register('descripcion', { required: 'La descripción es obligatoria' })}
                disabled={isSuccess}
                placeholder="Describe las características principales, acabados, seguridad, etc."
                rows={3}
                className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.descripcion ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all focus:ring-4 outline-none resize-none disabled:opacity-50`}
              />
            </div>
            {errors.descripcion && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.descripcion.message}</p>}
          </div>

          {/* Tipo de Propiedad */}
          <div className="md:col-span-3 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Tipo</label>
            <div className="relative" ref={activeSelect === 'tipo' ? selectRef : null}>
              <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Controller
                name="tipoPropiedad"
                control={control}
                rules={{ required: 'Selecciona un tipo' }}
                render={({ field }) => (
                  <>
                    <button
                      type="button"
                      disabled={isSuccess}
                      onClick={() => setActiveSelect(activeSelect === 'tipo' ? null : 'tipo')}
                      className={`w-full pl-10 pr-10 py-3 bg-slate-50 border text-left ${errors.tipoPropiedad ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all focus:ring-4 outline-none flex items-center justify-between group cursor-pointer disabled:opacity-50`}
                    >
                      <span className={field.value ? 'text-slate-900' : 'text-slate-400'}>
                        {field.value || 'Seleccionar...'}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-300 ${activeSelect === 'tipo' ? 'rotate-180' : ''}`} />
                    </button>
                    {activeSelect === 'tipo' && (
                      <div className="absolute w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in duration-200 origin-top max-h-48 overflow-y-auto">
                        {TIPOS_PROPIEDAD.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => { setValue('tipoPropiedad', opt.value, { shouldValidate: true }); setActiveSelect(null); }}
                            className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between hover:bg-slate-50 transition-colors ${field.value === opt.value ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}`}
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
          </div>

          {/* Operación */}
          <div className="md:col-span-3 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Operación</label>
            <div className="relative" ref={activeSelect === 'operacion' ? selectRef : null}>
              <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Controller
                name="operacion"
                control={control}
                rules={{ required: 'Selecciona operación' }}
                render={({ field }) => (
                  <>
                    <button
                      type="button"
                      disabled={isSuccess}
                      onClick={() => setActiveSelect(activeSelect === 'operacion' ? null : 'operacion')}
                      className={`w-full pl-10 pr-10 py-3 bg-slate-50 border text-left ${errors.operacion ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all focus:ring-4 outline-none flex items-center justify-between group cursor-pointer disabled:opacity-50`}
                    >
                      <span className={field.value ? 'text-slate-900' : 'text-slate-400'}>
                        {field.value || 'Seleccionar...'}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-300 ${activeSelect === 'operacion' ? 'rotate-180' : ''}`} />
                    </button>
                    {activeSelect === 'operacion' && (
                      <div className="absolute w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in duration-200 origin-top">
                        {OPERACIONES.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => { setValue('operacion', opt.value, { shouldValidate: true }); setActiveSelect(null); }}
                            className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between hover:bg-slate-50 transition-colors ${field.value === opt.value ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}`}
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
          </div>

          {/* Precio */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Precio ($)</label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                {...register('precio', { required: 'Requerido', min: 1 })}
                type="number" 
                disabled={isSuccess}
                step="any"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Sector */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Sector</label>
            <input 
              {...register('sector', { required: 'Requerido' })}
              type="text" 
              disabled={isSuccess}
              placeholder="Ej. La Carolina"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-50"
            />
          </div>

          {/* Ciudad */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Ciudad</label>
            <input 
              {...register('ciudad', { required: 'Requerido' })}
              type="text" 
              disabled={isSuccess}
              placeholder="Ej. Quito"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-50"
            />
          </div>

          {/* Dirección - Full Width */}
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Dirección Exacta</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                {...register('direccion', { required: 'La dirección es obligatoria' })}
                type="text" 
                disabled={isSuccess}
                placeholder="Calle principal, número y calle secundaria"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Habitaciones */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Habitaciones</label>
            <div className="relative">
              <BedDouble className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                {...register('habitaciones', { min: 0 })}
                type="number" 
                disabled={isSuccess}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Baños */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Baños</label>
            <div className="relative">
              <Bath className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                {...register('banos', { min: 0 })}
                type="number" 
                disabled={isSuccess}
                step="0.5"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Área Total */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Área Total (m²)</label>
            <div className="relative">
              <Maximize className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                {...register('areaTotal', { required: 'Requerido', min: 1 })}
                type="number" 
                disabled={isSuccess}
                step="any"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        <div className="pt-8 flex items-center gap-3">
          <button 
            type="button"
            onClick={onCancel}
            disabled={isSubmitting || isSuccess}
            className="flex-1 py-4 text-slate-400 font-bold text-sm hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-0"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={isSubmitting || isSuccess}
            className={`flex-[2] py-4 font-black rounded-2xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed ${
              isSuccess 
                ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700 disabled:bg-slate-300'
            }`}
          >
            {isSuccess ? (
              <div className="flex items-center gap-2 animate-in zoom-in duration-300">
                <Check className="h-5 w-5 stroke-[4px]" />
                <span>¡Registrada!</span>
              </div>
            ) : isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Registrando...
              </>
            ) : (
              'Guardar Propiedad'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
