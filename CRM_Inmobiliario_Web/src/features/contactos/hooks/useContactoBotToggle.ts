import { useState, useEffect } from 'react';
import { useSWRConfig } from 'swr';
import { toggleBotActivo } from '../api/toggleBotActivo';
import { api } from '@/lib/axios';
import { toast } from 'sonner';

interface ToggleContacto {
  id: string;
  botActivo: boolean;
  estadoIA?: string | null;
}

export const useContactoBotToggle = (contacto: ToggleContacto) => {
  const { mutate } = useSWRConfig();
  const [isBotActivo, setIsBotActivo] = useState(contacto.botActivo);
  const [isLoading, setIsLoading] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  useEffect(() => {
    setIsBotActivo(contacto.botActivo);
  }, [contacto.botActivo]);

  const handleToggle = async (checked: boolean) => {
    if (checked && contacto.estadoIA === 'LimiteAlcanzado') {
      setShowOverrideModal(true);
      return;
    }

    // Optimistic Update
    setIsBotActivo(checked);
    setIsLoading(true);

    try {
      await toggleBotActivo(contacto.id, checked);
      toast.success(checked ? 'Bot activado' : 'Bot desactivado', {
        description: checked 
          ? 'La IA responderá los mensajes de este contacto.' 
          : 'La IA ya no responderá los mensajes de este contacto.',
      });
      // Invalidar queries para sincronizar en background
      mutate('/contactos');
      mutate(`/contactos/${contacto.id}`);
    } catch (error) {
      // Rollback on error
      setIsBotActivo(!checked);
      toast.error('Error al cambiar el estado del bot');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmOverride = async () => {
    setShowOverrideModal(false);
    setIsBotActivo(true);
    setIsLoading(true);

    try {
      await api.post(`/contactos/${contacto.id}/bot-override`);
      toast.success('Bot reactivado y límite reiniciado');
      mutate('/contactos');
      mutate(`/contactos/${contacto.id}`);
    } catch (error) {
      setIsBotActivo(false);
      toast.error('Error al reactivar el bot');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelOverride = () => {
    setShowOverrideModal(false);
  };

  return {
    isBotActivo,
    handleToggle,
    isLoading,
    showOverrideModal,
    confirmOverride,
    cancelOverride
  };
};
