import { useForm } from 'react-hook-form';
import { useSWRConfig } from 'swr';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { crearCliente, type CrearClienteDTO } from '../api/crearCliente';
import { actualizarCliente } from '../api/actualizarCliente';
import type { Cliente } from '../types';

interface UseCrearClienteProps {
  initialData?: Cliente;
  isOwnersView?: boolean;
  onSuccess: () => void;
}

const DRAFT_STORAGE_KEY = 'crm_prospecto_draft';

export const useCrearCliente = ({ initialData, isOwnersView, onSuccess }: UseCrearClienteProps) => {
  const { mutate } = useSWRConfig();
  const isEditing = !!initialData;
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasData, setHasData] = useState(false);

  const getInitialValues = (): Partial<CrearClienteDTO> => {
    if (isEditing) return initialData;

    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      try {
        return {
          ...JSON.parse(saved),
          esPropietario: isOwnersView // Sobrescribir con el contexto actual si es nuevo
        };
      } catch (e) {
        console.error('Error al parsear borrador:', e);
      }
    }
    return {
      telefono: '+593 ',
      esPropietario: isOwnersView || false
    };
  };

  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors, isDirty, dirtyFields }, 
    reset, 
    control, 
    setValue, 
    getValues 
  } = useForm<CrearClienteDTO>({
    defaultValues: getInitialValues() as CrearClienteDTO
  });

  const currentValues = watch();

  // Smart Merge: Sincronizar cambios del servidor (initialData) sin borrar lo que el usuario escribe
  useEffect(() => {
    if (!isEditing || !initialData) return;

    if (isDirty) {
      const mergedValues = {
        nombre: dirtyFields.nombre ? currentValues.nombre : initialData.nombre,
        apellido: dirtyFields.apellido ? currentValues.apellido : (initialData.apellido || ''),
        email: dirtyFields.email ? currentValues.email : (initialData.email || ''),
        telefono: dirtyFields.telefono ? currentValues.telefono : initialData.telefono,
        origen: dirtyFields.origen ? currentValues.origen : initialData.origen,
        esPropietario: dirtyFields.esPropietario ? currentValues.esPropietario : (initialData.esPropietario || false)
      };
      reset(mergedValues);
    } else {
      reset(initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isEditing]);

  useEffect(() => {
    if (isEditing) return;

    // Sincronización inicial y suscripción optimizada para borrador
    const initialVals = getValues();
    setHasData(Object.values(initialVals).some(v => v));

    const subscription = watch((value) => {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(value));
      const isNowDirty = Object.values(value).some(v => v);
      if (isNowDirty !== hasData) setHasData(isNowDirty);
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues, hasData, isEditing]);

  const handleClearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    reset({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      origen: '',
      esPropietario: isOwnersView || false
    });
    setIsConfirmingClear(false);
  };

  const onSubmit = (data: CrearClienteDTO) => {
    setIsSuccess(true);
    if (!isEditing) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }

    setTimeout(() => {
      onSuccess();
    }, 600);

    const dataToSend = {
      ...data,
      esPropietario: !!data.esPropietario
    };

    const action = isEditing 
      ? actualizarCliente(initialData.id, dataToSend)
      : crearCliente(dataToSend);

    action.then(() => {
      mutate('/dashboard/kpis');
      mutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
    }).catch((err) => {
      console.error('Error al guardar cliente en background:', err);
      toast.error(`Error al ${isEditing ? 'actualizar' : 'registrar'} cliente`, {
        description: 'Hubo un problema de conexión. Por favor revisa tu lista de clientes en unos momentos.'
      });
    });
  };

  const validateTelefono = async (value: string) => {
    if (!value) return true;
    const normalized = value.trim().replace(/\s+/g, '');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/leads/buscar?telefono=${encodeURIComponent(normalized)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const existing = await response.json();
        if (existing && (!isEditing || existing.id !== initialData.id)) {
          return 'Este número ya está registrado con otro prospecto';
        }
      }
    } catch (e) {
      console.error('Error validando teléfono:', e);
    }
    return true;
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    control,
    setValue,
    isEditing,
    isSuccess,
    hasData,
    isConfirmingClear,
    setIsConfirmingClear,
    handleClearDraft,
    validateTelefono
  };
};
