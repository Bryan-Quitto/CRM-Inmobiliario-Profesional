import { useState, useEffect } from 'react';
import { useSWRConfig } from 'swr';
import { toggleBotActivo } from '../api/toggleBotActivo';
import { toast } from 'sonner';

export const useContactoBotToggle = (contactoId: string, initialBotActivo: boolean) => {
  const { mutate } = useSWRConfig();
  const [isBotActivo, setIsBotActivo] = useState(initialBotActivo);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsBotActivo(initialBotActivo);
  }, [initialBotActivo]);

  const handleToggle = async (checked: boolean) => {
    // Optimistic Update
    setIsBotActivo(checked);
    setIsLoading(true);

    try {
      await toggleBotActivo(contactoId, checked);
      toast.success(checked ? 'Bot activado' : 'Bot desactivado', {
        description: checked 
          ? 'La IA responderá los mensajes de este contacto.' 
          : 'La IA ya no responderá los mensajes de este contacto.',
      });
      // Invalidar queries para sincronizar en background
      mutate('/contactos');
      mutate(`/contactos/${contactoId}`);
    } catch (error) {
      // Rollback on error
      setIsBotActivo(!checked);
      toast.error('Error al cambiar el estado del bot');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isBotActivo,
    handleToggle,
    isLoading,
  };
};
