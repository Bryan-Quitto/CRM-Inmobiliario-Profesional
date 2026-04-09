import React, { useMemo } from 'react';
import useSWR, { SWRConfig } from 'swr';
import { getTareas } from '../api/getTareas';
import { getClientes } from '../../clientes/api/getClientes';
import { getPropiedades } from '../../propiedades/api/getPropiedades';
import type { Tarea } from '../types';
import type { Cliente } from '../../clientes/types';
import type { Propiedad } from '../../propiedades/types';
import { TareasContext } from './TareasContext';
import { localStorageProvider, swrDefaultConfig } from '@/lib/swr';

export const TareasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: tareas = [], isValidating: loading, mutate } = useSWR<Tarea[]>(
    '/tareas',
    getTareas,
    swrDefaultConfig
  );

  const { data: clientes = [], isValidating: loadingClientes } = useSWR<Cliente[]>(
    '/clientes',
    getClientes,
    swrDefaultConfig
  );

  const { data: propiedades = [], isValidating: loadingPropiedades } = useSWR<Propiedad[]>(
    '/propiedades',
    getPropiedades,
    swrDefaultConfig
  );

  const refreshTareas = async () => {
    await mutate();
  };

  const updateTareaEstado = async (id: string, nuevoEstado: 'Pendiente' | 'Completada' | 'Cancelada') => {
    const tarea = tareas.find(t => t.id === id);
    if (!tarea || tarea.estado === nuevoEstado) return;

    // Mutate con revalidate: true y optimisticData de SWR
    // Esto es más robusto que el setTimeout manual
    const optimisticData = tareas.map(t => t.id === id ? { ...t, estado: nuevoEstado } : t);
    
    // Si tuviéramos la promesa aquí sería ideal, pero como está en el componente, 
    // mantenemos la mutación local pero con revalidate: false
    mutate(optimisticData, false);
  };

  /**
   * ACTUALIZACIÓN ROBUSTA (Sin Flicker)
   * Usamos mutate() con una función que maneja la promesa.
   * Esto bloquea la revalidación automática hasta que termine la petición.
   */
  const updateTarea = async (id: string, updatedFields: Partial<Tarea>, savePromise: Promise<unknown>) => {
    const optimisticData = tareas.map(t => t.id === id ? { ...t, ...updatedFields } : t);
    
    try {
      await mutate(
        savePromise.then(async () => {
          // Después de la promesa, esperamos un pequeño "grace period" de 1s para que la DB indexe
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Forzamos un fetch real para sincronizar IDs y metadatos del servidor
          return getTareas(); 
        }), 
        {
          optimisticData,
          rollbackOnError: true,
          revalidate: true,
          populateCache: false // Queremos que use el resultado del fetch real
        }
      );
    } catch (e) {
      console.error('Error en updateTarea optimista:', e);
    }
  };

  const addTarea = async (nuevaTarea: Tarea, savePromise: Promise<unknown>) => {
    const optimisticData = [nuevaTarea, ...tareas];
    
    try {
      await mutate(
        savePromise.then(async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return getTareas();
        }), 
        {
          optimisticData,
          rollbackOnError: true,
          revalidate: true,
          populateCache: false
        }
      );
    } catch (e) {
      console.error('Error en addTarea optimista:', e);
    }
  };

  const urgentesCount = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999); // Fin del día de hoy

    return tareas.filter(t =>
      t.estado === 'Pendiente' &&
      new Date(t.fechaInicio) <= hoy
    ).length;
  }, [tareas]);
  const value = {
    tareas,
    loading,
    clientes,
    loadingClientes,
    propiedades,
    loadingPropiedades,
    refreshTareas,
    updateTareaEstado,
    updateTarea,
    addTarea,
    urgentesCount
  };

  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      <TareasContext.Provider value={value}>
        {children}
      </TareasContext.Provider>
    </SWRConfig>
  );
};
