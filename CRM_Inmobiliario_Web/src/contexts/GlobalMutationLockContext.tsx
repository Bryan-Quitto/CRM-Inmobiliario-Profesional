/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePendingOperationsStore } from '@/store/usePendingOperationsStore';

interface GlobalMutationLockContextType {
  activeMutations: number;
  startMutation: () => void;
  endMutation: () => void;
  withOptimisticLock: <T>(promise: Promise<T>) => Promise<T>;
}

const GlobalMutationLockContext = createContext<GlobalMutationLockContextType | undefined>(undefined);

export const GlobalMutationLockProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeMutations, setActiveMutations] = useState(0);
  // Store is external to context, we just access its methods
  // We use the hook here just to make sure we're in the React tree, though not strictly necessary for Zustand
  const { addPendingOperation, removePendingOperation } = usePendingOperationsStore();

  const startMutation = useCallback(() => {
    setActiveMutations((prev) => prev + 1);
    addPendingOperation();
  }, [addPendingOperation]);

  const endMutation = useCallback(() => {
    setActiveMutations((prev) => Math.max(0, prev - 1));
    removePendingOperation();
  }, [removePendingOperation]);

  const withOptimisticLock = useCallback(async <T,>(promise: Promise<T>): Promise<T> => {
    startMutation();
    try {
      return await promise;
    } finally {
      endMutation();
    }
  }, [startMutation, endMutation]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeMutations > 0) {
        e.preventDefault();
        e.returnValue = 'Tienes cambios guardándose en segundo plano. ¿Seguro que deseas salir?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeMutations]);

  return (
    <GlobalMutationLockContext.Provider value={{ activeMutations, startMutation, endMutation, withOptimisticLock }}>
      {children}
    </GlobalMutationLockContext.Provider>
  );
};

export const useGlobalMutationLock = () => {
  const context = useContext(GlobalMutationLockContext);
  if (!context) throw new Error("useGlobalMutationLock debe usarse dentro de GlobalMutationLockProvider");
  return context;
};
