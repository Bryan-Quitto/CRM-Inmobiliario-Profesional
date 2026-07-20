import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import type { Contacto } from '../types';

export const useContactoConsent = (contacto: Contacto, channel: 'WhatsApp' | 'Facebook') => {
  const [isLoading, setIsLoading] = useState(false);
  const { mutate } = useSWRConfig();

  const handleUpdateConsent = async (consentimiento: string | null) => {
    setIsLoading(true);
    try {
      const payload = {
        consentimientoWA: channel === 'WhatsApp' ? consentimiento : contacto.consentimientoIA_WA,
        consentimientoFB: channel === 'Facebook' ? consentimiento : contacto.consentimientoIA_FB
      };
      
      await api.put(`/contactos/${contacto.id}/consentimiento`, payload);
      
      // Invalidar cache
      mutate((key: unknown) => {
        const keyStr = Array.isArray(key) ? key[0] : key;
        return typeof keyStr === 'string' && keyStr.includes('contactos');
      }, undefined, { revalidate: true });
      
      toast.success('Consentimiento actualizado exitosamente');
    } catch (error) {
      console.error('Error updating consent', error);
      toast.error('Error al actualizar el consentimiento');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleUpdateConsent
  };
};
