import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { getTareas } from '../api/getTareas';
import type { Tarea } from '../types';

interface TareasContextType {
  tareas: Tarea[];
  loading: boolean;
  refreshTareas: () => Promise<void>;
  updateTareaEstado: (id: string, nuevoEstado: 'Pendiente' | 'Completada' | 'Cancelada') => Promise<void>;
  urgentesCount: number;
}

const TareasContext = createContext<TareasContextType | undefined>(undefined);

const TAREAS_CACHE_KEY = 'crm_tareas_cache';

export const TareasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Carga inicial desde Cache
  const [tareas, setTareas] = useState<Tarea[]>(() => {
    const saved = localStorage.getItem(TAREAS_CACHE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  
  // Si tenemos cache, empezamos sin loading para una UX instantánea
  const [loading, setLoading] = useState(tareas.length === 0);

  const refreshTareas = useCallback(async () => {
    try {
      if (tareas.length === 0) setLoading(true);
      const data = await getTareas();
      
      // 2. Actualizar estado y persistir
      setTareas(data);
      localStorage.setItem(TAREAS_CACHE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Error al sincronizar tareas globalmente:', err);
    } finally {
      setLoading(false);
    }
  }, [tareas.length]);

  const updateTareaEstado = useCallback(async (id: string, nuevoEstado: 'Pendiente' | 'Completada' | 'Cancelada') => {
    const tarea = tareas.find(t => t.id === id);
    if (!tarea || tarea.estado === nuevoEstado) return;

    const estadoAnterior = tarea.estado;

    // 1. Actualización Optimista
    setTareas(prev => prev.map(t => t.id === id ? { ...t, estado: nuevoEstado } : t));

    try {
      // Nota: Esta función asume que el que la llama maneja la llamada al API específica
      // O podríamos inyectar la llamada al API aquí. Por ahora, el contexto solo maneja el estado.
    } catch (err) {
      setTareas(prev => prev.map(t => t.id === id ? { ...t, estado: estadoAnterior } : t));
      throw err;
    }
  }, [tareas]);

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
    updateTareaEstado,
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
