import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import type { 
  UseFormRegister, 
  UseFormHandleSubmit, 
  UseFormWatch, 
  FieldErrors, 
  Control, 
  UseFormSetValue 
} from 'react-hook-form';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { getTareaById } from '../api/getTareaById';
import { actualizarTarea } from '../api/actualizarTarea';
import { useTareas } from '../context/useTareas';
import { toLocalISOString } from '../constants';
import type { ActualizarTareaDTO, Tarea } from '../types';

interface UseEditarTareaProps {
  tareaId: string;
  initialData?: Tarea;
  onSuccess: () => void;
}

export type EditarTareaFormValues = ActualizarTareaDTO & { contactoNombre?: string; propiedadTitulo?: string };

export const useEditarTarea = ({ tareaId, initialData, onSuccess }: UseEditarTareaProps) => {
  const { mutate } = useSWRConfig();
  const { contactos, propiedades, updateTarea } = useTareas();
  
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isSyncing, setIsSyncing] = useState(!!initialData);
  const [isReadOnly, setIsReadOnly] = useState(initialData ? initialData.estado !== 'Pendiente' : false);

  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors }, 
    control, 
    setValue, 
    getValues 
  } = useForm<EditarTareaFormValues>({
    defaultValues: initialData ? {
      titulo: initialData.titulo,
      descripcion: initialData.descripcion || '',
      tipoTarea: initialData.tipoTarea,
      fechaInicio: toLocalISOString(initialData.fechaInicio),
      contactoId: initialData.contactoId,
      propiedadId: initialData.propiedadId,
      lugar: initialData.lugar,
      contactoNombre: initialData.contactoNombre,
      propiedadTitulo: initialData.propiedadTitulo,
      duracionMinutos: 30
    } : undefined
  });

  const contactoOptions = useMemo(() => 
    contactos.map(c => ({ 
      id: c.id, 
      title: [c.nombre, c.apellido].filter(Boolean).join(' '), 
      subtitle: c.telefono 
    })),
    [contactos]
  );

  const propiedadOptions = useMemo(() => 
    propiedades.map(p => ({ 
      id: p.id, 
      title: p.titulo, 
      subtitle: `${p.ciudad}, ${p.sector}` 
    })),
    [propiedades]
  );

  useEffect(() => {
    const fetchTarea = async () => {
      try {
        if (!initialData) setIsLoading(true);
        else setIsSyncing(true);

        const data = await getTareaById(tareaId);
        const fechaLocal = toLocalISOString(data.fechaInicio);
        const initialFechaLocal = initialData ? toLocalISOString(initialData.fechaInicio) : '';
        
        setIsReadOnly(data.estado !== 'Pendiente');

        const currentForm = getValues();

        const shouldUpdate = (fieldName: keyof EditarTareaFormValues, serverValue: unknown, initialValue: unknown) => {
          if (currentForm[fieldName] !== initialValue) return false;
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

        if (shouldUpdate('contactoId', data.contactoId, initialData?.contactoId)) {
          setValue('contactoId', data.contactoId);
          setValue('contactoNombre', data.contactoNombre);
        }

        if (shouldUpdate('propiedadId', data.propiedadId, initialData?.propiedadId)) {
          setValue('propiedadId', data.propiedadId);
          setValue('propiedadTitulo', data.propiedadTitulo);
        }

        if (shouldUpdate('lugar', data.lugar, initialData?.lugar)) {
          setValue('lugar', data.lugar);
        }
        
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
  }, [tareaId, initialData]);

  const onSubmit = (data: EditarTareaFormValues) => {
    if (isReadOnly) return;
    
    const values = getValues();
    localStorage.removeItem(`tarea_cache_${tareaId}`);

    const contacto = values.contactoId ? contactos.find(c => c.id === values.contactoId) : null;
    const propiedad = values.propiedadId ? propiedades.find(p => p.id === values.propiedadId) : null;

    const updatedFields: Partial<Tarea> = {
      ...values,
      tipoTarea: values.tipoTarea as 'Llamada' | 'Visita' | 'Reunión' | 'Trámite',
      fechaInicio: new Date(values.fechaInicio).toISOString(),
      contactoNombre: contacto ? [contacto.nombre, contacto.apellido].filter(Boolean).join(' ') : undefined,
      propiedadTitulo: propiedad ? propiedad.titulo : undefined
    };

    const payload: ActualizarTareaDTO = {
      titulo: data.titulo,
      descripcion: data.descripcion,
      tipoTarea: data.tipoTarea,
      fechaInicio: new Date(values.fechaInicio).toISOString(),
      duracionMinutos: data.duracionMinutos,
      contactoId: data.contactoId,
      propiedadId: data.propiedadId,
      lugar: data.lugar
    };

    const savePromise = actualizarTarea(tareaId, payload);
    
    updateTarea(tareaId, updatedFields, savePromise).catch(err => {
      console.error('Error en sync de updateTarea:', err);
      toast.error('No se pudo sincronizar el cambio');
    });

    mutate('/dashboard/kpis');
    mutate(key => typeof key === 'string' && key.startsWith('/analitica/'));

    onSuccess();
  };

  return {
    register,
    handleSubmit,
    watch,
    errors,
    control,
    setValue,
    isLoading,
    isSyncing,
    isReadOnly,
    contactoOptions,
    propiedadOptions,
    onSubmit
  };
};

export type { UseFormRegister, UseFormHandleSubmit, UseFormWatch, FieldErrors, Control, UseFormSetValue };
