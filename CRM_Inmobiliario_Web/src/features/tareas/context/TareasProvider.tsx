import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { getTareas } from '../api/getTareas';
import type { Tarea } from '../types';
import { TareasContext } from './TareasContext';
import type { TareasContextType } from './TareasContext';

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
    } catch {
      setTareas(prev => prev.map(t => t.id === id ? { ...t, estado: estadoAnterior } : t));
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

  const value: TareasContextType = {
    tareas,
    loading,
    refreshTareas,
    updateTareaEstado,
    urgentesCount
  };

  return <TareasContext.Provider value={value}>{children}</TareasContext.Provider>;
};
