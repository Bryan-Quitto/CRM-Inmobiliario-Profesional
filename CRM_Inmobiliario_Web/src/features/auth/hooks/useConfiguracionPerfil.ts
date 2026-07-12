import { useState, useEffect, useRef } from 'react';
import { usePerfil } from '../api/perfil';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export const perfilSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  apellido: z.string().min(1, 'El apellido es obligatorio').max(100),
  telefono: z.string().optional(),
  agenciaId: z.string().optional(),
  fotoUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  direccionFisica: z.string().max(500).optional(),
  promptPersonalIA: z.string().max(2000).optional()
});

export type FormDataPerfil = z.infer<typeof perfilSchema>;

export interface PwdData {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

export const useConfiguracionPerfil = () => {
  const { perfil, actualizarPerfil, mutate, isLoading } = usePerfil();
  
  const isInitialized = useRef(false);
  const lastSyncedData = useRef(perfil);

  const methods = useForm<FormDataPerfil>({
    resolver: zodResolver(perfilSchema),
    mode: 'onBlur',
    defaultValues: {
      nombre: '',
      apellido: '',
      telefono: '',
      agenciaId: '',
      fotoUrl: '',
      logoUrl: '',
      direccionFisica: '',
      promptPersonalIA: ''
    }
  });

  const { reset, handleSubmit: hookSubmit, getValues } = methods;

  const [showSuccess, setShowSuccess] = useState(false);

  // Estados para Cambio de Contraseña
  const [pwdData, setPwdData] = useState<PwdData>({
    currentPassword: '',
    password: '',
    confirmPassword: ''
  });
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  const validations = {
    length: pwdData.password.length >= 8,
    hasUpper: /[A-Z]/.test(pwdData.password),
    hasLower: /[a-z]/.test(pwdData.password),
    hasNumber: /[0-9]/.test(pwdData.password),
    match: pwdData.password === pwdData.confirmPassword && pwdData.password !== ''
  };

  const allValid = Object.values(validations).every(v => v);

  useEffect(() => {
    if (!perfil) return;

    if (!isInitialized.current && (perfil.nombre || perfil.apellido)) {
      reset({
        nombre: perfil.nombre ?? '',
        apellido: perfil.apellido ?? '',
        telefono: perfil.telefono ?? '',
        agenciaId: perfil.agenciaId ?? '',
        fotoUrl: perfil.fotoUrl ?? '',
        logoUrl: perfil.logoUrl ?? '',
        direccionFisica: perfil.direccionFisica ?? '',
        promptPersonalIA: perfil.promptPersonalIA ?? ''
      });
      lastSyncedData.current = perfil;
      isInitialized.current = true;
      return;
    }

    if (isInitialized.current) {
      const currentValues = getValues();
      const merged = {
        nombre: currentValues.nombre !== (lastSyncedData.current?.nombre ?? '') ? currentValues.nombre : (perfil.nombre ?? ''),
        apellido: currentValues.apellido !== (lastSyncedData.current?.apellido ?? '') ? currentValues.apellido : (perfil.apellido ?? ''),
        telefono: currentValues.telefono !== (lastSyncedData.current?.telefono ?? '') ? currentValues.telefono : (perfil.telefono ?? ''),
        agenciaId: currentValues.agenciaId !== (lastSyncedData.current?.agenciaId ?? '') ? currentValues.agenciaId : (perfil.agenciaId ?? ''),
        fotoUrl: currentValues.fotoUrl !== (lastSyncedData.current?.fotoUrl ?? '') ? currentValues.fotoUrl : (perfil.fotoUrl ?? ''),
        logoUrl: currentValues.logoUrl !== (lastSyncedData.current?.logoUrl ?? '') ? currentValues.logoUrl : (perfil.logoUrl ?? ''),
        direccionFisica: currentValues.direccionFisica !== (lastSyncedData.current?.direccionFisica ?? '') ? currentValues.direccionFisica : (perfil.direccionFisica ?? ''),
        promptPersonalIA: currentValues.promptPersonalIA !== (lastSyncedData.current?.promptPersonalIA ?? '') ? currentValues.promptPersonalIA : (perfil.promptPersonalIA ?? '')
      };
      reset(merged);
      lastSyncedData.current = perfil;
    }
  }, [perfil, reset, getValues]);

  const onSubmit = async (data: FormDataPerfil) => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    try {
      await actualizarPerfil({
        ...data,
        agenciaId: data.agenciaId || undefined
      });
      await mutate();
    } catch {
      toast.error('No se pudo sincronizar el perfil', {
        description: 'Tus cambios se mantendrán localmente pero hubo un error de conexión.'
      });
      await mutate();
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid || !pwdData.currentPassword) return;

    setIsUpdatingPwd(true);

    try {
      if (perfil?.email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: perfil.email,
          password: pwdData.currentPassword
        });

        if (signInError) {
          throw new Error('La contraseña actual es incorrecta.');
        }
      } else {
         throw new Error('No se pudo encontrar el correo electrónico asociado.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: pwdData.password,
      });

      if (updateError) throw updateError;

      toast.success('¡Contraseña actualizada!', {
        description: 'Tu contraseña de acceso ha sido cambiada correctamente.'
      });

      setPwdData({ currentPassword: '', password: '', confirmPassword: '' });
      
    } catch (err) {
      const pError = err as Error;
      toast.error('Error', { description: pError.message || 'Ocurrió un error al actualizar la contraseña' });
    } finally {
      setIsUpdatingPwd(false);
    }
  };

  return {
    perfil,
    isLoading,
    methods,
    showSuccess,
    handleSubmit: hookSubmit(onSubmit),
    pwdData,
    setPwdData,
    isUpdatingPwd,
    validations,
    allValid,
    handleUpdatePassword,
    actualizarPerfil
  };
};
