import { useForm, Controller } from 'react-hook-form';
import { 
  Type, 
  AlignLeft, 
  Calendar, 
  Loader2, 
  Check, 
  ChevronDown,
  Phone,
  MapPin,
  Users,
  Briefcase,
  ChevronLeft,
  RefreshCw,
  User,
  Home,
  Trash2
} from 'lucide-react';
import { getTareaById } from '../api/getTareaById';
import { actualizarTarea } from '../api/actualizarTarea';
import { buscarClientes } from '../../clientes/api/buscarClientes';
import { buscarPropiedades } from '../../propiedades/api/buscarPropiedades';
import { DynamicSearchSelect } from '../../../components/DynamicSearchSelect';
import { useTareas } from '../context/useTareas';
import { useState, useEffect, useRef, useMemo } from 'react';
import type { ActualizarTareaDTO, Tarea } from '../types';
import { toast } from 'sonner';

interface Props {
  tareaId: string;
  initialData?: Tarea; // Para carga instantánea (Zero Wait Policy)
  onSuccess: () => void;
  onCancel: () => void;
  onCancelTask: () => void;
}

const TIPOS_TAREA = [
  { label: 'Llamada', value: 'Llamada', icon: Phone, color: 'text-blue-600 bg-blue-50' },
  { label: 'Visita', value: 'Visita', icon: MapPin, color: 'text-emerald-600 bg-emerald-50' },
  { label: 'Reunión', value: 'Reunión', icon: Users, color: 'text-purple-600 bg-purple-50' },
  { label: 'Trámite', value: 'Trámite', icon: Briefcase, color: 'text-amber-600 bg-amber-50' },
];

const toLocalISOString = (dateInput: string | Date) => {
  const date = new Date(dateInput);
  const tzOffset = date.getTimezoneOffset() * 60000; // offset en milisegundos
  const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  return localISOTime;
};

export const EditarTareaForm = ({ tareaId, initialData, onSuccess, onCancel, onCancelTask }: Props) => {
  const { clientes, propiedades, updateTarea } = useTareas();
  // Si tenemos initialData, empezamos con isLoading en false para carga instantánea
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isSyncing, setIsSyncing] = useState(!!initialData); // Indica si estamos validando con el servidor
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(initialData ? initialData.estado !== 'Pendiente' : false);
  const selectRef = useRef<HTMLDivElement>(null);

  const clienteOptions = useMemo(() => 
    clientes.map(c => ({ id: c.id, title: `${c.nombre} ${c.apellido}`, subtitle: c.telefono })),
    [clientes]
  );

  const propiedadOptions = useMemo(() => 
    propiedades.map(p => ({ id: p.id, title: p.titulo, subtitle: `${p.ciudad}, ${p.sector}` })),
    [propiedades]
  );

  const { register, handleSubmit, watch, formState: { errors }, control, setValue, getValues } = useForm<ActualizarTareaDTO & { clienteNombre?: string; propiedadTitulo?: string }>({
    defaultValues: initialData ? {
      titulo: initialData.titulo,
      descripcion: initialData.descripcion || '',
      tipoTarea: initialData.tipoTarea,
      fechaInicio: toLocalISOString(initialData.fechaInicio),
      clienteId: initialData.clienteId,
      propiedadId: initialData.propiedadId,
      lugar: initialData.lugar,
      clienteNombre: initialData.clienteNombre,
      propiedadTitulo: initialData.propiedadTitulo,
      duracionMinutos: 30
    } : undefined
  });

  useEffect(() => {
    const fetchTarea = async () => {
      try {
        // Solo mostramos loader si NO tenemos datos iniciales
        if (!initialData) setIsLoading(true);
        else setIsSyncing(true);

        const data = await getTareaById(tareaId);
        const fechaLocal = toLocalISOString(data.fechaInicio);
        const initialFechaLocal = initialData ? toLocalISOString(initialData.fechaInicio) : '';
        
        setIsReadOnly(data.estado !== 'Pendiente');

        // IDENTITY-BASED SHIELD (Escudo de Identidad)
        // Obtenemos los valores actuales del formulario de forma sincrónica.
        const currentForm = getValues();

        /**
         * Verificamos campo por campo. Si el valor actual es DIFERENTE al inicial,
         * significa que el usuario ya empezó a interactuar, por lo que NO tocamos ese campo.
         */
        const shouldUpdate = (fieldName: keyof typeof currentForm, serverValue: unknown, initialValue: unknown) => {
          // Si el valor actual en el form es distinto al valor con el que se abrió, el usuario ganó.
          if (currentForm[fieldName] !== initialValue) return false;
          // Si el valor actual es igual al inicial, pero el servidor tiene algo nuevo, actualizamos.
          return currentForm[fieldName] !== serverValue;
        };

        if (shouldUpdate('titulo', data.titulo, initialData?.titulo)) {
          setValue('titulo', data.titulo);
        }
        
        if (shouldUpdate('descripcion', data.descripcion || '', initialData?.descripcion || '')) {
          setValue('descripcion', data.descripcion || '');
        }
        
        if (shouldUpdate('tipoTarea', data.tipoTarea, initialData?.tipoTarea)) {
          setValue('tipoTarea', data.tipoTarea as Tarea['tipoTarea']);
        }
        
        if (shouldUpdate('fechaInicio', fechaLocal, initialFechaLocal)) {
          setValue('fechaInicio', fechaLocal);
        }

        if (shouldUpdate('clienteId', data.clienteId, initialData?.clienteId)) {
          setValue('clienteId', data.clienteId);
          setValue('clienteNombre', data.clienteNombre);
        }

        if (shouldUpdate('propiedadId', data.propiedadId, initialData?.propiedadId)) {
          setValue('propiedadId', data.propiedadId);
          setValue('propiedadTitulo', data.propiedadTitulo);
        }

        if (shouldUpdate('lugar', data.lugar, initialData?.lugar)) {
          setValue('lugar', data.lugar);
        }
        
        // Guardar en cache local para futuras aperturas rápidas
        localStorage.setItem(`tarea_cache_${tareaId}`, JSON.stringify(data));
        
      } catch (err) {
        console.error('Error al cargar tarea:', err);
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
      }
    };

    fetchTarea();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tareaId, initialData]); // Removemos 'reset' y 'isDirty' de dependencias para evitar bucles infinitos, solo re-ejecutamos por tareaId o initialData

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onSubmit = (data: ActualizarTareaDTO) => {
    if (isReadOnly) return;
    
    // Forzamos la obtención de valores actuales para asegurar que el input de fecha esté sincronizado
    const values = getValues();
    
    // FIRE AND FORGET: Respuesta instantánea
    localStorage.removeItem(`tarea_cache_${tareaId}`);

    // Crear objeto de tarea optimista para visualización inmediata
    const cliente = values.clienteId ? clientes.find(c => c.id === values.clienteId) : null;
    const propiedad = values.propiedadId ? propiedades.find(p => p.id === values.propiedadId) : null;

    const updatedFields: Partial<Tarea> = {
      ...values,
      tipoTarea: values.tipoTarea as 'Llamada' | 'Visita' | 'Reunión' | 'Trámite',
      fechaInicio: new Date(values.fechaInicio).toISOString(),
      clienteNombre: cliente ? `${cliente.nombre} ${cliente.apellido}` : undefined,
      propiedadTitulo: propiedad ? propiedad.titulo : undefined
    };

    const payload = {
      ...data,
      fechaInicio: new Date(values.fechaInicio).toISOString()
    };

    // Lanzamos la mutación optimista vinculada a la promesa de actualización
    const savePromise = actualizarTarea(tareaId, payload);
    
    updateTarea(tareaId, updatedFields, savePromise).catch(err => {
      console.error('Error en sync de updateTarea:', err);
      toast.error('No se pudo sincronizar el cambio');
    });

    onSuccess(); // Cerramos el panel/formulario de inmediato
  };

  const formData = watch();
  const selectedTipo = TIPOS_TAREA.find(t => t.value === formData.tipoTarea) || TIPOS_TAREA[0];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando detalles...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
      {/* Header Inline */}
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {isReadOnly ? 'Detalle de Tarea' : 'Editar Tarea'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {isReadOnly ? 'Vista de solo lectura' : 'Modificar seguimiento'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSyncing && (
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 text-slate-400 rounded-full animate-pulse">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span className="text-[9px] font-bold uppercase tracking-tighter">Sincronizando...</span>
            </div>
          )}
          {!isReadOnly && (
            <button 
              type="button"
              onClick={onCancelTask}
              title="Cancelar Tarea"
              className="p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-100"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Título</label>
            <div className="relative">
              <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                {...register('titulo', { required: 'El título es obligatorio' })}
                type="text" 
                disabled={isReadOnly}
                placeholder="Ej. Llamar a Juan..."
                className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.titulo ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed`}
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
                disabled={isReadOnly}
                placeholder="Detalles adicionales..."
                rows={3}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none resize-none disabled:opacity-70 disabled:cursor-not-allowed"
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
                      disabled={isReadOnly}
                      onClick={() => setIsSelectOpen(!isSelectOpen)}
                      className={`w-full px-4 py-3 bg-slate-50 border text-left ${errors.tipoTarea ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all outline-none flex items-center justify-between group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed`}
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
                initialLabel={formData.clienteNombre}
                options={clienteOptions}
                onSearch={async (q) => {
                  const res = await buscarClientes(q);
                  return res.map(c => ({ id: c.id, title: c.nombreCompleto, subtitle: c.telefono }));
                }}
                onChange={(id, title) => {
                  field.onChange(id);
                  setValue('clienteNombre', title);
                }}
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
                initialLabel={formData.propiedadTitulo}
                options={propiedadOptions}
                onSearch={async (q) => {
                  const res = await buscarPropiedades(q);
                  return res.map(p => ({ id: p.id, title: p.titulo, subtitle: `${p.ciudad}, ${p.sector}` }));
                }}
                onChange={(id, title) => {
                  field.onChange(id);
                  setValue('propiedadTitulo', title);
                }}
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
                  disabled={isReadOnly}
                  placeholder="Dirección o punto de encuentro..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed"
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
                disabled={isReadOnly}
                className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.fechaInicio ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed`}
              />
            </div>
          </div>

          {!isReadOnly && (
            <div className="pt-4">
              <button 
                type="submit"
                className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
