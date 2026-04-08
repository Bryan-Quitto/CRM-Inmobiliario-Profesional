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

    // Actualización optimista
    const optimisticData = tareas.map(t => t.id === id ? { ...t, estado: nuevoEstado } : t);
    mutate(optimisticData, false);
  };

  const urgentesCount = useMemo(() => {
    const ahora = new Date();
    return tareas.filter(t => 
      t.estado === 'Pendiente' && 
      new Date(t.fechaInicio) <= ahora
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
