import React, { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { usePendingOperationsStore } from '../../store/usePendingOperationsStore';
import { UnsavedChangesModal } from '../ui/UnsavedChangesModal';

export const GlobalNavigationGuard: React.FC = () => {
  const pendingCount = usePendingOperationsStore((state) => state.pendingCount);

  // 1. Barrera Externa: Prevenir cierre de pestaña o recarga (F5)
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

  // 2. Barrera Interna: Interceptar navegación con React Router v7
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      pendingCount > 0 && currentLocation.pathname !== nextLocation.pathname
  );

  return (
    <UnsavedChangesModal
      isOpen={blocker.state === 'blocked'}
      onClose={() => blocker.state === 'blocked' && blocker.reset()}
      onConfirm={() => blocker.state === 'blocked' && blocker.proceed()}
      isLogout={false}
    />
  );
};
