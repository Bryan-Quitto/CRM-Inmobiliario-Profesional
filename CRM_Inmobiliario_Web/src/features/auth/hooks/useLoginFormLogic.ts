import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { usePasswordLockout } from './usePasswordLockout';

export const useLoginFormLogic = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lockout = usePasswordLockout('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (lockout.isLocked) {
      setIsLoading(false);
      setError(`Por seguridad, debe esperar ${lockout.formattedLockoutTime} para volver a intentar.`);
      return;
    }

    try {
      localStorage.removeItem('crm-swr-cache');
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        let message = 'Error al iniciar sesión';
        if (authError.message === 'Invalid login credentials') {
          message = 'Email o contraseña incorrectos';
          lockout.registerFailedAttempt();
        } else if (authError.message.toLowerCase().includes('banned')) {
          message = 'Esta cuenta ha sido desactivada por el administrador.';
        } else {
          message = authError.message;
        }
        setError(message);
        toast.error(message);
      } else {
        lockout.registerSuccessfulAttempt();
        toast.success('¡Bienvenido de nuevo!');
      }
    } catch {
      setError('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleLogin,
    lockout
  };
};
