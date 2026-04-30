import { useState, useEffect, useRef } from 'react';
import { usePerfil } from '../api/perfil';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

export interface FormDataPerfil {
  nombre: string;
  apellido: string;
  telefono: string;
  agenciaId: string;
  fotoUrl: string;
  logoUrl: string;
}

export interface PwdData {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

export const useConfiguracionPerfil = () => {
  const { perfil, actualizarPerfil, mutate, isLoading } = usePerfil();
  
  const isInitialized = useRef(false);
  const lastSyncedData = useRef(perfil);

  const [formData, setFormData] = useState<FormDataPerfil>({
    nombre: '',
    apellido: '',
    telefono: '',
    agenciaId: '',
    fotoUrl: '',
    logoUrl: ''
  });

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
      setFormData({
        nombre: perfil.nombre ?? '',
        apellido: perfil.apellido ?? '',
        telefono: perfil.telefono ?? '',
        agenciaId: perfil.agenciaId ?? '',
        fotoUrl: perfil.fotoUrl ?? '',
        logoUrl: perfil.logoUrl ?? ''
      });
      lastSyncedData.current = perfil;
      isInitialized.current = true;
      return;
    }

    if (isInitialized.current) {
      setFormData(prev => {
        const merged = {
          nombre: prev.nombre !== (lastSyncedData.current?.nombre ?? '') ? prev.nombre : (perfil.nombre ?? ''),
          apellido: prev.apellido !== (lastSyncedData.current?.apellido ?? '') ? prev.apellido : (perfil.apellido ?? ''),
          telefono: prev.telefono !== (lastSyncedData.current?.telefono ?? '') ? prev.telefono : (perfil.telefono ?? ''),
          agenciaId: prev.agenciaId !== (lastSyncedData.current?.agenciaId ?? '') ? prev.agenciaId : (perfil.agenciaId ?? ''),
          fotoUrl: prev.fotoUrl !== (lastSyncedData.current?.fotoUrl ?? '') ? prev.fotoUrl : (perfil.fotoUrl ?? ''),
          logoUrl: prev.logoUrl !== (lastSyncedData.current?.logoUrl ?? '') ? prev.logoUrl : (perfil.logoUrl ?? '')
        };
        lastSyncedData.current = perfil;
        return merged;
      });
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
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
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
    actualizarPerfil
  };
};
