/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { togglePropertyArchive } from '../api/togglePropertyArchive';
import type { Propiedad } from '../types';

interface UsePropiedadArchiveProps {
  propiedad?: Propiedad;
  mutate: (data?: any, shouldRevalidate?: boolean) => Promise<any>;
  globalMutate: (key: string | ((key: any) => boolean), data?: any, shouldRevalidate?: boolean) => Promise<any>;
}

export const usePropiedadArchive = ({ propiedad, mutate, globalMutate }: UsePropiedadArchiveProps) => {
  const [isTogglingArchive, setIsTogglingArchive] = useState(false);

  const handleToggleArchive = async () => {
    if (!propiedad) return;
    setIsTogglingArchive(true);
    
    // Optimistic UI update
    const previousState = propiedad.isArchivedForCurrentUser;
    const newState = !previousState;
    
    await mutate({ ...propiedad, isArchivedForCurrentUser: newState }, false);
    
    try {
      const serverState = await togglePropertyArchive(propiedad.id);
      
      // Update with server source of truth
      await mutate({ ...propiedad, isArchivedForCurrentUser: serverState }, false);
      
      // Update list cache
      globalMutate(
        (key: any) => {
          const keyStr = Array.isArray(key) ? key[0] : key;
          return typeof keyStr === 'string' && keyStr.includes('propiedades');
        },
        undefined,
        true
      );
      
      import('sonner').then(({ toast }) => {
        toast.success(serverState ? 'Inmueble archivado' : 'Inmueble desarchivado');
      });
    } catch {
      // Revert on error
      await mutate({ ...propiedad, isArchivedForCurrentUser: previousState }, false);
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
