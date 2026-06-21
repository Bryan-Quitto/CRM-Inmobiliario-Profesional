/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { toggleContactArchive } from '../api/toggleContactArchive';
import type { Contacto } from '../types';

interface UseContactoArchiveProps {
  contacto?: Contacto;
  mutate: (data?: any, shouldRevalidate?: boolean) => Promise<any>;
  globalMutate: (key: string | ((key: any) => boolean), data?: any, shouldRevalidate?: boolean) => Promise<any>;
}

export const useContactoArchive = ({ contacto, mutate, globalMutate }: UseContactoArchiveProps) => {
  const [isTogglingArchive, setIsTogglingArchive] = useState(false);

  const handleToggleArchive = async () => {
    if (!contacto) return;
    setIsTogglingArchive(true);
    
    // Optimistic UI update
    const previousState = contacto.isArchivedForCurrentUser;
    const previousBotWA = contacto.botActivoWA;
    const previousBotFB = contacto.botActivoFB;
    const newState = !previousState;
    
    await mutate({ 
      ...contacto, 
      isArchivedForCurrentUser: newState,
      botActivoWA: !newState,
      botActivoFB: !newState
    }, false);
    
    try {
      const serverState = await toggleContactArchive(contacto.id);
      
      // Update with server source of truth
      await mutate({ 
        ...contacto, 
        isArchivedForCurrentUser: serverState,
        botActivoWA: !serverState,
        botActivoFB: !serverState
      }, false);
      
      // Update list cache
      globalMutate(
        (key: any) => {
          const keyStr = Array.isArray(key) ? key[0] : key;
          return typeof keyStr === 'string' && keyStr.includes('contactos');
        },
        undefined,
        true
      );
      
      import('sonner').then(({ toast }) => {
        toast.success(serverState ? 'Contacto archivado' : 'Contacto desarchivado');
      });
    } catch {
      // Revert on error
      await mutate({ 
        ...contacto, 
        isArchivedForCurrentUser: previousState,
        botActivoWA: previousBotWA,
        botActivoFB: previousBotFB
      }, false);
      import('sonner').then(({ toast }) => {
        toast.error('Error al cambiar el estado de archivo');
      });
    } finally {
      setIsTogglingArchive(false);
    }
  };

  return {
    isTogglingArchive,
    handleToggleArchive
  };
};
