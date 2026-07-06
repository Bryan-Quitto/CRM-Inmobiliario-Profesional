import { useState, useEffect } from 'react';
import { useSWRConfig } from 'swr';
import { toggleBotActivo } from '../api/toggleBotActivo';
import { api } from '@/lib/axios';
import { toast } from 'sonner';

interface ToggleContacto {
  id: string;
  botActivoWA?: boolean;
  botActivoFB?: boolean;
  estadoIA_WA?: string | null;
  estadoIA_FB?: string | null;
}

export const useContactoBotToggle = (contacto: ToggleContacto, channel: 'WhatsApp' | 'Facebook' = 'WhatsApp') => {
  const { mutate } = useSWRConfig();
  
  const getBotActivo = () => channel === 'Facebook' ? (contacto.botActivoFB ?? true) : (contacto.botActivoWA ?? true);
  const getEstadoIA = () => channel === 'Facebook' ? contacto.estadoIA_FB : contacto.estadoIA_WA;

  const [isBotActivo, setIsBotActivo] = useState(getBotActivo());
  const [isLoading, setIsLoading] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  useEffect(() => {
    setIsBotActivo(channel === 'Facebook' ? (contacto.botActivoFB ?? true) : (contacto.botActivoWA ?? true));
  }, [contacto.botActivoWA, contacto.botActivoFB, channel]);

  const handleToggle = async (checked: boolean) => {
    if (checked && getEstadoIA() === 'LimiteAlcanzado') {
      setShowOverrideModal(true);
      return;
    }

    // Optimistic Update
    setIsBotActivo(checked);
    setIsLoading(true);

    try {
      await toggleBotActivo(contacto.id, checked, channel);
      toast.success(checked ? 'Bot activado' : 'Bot desactivado', {
        description: checked 
          ? 'La IA responderá los mensajes de este contacto.' 
          : 'La IA ya no responderá los mensajes de este contacto.',
      });
      // Invalidar queries para sincronizar en background
      mutate('/contactos');
      mutate(`/contactos/${contacto.id}`);
    } catch {
      // Rollback on error
      setIsBotActivo(!checked);
      toast.error('Error al cambiar el estado del bot');

    } finally {
      setIsLoading(false);
    }
  };

  const confirmOverride = async () => {
    setShowOverrideModal(false);
    setIsBotActivo(true);
    setIsLoading(true);

    try {
      await api.post(`/contactos/${contacto.id}/bot-override`, { channel });
      toast.success('Bot reactivado y límite reiniciado');
      mutate('/contactos');
      mutate(`/contactos/${contacto.id}`);
    } catch {
      setIsBotActivo(false);
      toast.error('Error al reactivar el bot');

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
