import React, { useEffect } from 'react';
import { usePendingOperationsStore } from '../../store/usePendingOperationsStore';

export const GlobalNavigationGuard: React.FC = () => {
  const pendingCount = usePendingOperationsStore((state) => state.pendingCount);

  // 1. Barrera Externa: Prevenir cierre de pestaña o recarga (F5)
  // Las navegaciones internas (SPA) están permitidas ya que las promesas siguen vivas en background
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingCount > 0) {
        e.preventDefault();
        e.returnValue = ''; // Necesario para navegadores legacy y Chrome
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pendingCount]);

  return null;
};
