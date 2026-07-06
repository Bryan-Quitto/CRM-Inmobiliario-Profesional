import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const useActualizarClaveLogic = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const validations = {
    personal: true,
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    match: password !== '' && password === confirmPassword
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = Object.values(validations).every(Boolean);
    if (!isValid) {
      setError('Por favor cumple con todos los requisitos de la contraseña.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: password
      });

      if (authError) {
        setError('Error al actualizar la contraseña.');
        toast.error('Error al actualizar la contraseña.');
      } else {
        toast.success('¡Contraseña actualizada con éxito!');
        navigate('/');
      }
    } catch {
      setError('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    error,
    handleSubmit,
    validations
  };
};
