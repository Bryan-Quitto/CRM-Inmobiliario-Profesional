import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { getTareas } from '../api/getTareas';
import type { Tarea } from '../types';

interface TareasContextType {
  tareas: Tarea[];
  loading: boolean;
  refreshTareas: () => Promise<void>;
  urgentesCount: number;
}

const TareasContext = createContext<TareasContextType | undefined>(undefined);

export const TareasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshTareas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTareas();
      setTareas(data);
    } catch (err) {
      console.error('Error al sincronizar tareas globalmente:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    refreshTareas();
    // Opcional: Polling cada 2 minutos para asegurar frescura de datos si hay otros agentes
    const interval = setInterval(refreshTareas, 120000);
    return () => clearInterval(interval);
  }, [refreshTareas]);

  const urgentesCount = useMemo(() => {
    const ahora = new Date();
    return tareas.filter(t => 
      t.estado === 'Pendiente' && 
      new Date(t.fechaVencimiento) <= ahora
    ).length;
  }, [tareas]);

  const value = {
    tareas,
    loading,
    refreshTareas,
    urgentesCount
  };

  return <TareasContext.Provider value={value}>{children}</TareasContext.Provider>;
};

export const useTareas = () => {
  const context = useContext(TareasContext);
  if (context === undefined) {
    throw new Error('useTareas debe usarse dentro de un TareasProvider');
  }
  return context;
};
