import { useForm } from 'react-hook-form';
import { useSWRConfig } from 'swr';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { crearContacto, type CrearContactoDTO } from '../api/crearContacto';
import { actualizarContacto } from '../api/actualizarContacto';
import type { Contacto } from '../types';

interface UseCrearContactoProps {
  initialData?: Contacto;
  isOwnersView?: boolean;
  onSuccess: () => void;
}

const DRAFT_STORAGE_KEY = 'crm_contacto_draft';

export const useCrearContacto = ({ initialData, isOwnersView, onSuccess }: UseCrearContactoProps) => {
  const { mutate } = useSWRConfig();
  const isEditing = !!initialData;
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [roleError, setRoleError] = useState(false);

  const getInitialValues = (): Partial<CrearContactoDTO> => {
    if (isEditing) return initialData;

    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      try {
        return {
          ...JSON.parse(saved),
          esContacto: JSON.parse(saved).esContacto ?? true,
          esPropietario: JSON.parse(saved).esPropietario ?? isOwnersView
        };
      } catch (e) {
        console.error('Error al parsear borrador:', e);
      }
    }
    return {
      telefono: '+593 ',
      esContacto: true,
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
  } = useForm<CrearContactoDTO>({
    defaultValues: getInitialValues() as CrearContactoDTO
  });

  const currentValues = watch();

  useEffect(() => {
    return () => {
      const win = window as typeof window & { _phoneValidationAbort?: AbortController };
      if (win._phoneValidationAbort) {
        win._phoneValidationAbort.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (currentValues.esContacto || currentValues.esPropietario) {
      setRoleError(false);
    }
  }, [currentValues.esContacto, currentValues.esPropietario]);

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
        esContacto: dirtyFields.esContacto ? currentValues.esContacto : (initialData.esContacto ?? true),
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
      esContacto: true,
      esPropietario: isOwnersView || false
    });
    setIsConfirmingClear(false);
  };

  const onSubmit = (data: CrearContactoDTO) => {
    if (!data.esContacto && !data.esPropietario) {
      setRoleError(true);
      return;
    }

    setIsSuccess(true);
    if (!isEditing) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }

    setTimeout(() => {
      onSuccess();
    }, 600);

    const dataToSend = {
      ...data,
      esContacto: !!data.esContacto,
      esPropietario: !!data.esPropietario
    };

    const action = isEditing 
      ? actualizarContacto(initialData.id, dataToSend)
      : crearContacto(dataToSend);

    action.then(() => {
      mutate('/dashboard/kpis');
      mutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
    }).catch((err) => {
      console.error('Error al guardar contacto en background:', err);
      toast.error(`Error al ${isEditing ? 'actualizar' : 'registrar'} contacto`, {
        description: 'Hubo un problema de conexión. Por favor revisa tu lista de contactos en unos momentos.'
      });
    });
  };

  const validateTelefono = async (value: string) => {
    if (!value) return true;
    const normalized = value.trim().replace(/\s+/g, '');
    
    // Nueva validación básica de longitud
    if (normalized.length < 8) {
      return 'El teléfono ingresado es muy corto';
    }

    // Abort controller para evitar llamadas de red redundantes y debounce
    const win = window as typeof window & { _phoneValidationAbort?: AbortController };
    if (win._phoneValidationAbort) {
      win._phoneValidationAbort.abort();
    }
    const abortController = new AbortController();
    win._phoneValidationAbort = abortController;

    try {
      // Debounce manual de 400ms
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, 400);
        abortController.signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/contactos/buscar?telefono=${encodeURIComponent(normalized)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        signal: abortController.signal
      });
      if (response.ok) {
        const existing = await response.json();
        if (existing && (!isEditing || existing.id !== initialData.id)) {
          return 'Este número ya está registrado con otro contacto';
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') {
        // Ignorar errores de abort, React Hook Form espera una resolución
        // Retornar true permite que siga hasta que la última llamada real retorne un error si lo hay
        return true;
      }
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
    validateTelefono,
    roleError
  };
};
