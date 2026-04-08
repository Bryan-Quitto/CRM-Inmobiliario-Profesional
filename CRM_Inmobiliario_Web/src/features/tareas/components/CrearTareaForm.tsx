import { useForm, Controller } from 'react-hook-form';
import { 
  Type, 
  AlignLeft, 
  Calendar, 
  Loader2, 
  AlertCircle, 
  Trash2, 
  Check, 
  RotateCcw, 
  ChevronDown,
  Phone,
  MapPin,
  Users,
  Briefcase,
  ChevronLeft,
  User,
  Home
} from 'lucide-react';
import { crearTarea } from '../api/crearTarea';
import { buscarClientes } from '../../clientes/api/buscarClientes';
import { buscarPropiedades } from '../../propiedades/api/buscarPropiedades';
import { DynamicSearchSelect } from '../../../components/DynamicSearchSelect';
import { useTareas } from '../context/useTareas';
import { useState, useEffect, useRef, useMemo } from 'react';
import type { CrearTareaDTO } from '../types';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  fechaInicial?: string;
}

const TIPOS_TAREA = [
  { label: 'Llamada', value: 'Llamada', icon: Phone, color: 'text-blue-600 bg-blue-50' },
  { label: 'Visita', value: 'Visita', icon: MapPin, color: 'text-emerald-600 bg-emerald-50' },
  { label: 'Reunión', value: 'Reunión', icon: Users, color: 'text-purple-600 bg-purple-50' },
  { label: 'Trámite', value: 'Trámite', icon: Briefcase, color: 'text-amber-600 bg-amber-50' },
];

const DRAFT_STORAGE_KEY = 'crm_tarea_draft';

export const CrearTareaForm = ({ onSuccess, onCancel, fechaInicial }: Props) => {
  const { clientes, propiedades } = useTareas();
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const clienteOptions = useMemo(() => 
    clientes.map(c => ({ id: c.id, title: `${c.nombre} ${c.apellido}`, subtitle: c.telefono })),
    [clientes]
  );

  const propiedadOptions = useMemo(() => 
    propiedades.map(p => ({ id: p.id, title: p.titulo, subtitle: `${p.ciudad}, ${p.sector}` })),
    [propiedades]
  );

  const defaultFecha = useMemo(() => {
    console.log('[FORM] Calculando defaultFecha. Props fechaInicial:', fechaInicial);
    
    if (fechaInicial) {
      // Si viene del calendario (YYYY-MM-DD), concatenamos la hora directamente
      const result = `${fechaInicial}T10:00`;
      console.log('[FORM] Resultado (Calendario):', result);
      return result;
    }

    // Para nueva tarea normal, usamos la hora LOCAL exacta actual
    const now = new Date();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const result = `${year}-${month}-${day}T${hours}:${minutes}`;
    console.log('[FORM] Resultado (Hoy/Nuevo):', result);
    return result;
  }, [fechaInicial]);

  const getInitialValues = (): CrearTareaDTO => {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        // ELIMINAMOS cualquier fecha guardada en el borrador para que 
        // siempre prevalezca la calculada (la del botón presionado)
        delete draft.fechaInicio;
        
        return {
          ...draft,
          fechaInicio: defaultFecha
        };
      } catch (e) {
        console.error('Error al parsear borrador de tarea:', e);
      }
    }
    return {
      titulo: '',
      descripcion: '',
      tipoTarea: 'Llamada',
      fechaInicio: defaultFecha
    };
  };

  const { register, handleSubmit, watch, formState: { errors }, reset, control, setValue } = useForm<CrearTareaDTO>({
    defaultValues: getInitialValues()
  });

  const formData = watch();
  const hasData = formData.titulo || formData.descripcion;

  useEffect(() => {
    // Solo guardamos título, descripción y tipo en el borrador
    // EXCLUIMOS la fecha para que no se quede "pegada" la de sesiones anteriores
    const rest = { ...formData };
    // @ts-expect-error: Excluyendo intencionalmente para el localStorage
    delete rest.fechaInicio;
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(rest));
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
      titulo: '',
      descripcion: '',
      tipoTarea: 'Llamada',
      fechaInicio: defaultFecha
    });
    setIsConfirmingClear(false);
  };

  const onSubmit = async (data: CrearTareaDTO) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const payload = {
        ...data,
        fechaInicio: new Date(data.fechaInicio).toISOString()
      };

      await crearTarea(payload);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      reset(); 
      onSuccess();
    } catch (err: unknown) {
      console.error('Error al crear tarea:', err);
      setError('No se pudo programar la tarea. Verifica los datos o su conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTipo = TIPOS_TAREA.find(t => t.value === formData.tipoTarea) || TIPOS_TAREA[0];

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
      {/* Header Inline */}
      <div className="p-6 border-b border-slate-50 flex items-center gap-4 bg-white sticky top-0 z-10">
        <button 
          onClick={onCancel}
          type="button"
          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Nueva Tarea</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Programar seguimiento</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
        {hasData && (
          <div className="flex items-center gap-2 min-h-[24px]">
            {!isConfirmingClear ? (
              <button 
                type="button"
                onClick={() => setIsConfirmingClear(true)}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:Rose-500 bg-slate-50 hover:bg-rose-50 px-2 py-1 rounded-full transition-all cursor-pointer group"
              >
                <Trash2 className="h-2.5 w-2.5" />
                Limpiar Borrador
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
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-10">
          {error && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-bold">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Título</label>
            <div className="relative">
              <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                {...register('titulo', { required: 'El título es obligatorio' })}
                type="text" 
                placeholder="Ej. Llamar a Juan..."
                className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.titulo ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all outline-none focus:ring-4`}
              />
            </div>
            {errors.titulo && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.titulo.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Descripción</label>
            <div className="relative">
              <AlignLeft className="absolute left-3.5 top-4 h-4 w-4 text-slate-400" />
              <textarea 
                {...register('descripcion')}
                placeholder="Detalles adicionales..."
                rows={3}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none resize-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Tipo de Tarea</label>
            <div className="relative" ref={selectRef}>
              <Controller
                name="tipoTarea"
                control={control}
                rules={{ required: 'Selecciona un tipo' }}
                render={({ field }) => (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsSelectOpen(!isSelectOpen)}
                      className={`w-full px-4 py-3 bg-slate-50 border text-left ${errors.tipoTarea ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all outline-none flex items-center justify-between group cursor-pointer`}
                    >
                      <div className="flex items-center gap-2">
                        <selectedTipo.icon className={`h-4 w-4 ${selectedTipo.color.split(' ')[0]}`} />
                        <span className="text-slate-900">{field.value}</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-300 ${isSelectOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isSelectOpen && (
                      <div className="absolute w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in duration-200 origin-top">
                        {TIPOS_TAREA.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setValue('tipoTarea', opt.value, { shouldValidate: true });
                              setIsSelectOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm font-bold flex items-center gap-3 hover:bg-slate-50 transition-colors ${
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
                )}
              />
            </div>
          </div>

          <Controller
            name="clienteId"
            control={control}
            render={({ field }) => (
              <DynamicSearchSelect
                label="Cliente (Opcional)"
                icon={User}
                placeholder="Buscar por nombre o teléfono..."
                value={field.value}
                options={clienteOptions}
                onSearch={async (q) => {
                  const res = await buscarClientes(q);
                  return res.map(c => ({ id: c.id, title: c.nombreCompleto, subtitle: c.telefono }));
                }}
                onChange={(id) => field.onChange(id)}
              />
            )}
          />

          <Controller
            name="propiedadId"
            control={control}
            render={({ field }) => (
              <DynamicSearchSelect
                label="Propiedad (Opcional)"
                icon={Home}
                placeholder="Buscar por título de propiedad..."
                value={field.value}
                options={propiedadOptions}
                onSearch={async (q) => {
                  const res = await buscarPropiedades(q);
                  return res.map(p => ({ id: p.id, title: p.titulo, subtitle: `${p.ciudad}, ${p.sector}` }));
                }}
                onChange={(id) => field.onChange(id)}
              />
            )}
          />

          {(formData.tipoTarea === 'Visita' || formData.tipoTarea === 'Reunión') && !formData.propiedadId && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Lugar</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  {...register('lugar')}
                  type="text" 
                  placeholder="Dirección o punto de encuentro..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Fecha de Inicio</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                {...register('fechaInicio', { required: 'La fecha es obligatoria' })}
                type="datetime-local" 
                className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.fechaInicio ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all outline-none`}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] disabled:bg-slate-300 flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Agendando...
              </>
            ) : (
              'Guardar Tarea'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
