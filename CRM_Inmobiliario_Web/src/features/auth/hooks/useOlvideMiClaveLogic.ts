import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { translateAuthError } from '../../../lib/auth-errors';

export const useOlvideMiClaveLogic = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/actualizar-clave`,
      });

      if (authError) {
        if (authError.status === 429) {
          const limitMsg = 'Has alcanzado el límite de correos permitidos, por favor vuelve a intentarlo dentro de 1 hora o si tienes alguna urgencia, contáctate a soporte@luminacrminmobiliario.com';
          setError(limitMsg);
          toast.warning(limitMsg, { duration: 8000 });
        } else {
          const msg = translateAuthError(authError.message);
          setError(msg);
          toast.error(msg);
        }
      } else {
        setIsSuccess(true);
        toast.success('¡Enlace de recuperación enviado! Revisa tu correo.');
      }
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    isLoading,
    isSuccess,
    error,
    handleSubmit
  };
};
