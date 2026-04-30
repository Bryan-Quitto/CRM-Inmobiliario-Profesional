import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { api } from '../../../lib/axios';
import { toast } from 'sonner';

export const useConfirmarInvitacion = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    agenciaId: '',
    agenciaNombre: '',
    password: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPredefinedAgency, setHasPredefinedAgency] = useState(false);

  useEffect(() => {
    const checkMetadata = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.warn('No se pudo recuperar el usuario de la sesión actual');
          return;
        }

        if (user.user_metadata?.agencia_id) {
          const agencyId = user.user_metadata.agencia_id;
          setFormData(prev => ({ ...prev, agenciaId: agencyId }));
          setHasPredefinedAgency(true);

          const response = await api.get(`/configuracion/agencias/${agencyId}`);
          if (response.data) {
            setFormData(prev => ({ ...prev, agenciaNombre: response.data.nombre }));
          }
        }
      } catch (err) {
        console.error('Error al inicializar datos de invitación:', err);
        setFormData(prev => ({ 
          ...prev, 
          agenciaNombre: prev.agenciaId ? 'Agencia Asignada' : 'Independiente' 
        }));
      }
    };
    
    checkMetadata();
  }, []);

  const validations = {
    personal: formData.nombre.trim() !== '' && formData.apellido.trim() !== '' && formData.telefono.trim() !== '',
    length: formData.password.length >= 8,
    hasUpper: /[A-Z]/.test(formData.password),
    hasLower: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    match: formData.password === formData.confirmPassword && formData.password !== ''
  };

  const allValid = Object.values(validations).every(v => v);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
        data: {
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono
        }
      });

      if (updateError) throw updateError;

      await api.post('/configuracion/activar-perfil', {
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
        agenciaId: formData.agenciaId || null
      });

      toast.success('¡Perfil configurado!', {
        description: 'Tu cuenta ha sido activada con éxito.'
      });

      window.history.replaceState(null, '', window.location.pathname);

      setTimeout(() => {
        window.location.href = '/';
      }, 1500);

    } catch (err: unknown) {
      console.error(err);
      const errorWithMsg = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = errorWithMsg.response?.data?.message || errorWithMsg.message || 'Error al activar tu perfil';
      setError(msg);
      toast.error('Error de activación');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    error,
    hasPredefinedAgency,
    validations,
    allValid,
    handleChange,
    handleActivate
  };
};
