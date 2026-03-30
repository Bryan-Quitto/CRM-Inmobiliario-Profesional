import { useForm, Controller } from 'react-hook-form';
import { User, Mail, Phone, Tag, Loader2, AlertCircle, X, Trash2, Check, RotateCcw, ChevronDown } from 'lucide-react';
import { crearCliente, type CrearClienteDTO } from '../api/crearCliente';
import { useState, useEffect, useRef } from 'react';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

const ORIGENES = [
  { label: 'Facebook Ads', value: 'Facebook Ads' },
  { label: 'Google Search', value: 'Google Search' },
  { label: 'Referido', value: 'Referido' },
  { label: 'Portal Inmobiliario', value: 'Portal Inmobiliario' },
  { label: 'WhatsApp Directo', value: 'WhatsApp Directo' },
];

const DRAFT_STORAGE_KEY = 'crm_prospecto_draft';

export const CrearClienteForm = ({ onSuccess, onCancel }: Props) => {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const getInitialValues = (): Partial<CrearClienteDTO> => {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error al parsear borrador:', e);
      }
    }
    return {};
  };

  const { register, handleSubmit, watch, formState: { errors }, reset, control, setValue } = useForm<CrearClienteDTO>({
    defaultValues: getInitialValues() as CrearClienteDTO
  });

  const formData = watch();
  const hasData = Object.values(formData).some(v => v);

  useEffect(() => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    reset({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      origen: ''
    });
    setIsConfirmingClear(false);
  };

  const onSubmit = async (data: CrearClienteDTO) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await crearCliente(data);
      
      // Transición Satisfy
      setIsSuccess(true);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      
      setTimeout(() => {
        reset(); 
        onSuccess();
      }, 800);
    } catch (err) {
      console.error('Error al crear cliente:', err);
      setError('No se pudo registrar al prospecto. Verifica la conexión.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-300 relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
      {/* Botón de cierre */}
      <button 
        onClick={onCancel}
        disabled={isSuccess}
        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-0"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Nuevo Prospecto</h2>
        <div className="flex flex-wrap items-center gap-2 mt-1 min-h-[24px]">
          <p className="text-slate-500 font-medium text-sm">Completa los datos para iniciar el seguimiento.</p>
          
          {hasData && !isSuccess && (
            <div className="flex items-center gap-1.5 animate-in slide-in-from-left-2 duration-300">
              {!isConfirmingClear ? (
                <button 
                  type="button"
                  onClick={() => setIsConfirmingClear(true)}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 px-2 py-1 rounded-full transition-all cursor-pointer group"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                  Limpiar
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Nombre</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                {...register('nombre', { required: 'El nombre es obligatorio' })}
                type="text" 
                disabled={isSuccess}
                placeholder="Ej. Juan"
                className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.nombre ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all focus:ring-4 outline-none disabled:opacity-50`}
              />
            </div>
            {errors.nombre && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.nombre.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Apellido</label>
            <input 
              {...register('apellido')}
              type="text" 
              disabled={isSuccess}
              placeholder="Ej. Pérez"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Correo Electrónico</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              {...register('email', { 
                pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' }
              })}
              type="email" 
              disabled={isSuccess}
              placeholder="juan.perez@ejemplo.com"
              className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.email ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all focus:ring-4 outline-none disabled:opacity-50`}
            />
          </div>
          {errors.email && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Teléfono</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              {...register('telefono', { required: 'El teléfono es obligatorio' })}
              type="tel" 
              disabled={isSuccess}
              placeholder="+593 98 765 4321"
              className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.telefono ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all focus:ring-4 outline-none disabled:opacity-50`}
            />
          </div>
          {errors.telefono && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.telefono.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Origen del Prospecto</label>
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
                    className={`w-full pl-10 pr-10 py-3 bg-slate-50 border text-left ${errors.origen ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all focus:ring-4 outline-none flex items-center justify-between group cursor-pointer disabled:opacity-50`}
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
                          className={`w-full px-4 py-2.5 text-left text-sm font-bold flex items-center justify-between hover:bg-slate-50 transition-colors ${
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

        <div className="pt-4 flex items-center gap-3">
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
                <span>¡Registrado!</span>
              </div>
            ) : isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Registrando...
              </>
            ) : (
              'Guardar Prospecto'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
