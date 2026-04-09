import { useForm, Controller, useWatch } from 'react-hook-form';
import { 
  Home, 
  Tag, 
  MapPin, 
  DollarSign, 
  Maximize, 
  BedDouble, 
  Bath, 
  AlertCircle, 
  X, 
  Trash2, 
  Check, 
  RotateCcw, 
  ChevronDown,
  Type,
  FileText,
  Pencil,
  Globe,
  Mic,
  MicOff
} from 'lucide-react';
import { crearPropiedad } from '../api/crearPropiedad';
import { actualizarPropiedad } from '../api/actualizarPropiedad';
import { useState, useEffect, useRef } from 'react';
import type { Propiedad } from '../types';
import type { CrearPropiedadDTO } from '../api/crearPropiedad';
import { toast } from 'sonner';

interface Props {
  initialData?: Propiedad;
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

export const CrearPropiedadForm = ({ initialData, onSuccess, onCancel }: Props) => {
  const isEditing = !!initialData;
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [activeSelect, setActiveSelect] = useState<'tipo' | 'operacion' | null>(null);
  const selectRef = useRef<HTMLDivElement>(null);

  const getInitialValues = (): Partial<CrearPropiedadDTO> => {
    if (isEditing) return initialData;

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

  const { register, handleSubmit, formState: { errors, isDirty, dirtyFields }, reset, control, setValue, getValues } = useForm<CrearPropiedadDTO>({
    defaultValues: getInitialValues() as CrearPropiedadDTO
  });

  // Se utiliza useWatch para campos específicos en lugar de watch()
  const tipoSeleccionado = useWatch({ control, name: 'tipoPropiedad' });
  const googleMapsUrl = useWatch({ control, name: 'googleMapsUrl' }); 
  const watchedValues = useWatch({ control });

  // Smart Merge: Sincronizar cambios del servidor (initialData) sin borrar lo que el usuario escribe
  useEffect(() => {
    if (!isEditing || !initialData || !watchedValues) return;

    if (isDirty) {
      const mergedValues = {
        titulo: dirtyFields.titulo ? (watchedValues.titulo as string) : initialData.titulo,
        descripcion: dirtyFields.descripcion ? (watchedValues.descripcion as string) : initialData.descripcion,
        tipoPropiedad: dirtyFields.tipoPropiedad ? (watchedValues.tipoPropiedad as string) : initialData.tipoPropiedad,
        operacion: dirtyFields.operacion ? (watchedValues.operacion as string) : initialData.operacion,
        precio: dirtyFields.precio ? Number(watchedValues.precio) : initialData.precio,
        direccion: dirtyFields.direccion ? (watchedValues.direccion as string) : initialData.direccion,
        sector: dirtyFields.sector ? (watchedValues.sector as string) : initialData.sector,
        ciudad: dirtyFields.ciudad ? (watchedValues.ciudad as string) : initialData.ciudad,
        googleMapsUrl: dirtyFields.googleMapsUrl ? (watchedValues.googleMapsUrl as string) : (initialData.googleMapsUrl || ''),
        habitaciones: dirtyFields.habitaciones ? Number(watchedValues.habitaciones) : (initialData.habitaciones || 0),
        banos: dirtyFields.banos ? Number(watchedValues.banos) : (initialData.banos || 0),
        areaTotal: dirtyFields.areaTotal ? Number(watchedValues.areaTotal) : initialData.areaTotal,
        esCaptacionPropia: dirtyFields.esCaptacionPropia ? !!watchedValues.esCaptacionPropia : initialData.esCaptacionPropia,
        porcentajeComision: dirtyFields.porcentajeComision ? Number(watchedValues.porcentajeComision) : initialData.porcentajeComision
      };
      reset(mergedValues);
    } else {
      reset(initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isEditing]);

  // 1. Calculamos hasData directamente al vuelo (estado derivado)
  const hasData = watchedValues 
    ? Object.values(watchedValues).some(v => v && v !== '' && v !== 0) 
    : false;

  // 2. El useEffect ahora SOLO hace llamadas al API externa (localStorage)
  useEffect(() => {
    if (isEditing || !watchedValues) return;
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(watchedValues));
  }, [watchedValues, isEditing]);

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
      googleMapsUrl: '',
      habitaciones: 0,
      banos: 0,
      areaTotal: 0
    });
    setIsConfirmingClear(false);
  };

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<null | {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: { results: { length: number; [key: number]: { length: number; [key: number]: { transcript: string } } } }) => void;
    onerror: (event: { error: string }) => void;
    onend: () => void;
    start: () => void;
    stop: () => void;
  }>(null);

  const toggleListening = () => {
    const SpeechRecognition = (window as unknown as { 
      SpeechRecognition: typeof recognitionRef.current; 
      webkitSpeechRecognition: typeof recognitionRef.current; 
    }).SpeechRecognition || (window as unknown as { 
      SpeechRecognition: typeof recognitionRef.current; 
      webkitSpeechRecognition: typeof recognitionRef.current; 
    }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Tu navegador no soporta el dictado por voz.');
      return;
    }

    if (!recognitionRef.current) {
      const RecognitionClass = SpeechRecognition as unknown as new () => NonNullable<typeof recognitionRef.current>;
      recognitionRef.current = new RecognitionClass();
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'es-ES';

        recognitionRef.current.onresult = (event) => {
          const lastResultIndex = event.results.length - 1;
          const transcript = event.results[lastResultIndex][0].transcript;
          
          if (transcript) {
            const currentDesc = getValues('descripcion') || '';
            const formattedTranscript = transcript.trim().charAt(0).toUpperCase() + transcript.trim().slice(1);
            const newDesc = currentDesc 
              ? `${currentDesc.trim()} ${formattedTranscript}.` 
              : `${formattedTranscript}.`;
            
            setValue('descripcion', newDesc, { shouldDirty: true, shouldValidate: true });
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            toast.error('Permiso de micrófono denegado.');
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Error starting recognition:', e);
      }
    }
  };

  const onSubmit = (data: CrearPropiedadDTO) => {
    // FIRE AND FORGET: Respuesta instantánea
    setIsSuccess(true);
    if (!isEditing) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }

    // Cerramos el modal/formulario inmediatamente tras un breve feedback visual
    setTimeout(() => {
      onSuccess();
    }, 600);

    const payload = {
      ...data,
      precio: Number(data.precio),
      habitaciones: Number(data.habitaciones || 0),
      banos: Number(data.banos || 0),
      areaTotal: Number(data.areaTotal)
    };

    // Ejecutamos la petición en segundo plano
    const action = isEditing 
      ? actualizarPropiedad(initialData.id, payload)
      : crearPropiedad(payload);

    action.catch((err) => {
      console.error('Error al guardar propiedad en background:', err);
      // Notificamos el error aunque hayamos cerrado el modal
      toast.error(`Error al ${isEditing ? 'actualizar' : 'registrar'} propiedad`, {
        description: 'Hubo un problema de conexión. Por favor revisa tu catálogo en unos momentos.'
      });
    });
  };

  return (
    <div className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-300 relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
      <button 
        onClick={onCancel}
        disabled={isSuccess}
        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-0"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          {isEditing ? 'Editar Propiedad' : 'Nueva Propiedad'}
        </h2>
        <div className="flex flex-wrap items-center gap-2 mt-1 min-h-[24px]">
          <p className="text-slate-500 font-medium text-sm">
            {isEditing ? 'Actualiza los detalles técnicos del inmueble.' : 'Ingresa los detalles del inmueble para el catálogo.'}
          </p>
          
          {!isEditing && hasData && !isSuccess && (
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

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {/* 1. TÍTULO */}
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

          {/* 2. DESCRIPCIÓN */}
          <div className="md:col-span-6 space-y-2">
            <div className="flex items-center justify-between pl-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Descripción Detallada</label>
              <button
                type="button"
                onClick={toggleListening}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight transition-all active:scale-95 cursor-pointer ${
                  isListening 
                    ? 'bg-rose-500 text-white animate-pulse' 
                    : 'bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="h-3 w-3" />
                    Detener dictado
                  </>
                ) : (
                  <>
                    <Mic className="h-3 w-3" />
                    Dictar descripción
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <FileText className="absolute left-3.5 top-4 h-4 w-4 text-slate-400" />
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

          {/* 3. TIPO (Trigger de visibilidad) */}
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Tipo de Propiedad</label>
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
                        {field.value || 'Seleccionar tipo de inmueble...'}
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
            {errors.tipoPropiedad && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.tipoPropiedad.message}</p>}
          </div>

          {/* CAMPOS DINÁMICOS - Solo si hay tipoSeleccionado */}
          {tipoSeleccionado && (
            <div className="md:col-span-6 grid grid-cols-1 md:grid-cols-6 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
              
              {/* Operación */}
              <div className="md:col-span-3 space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Operación</label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Controller
                    name="operacion"
                    control={control}
                    rules={{ required: 'Selecciona operación' }}
                    render={({ field }) => (
                      <div className="relative" ref={activeSelect === 'operacion' ? selectRef : null}>
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
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Precio */}
              <div className="md:col-span-3 space-y-2">
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
              <div className="md:col-span-3 space-y-2">
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
              <div className="md:col-span-3 space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Ciudad</label>
                <input 
                  {...register('ciudad', { required: 'Requerido' })}
                  type="text" 
                  disabled={isSuccess}
                  placeholder="Ej. Quito"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-50"
                />
              </div>

              {/* Dirección Exacta */}
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

              {/* Habitaciones - Solo Vivienda */}
              {['Casa', 'Departamento', 'Suite'].includes(tipoSeleccionado) && (
                <div className="md:col-span-2 space-y-2 animate-in fade-in duration-300">
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
              )}

              {/* Baños - Todos menos Terreno */}
              {tipoSeleccionado !== 'Terreno' && (
                <div className="md:col-span-2 space-y-2 animate-in fade-in duration-300">
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
              )}

              {/* Comisión & Captación */}
              <div className="md:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 bg-blue-50/50 border-2 border-blue-100/50 rounded-[24px] cursor-pointer hover:bg-blue-50 transition-all group">
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" {...register('esCaptacionPropia')} className="sr-only peer" defaultChecked={true} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight block">¿Captación propia?</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block opacity-70">Gestión directa</span>
                  </div>
                </label>

                <div className="bg-slate-50 border-2 border-slate-100 rounded-[24px] p-4 flex items-center justify-between gap-4 group hover:border-blue-200 transition-all">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Comisión (%)</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest opacity-70">Porcentaje pactado</span>
                  </div>
                  <div className="relative w-24">
                    <input 
                      {...register('porcentajeComision', { required: true, min: 0, max: 100 })}
                      type="number" 
                      step="0.1"
                      defaultValue={5.0}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-blue-600 text-center focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-8 flex items-center gap-3">
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={isSuccess}
            className="flex-1 py-4 text-slate-400 font-bold text-sm hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-0"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={isSuccess || !tipoSeleccionado}
            className={`flex-[2] py-4 font-black rounded-2xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed ${
              isSuccess ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700 disabled:bg-slate-300'
            }`}
          >
            {isSuccess ? (
              <div className="flex items-center gap-2 animate-in zoom-in duration-300">
                <Check className="h-5 w-5 stroke-[4px]" />
                <span>¡{isEditing ? 'Actualizada' : 'Registrada'}!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {isEditing ? <Pencil className="h-4 w-4" /> : null}
                <span>{isEditing ? 'Actualizar Propiedad' : 'Guardar Propiedad'}</span>
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
