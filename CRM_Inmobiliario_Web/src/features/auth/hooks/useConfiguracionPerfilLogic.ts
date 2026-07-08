import { useState, useEffect, useRef } from 'react';
import { usePerfil } from '../api/perfil';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { usePasswordLockout } from './usePasswordLockout';
import { translateAuthError } from '../../../lib/auth-errors';

export interface FormDataPerfil {
  nombre: string;
  apellido: string;
  telefono: string;
  agenciaId: string;
  fotoUrl: string;
  logoUrl: string;
  direccionFisica: string;
  promptPersonalIA: string;
}

export interface PwdData {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

export const useConfiguracionPerfilLogic = () => {
  const { perfil, actualizarPerfil, mutate, isLoading } = usePerfil();
  
  const isInitialized = useRef(false);
  const lastSyncedData = useRef(perfil);

  const [formData, setFormData] = useState<FormDataPerfil>({
    nombre: '',
    apellido: '',
    telefono: '',
    agenciaId: '',
    fotoUrl: '',
    logoUrl: '',
    direccionFisica: '',
    promptPersonalIA: ''
  });

  const [showSuccess, setShowSuccess] = useState(false);

  // Estados para Cambio de Contraseña
  const [pwdData, setPwdData] = useState<PwdData>({
    currentPassword: '',
    password: '',
    confirmPassword: ''
  });
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);
  const lockout = usePasswordLockout('perfil_seguridad');

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

    const isFirstTime = !isInitialized.current;

    if (isFirstTime) {
      setFormData({
        nombre: perfil.nombre ?? '',
        apellido: perfil.apellido ?? '',
        telefono: perfil.telefono ?? '',
        agenciaId: perfil.agenciaId ?? '',
        fotoUrl: perfil.fotoUrl ?? '',
        logoUrl: perfil.logoUrl ?? '',
        direccionFisica: perfil.direccionFisica ?? '',
        promptPersonalIA: perfil.promptPersonalIA ?? ''
      });
      isInitialized.current = true;
      lastSyncedData.current = perfil;
    } else {
      setFormData(prev => {
        const getMerged = (field: keyof FormDataPerfil, perfilValue: string | null | undefined) => {
          const lastValue = (lastSyncedData.current as Record<keyof FormDataPerfil, string | null | undefined> | undefined)?.[field] ?? '';
          const currentValue = prev[field] ?? '';
          const incomingValue = perfilValue ?? '';
          return currentValue !== lastValue ? currentValue : incomingValue;
        };

        return {
          nombre: getMerged('nombre', perfil.nombre),
          apellido: getMerged('apellido', perfil.apellido),
          telefono: getMerged('telefono', perfil.telefono),
          agenciaId: getMerged('agenciaId', perfil.agenciaId),
          fotoUrl: getMerged('fotoUrl', perfil.fotoUrl),
          logoUrl: getMerged('logoUrl', perfil.logoUrl),
          direccionFisica: getMerged('direccionFisica', perfil.direccionFisica),
          promptPersonalIA: getMerged('promptPersonalIA', perfil.promptPersonalIA)
        };
      });
      lastSyncedData.current = perfil;
    }
  }, [perfil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    try {
      await actualizarPerfil({
        ...formData,
        agenciaId: formData.agenciaId || null
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

    if (lockout.isLocked) {
      toast.error(`Por seguridad, debe esperar ${lockout.formattedLockoutTime} para volver a intentar.`);
      return;
    }

    setIsUpdatingPwd(true);

    try {
      if (perfil?.email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: perfil.email,
          password: pwdData.currentPassword
        });

        if (signInError) {
          lockout.registerFailedAttempt();
          throw new Error('La contraseña actual es incorrecta.');
        }
        lockout.registerSuccessfulAttempt();
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
      toast.error('Error', { description: translateAuthError(pError.message) });
    } finally {
      setIsUpdatingPwd(false);
    }
  };

  return {
    perfil,
    isLoading,
    formData,
    setFormData,
    showSuccess,
    handleSubmit,
    pwdData,
    setPwdData,
    isUpdatingPwd,
    validations,
    allValid,
    handleUpdatePassword,
    actualizarPerfil,
    lockout
  };
};

export type UseConfiguracionPerfilLogicReturn = ReturnType<typeof useConfiguracionPerfilLogic>;
