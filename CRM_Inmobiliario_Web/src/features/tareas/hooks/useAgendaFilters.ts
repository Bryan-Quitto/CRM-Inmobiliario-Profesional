import { useMemo } from 'react';
import type { Tarea } from '../types';

export const useAgendaFilters = (allTareas: Tarea[], historySearch: string) => {
  const tareasPendientes = useMemo(() => 
    allTareas.filter(t => t.estado === 'Pendiente'), 
  [allTareas]);
  
  const filteredHistorial = useMemo(() => 
    allTareas.filter(t => {
      const isHistory = t.estado === 'Completada' || t.estado === 'Cancelada';
      const matchesSearch = t.titulo.toLowerCase().includes(historySearch.toLowerCase());
      return isHistory && matchesSearch;
    }), 
  [allTareas, historySearch]);

  const tareasAtrasadas = useMemo(() => {
    const ahora = new Date();
    ahora.setHours(0, 0, 0, 0);
    return tareasPendientes.filter(t => new Date(t.fechaInicio) < ahora);
  }, [tareasPendientes]);

  const tareasHoy = useMemo(() => {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.setHours(0, 0, 0, 0));
    const finHoy = new Date(hoy.setHours(23, 59, 59, 999));
    
    return tareasPendientes.filter(t => {
      const fecha = new Date(t.fechaInicio);
      return fecha >= inicioHoy && fecha <= finHoy;
    });
  }, [tareasPendientes]);

  const tareasFuturas = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    return tareasPendientes.filter(t => new Date(t.fechaInicio) > hoy);
  }, [tareasPendientes]);

  return {
    tareasPendientes,
    filteredHistorial,
    tareasAtrasadas,
    tareasHoy,
    tareasFuturas
  };
};
