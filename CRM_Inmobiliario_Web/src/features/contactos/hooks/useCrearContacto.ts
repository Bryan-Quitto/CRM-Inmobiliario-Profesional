import { useForm } from 'react-hook-form';
import { useSWRConfig } from 'swr';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { invalidateCRMData } from '@/lib/swr';
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
          esCliente: JSON.parse(saved).esCliente ?? true,
          esPropietario: JSON.parse(saved).esPropietario ?? isOwnersView
        };
      } catch { /* ignore */ }
    }
    return {
      telefono: '+593 ',
      esCliente: true,
      esPropietario: isOwnersView || false
    };
  };

  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors, isDirty, dirtyFields, isSubmitting }, 
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
    if (currentValues.esCliente || currentValues.esPropietario) {
      setRoleError(false);
    }
  }, [currentValues.esCliente, currentValues.esPropietario]);

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
        esCliente: dirtyFields.esCliente ? currentValues.esCliente : (initialData.esCliente ?? true),
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
      esCliente: true,
      esPropietario: isOwnersView || false
    });
    setIsConfirmingClear(false);
  };

  const onSubmit = (data: CrearContactoDTO) => {
    if (!data.esCliente && !data.esPropietario) {
      setRoleError(true);
      return;
    }

    const telefonoLimpio = data.telefono?.replace(/\s+/g, '') || '';
    const isJustPrefixSubmit = /^\+\d{1,4}$/.test(telefonoLimpio);
    const telefonoFinal = (!telefonoLimpio || isJustPrefixSubmit) ? '' : data.telefono;

    const dataToSend = {
      ...data,
      telefono: telefonoFinal,
      esCliente: !!data.esCliente,
      esPropietario: !!data.esPropietario
    };

    const action = isEditing 
      ? actualizarContacto(initialData.id, dataToSend)
      : crearContacto(dataToSend);

    setIsSuccess(true);
    setTimeout(() => {
      onSuccess();
    }, 600);

    const toastId = toast.loading('Sincronizando contacto...');

    action.then(() => {
      invalidateCRMData(mutate);

      if (!isEditing) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
      
      toast.success(`Contacto ${isEditing ? 'actualizado' : 'registrado'}.`, { id: toastId });
    }).catch((err: unknown) => {

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorObj = err as any;
      const errorMessage = errorObj?.response?.data?.error || 'Hubo un problema de conexión. Por favor revisa tu lista de contactos en unos momentos.';
      toast.error("Error de Sincronización", {
        id: toastId,
        description: errorMessage,
        duration: Infinity,
        action: {
          label: "Corregir",
          onClick: () => {
             window.dispatchEvent(new CustomEvent('open-crear-contacto-modal', { 
               detail: { action: isEditing ? 'edit' : 'create', contacto: isEditing ? { ...initialData, ...dataToSend } : undefined } 
             }));
          }
        }
      });
    });
  };

  const validateTelefono = async (value: string) => {
    const isWhatsApp = currentValues.origen?.toLowerCase().includes('whatsapp');
    const normalized = value ? value.trim().replace(/\s+/g, '') : '';
    const isJustPrefix = /^\+\d{1,4}$/.test(normalized);
    
    if (!normalized || isJustPrefix) {
      if (isWhatsApp) return 'El teléfono es obligatorio para contactos de WhatsApp';
      return true;
    }
    
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
    isSubmitting,
    hasData,
    isConfirmingClear,
    setIsConfirmingClear,
    handleClearDraft,
    validateTelefono,
    roleError
  };
};
