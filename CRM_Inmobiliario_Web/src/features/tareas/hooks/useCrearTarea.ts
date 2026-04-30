import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { crearTarea } from '../api/crearTarea';
import { useTareas } from '../context/useTareas';
import type { CrearTareaDTO, Tarea } from '../types';

const DRAFT_STORAGE_KEY = 'crm_tarea_draft';

interface UseCrearTareaProps {
  onSuccess: () => void;
  fechaInicial?: string;
  prefill?: {
    titulo?: string;
    tipoTarea?: string;
    fechaInicio?: string;
    clienteId?: string;
    clienteLabel?: string;
    propiedadId?: string;
    propiedadLabel?: string;
    lugar?: string;
  };
}

export const useCrearTarea = ({ onSuccess, fechaInicial, prefill }: UseCrearTareaProps) => {
  const { mutate } = useSWRConfig();
  const { clientes, propiedades, addTarea } = useTareas();

  const clienteOptions = useMemo(() =>
    clientes.map(c => ({ id: c.id, title: [c.nombre, c.apellido].filter(Boolean).join(' '), subtitle: c.telefono })),
    [clientes]
  );

  const propiedadOptions = useMemo(() =>
    propiedades.map(p => ({ id: p.id, title: p.titulo, subtitle: `${p.ciudad}, ${p.sector}` })),
    [propiedades]
  );

  const defaultFecha = useMemo(() => {
    if (fechaInicial) {
      if (fechaInicial.includes('T')) return fechaInicial;
      return `${fechaInicial}T10:00`;
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }, [fechaInicial]);

  const getInitialValues = (): CrearTareaDTO => {
    if (prefill) {
      return {
        titulo: prefill.titulo ?? '',
        descripcion: '',
        tipoTarea: prefill.tipoTarea ?? 'Llamada',
        fechaInicio: prefill.fechaInicio ?? defaultFecha,
        clienteId: prefill.clienteId,
        propiedadId: prefill.propiedadId,
        lugar: prefill.lugar,
      };
    }

    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        delete draft.fechaInicio;
        return { ...draft, fechaInicio: defaultFecha };
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

  const { register, handleSubmit, formState: { errors }, reset, control, setValue, watch } = useForm<CrearTareaDTO>({
    defaultValues: getInitialValues()
  });

  const formData = useWatch({ control });

  const onSubmit = (data: CrearTareaDTO) => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);

    const tempId = `temp-${new Date().getTime()}`;
    const cliente = data.clienteId ? clientes.find(c => c.id === data.clienteId) : null;
    const propiedad = data.propiedadId ? propiedades.find(p => p.id === data.propiedadId) : null;

    const nuevaTareaOptimista: Tarea = {
      id: tempId,
      ...data,
      tipoTarea: data.tipoTarea as 'Llamada' | 'Visita' | 'Reunión' | 'Trámite',
      estado: 'Pendiente' as const,
      fechaInicio: new Date(data.fechaInicio).toISOString(),
      clienteNombre: cliente ? [cliente.nombre, cliente.apellido].filter(Boolean).join(' ') : undefined,
      propiedadTitulo: propiedad ? propiedad.titulo : undefined
    };

    const payload = {
      ...data,
      fechaInicio: new Date(data.fechaInicio).toISOString()
    };

    const savePromise = crearTarea(payload);

    addTarea(nuevaTareaOptimista, savePromise).catch(err => {
      console.error('Error en sync de addTarea:', err);
      toast.error('No se pudo sincronizar la tarea');
    });

    mutate('/dashboard/kpis');
    mutate(key => typeof key === 'string' && key.startsWith('/analitica/'));

    onSuccess();
  };

  const handleClearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    reset({
      titulo: '',
      descripcion: '',
      tipoTarea: 'Llamada',
      fechaInicio: defaultFecha
    });
  };

  return {
    register,
    handleSubmit,
    errors,
    control,
    setValue,
    watch,
    formData,
    clienteOptions,
    propiedadOptions,
    onSubmit,
    handleClearDraft,
    defaultFecha
  };
};

export type UseCrearTareaReturn = ReturnType<typeof useCrearTarea>;
