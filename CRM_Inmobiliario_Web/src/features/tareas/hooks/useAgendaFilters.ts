import { useMemo } from 'react';
import type { Tarea } from '../types';

export const useAgendaFilters = (
  allTareas: Tarea[], 
  historySearch: string,
  searchQuery: string = '',
  filterTipos: string[] = [],
  sortBy: 'fechaInicio' | 'fechaCreacion' = 'fechaInicio',
  sortOrder: 'asc' | 'desc' = 'asc',
  historySortOrder: 'asc' | 'desc' = 'desc'
) => {
  const tareasPendientes = useMemo(() => {
    let pendientes = allTareas.filter(t => t.estado === 'Pendiente');

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      pendientes = pendientes.filter(t => 
        t.titulo.toLowerCase().includes(q) || 
        t.contactoNombre?.toLowerCase().includes(q) ||
        t.propiedadTitulo?.toLowerCase().includes(q)
      );
    }

    if (filterTipos.length > 0) {
      pendientes = pendientes.filter(t => filterTipos.includes(t.tipoTarea));
    }

    pendientes.sort((a, b) => {
      // Usamos fechaInicio como fallback si fechaCreacion no está definida en tareas antiguas
      const dateA = new Date(a[sortBy] || a.fechaInicio).getTime();
      const dateB = new Date(b[sortBy] || b.fechaInicio).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return pendientes;
  }, [allTareas, searchQuery, filterTipos, sortBy, sortOrder]);
  
  const filteredHistorial = useMemo(() => {
    const history = allTareas.filter(t => {
      const isHistory = t.estado === 'Completada' || t.estado === 'Cancelada';
      const matchesSearch = t.titulo.toLowerCase().includes(historySearch.toLowerCase());
      return isHistory && matchesSearch;
    });

    history.sort((a, b) => {
      const dateA = new Date(a.fechaInicio).getTime();
      const dateB = new Date(b.fechaInicio).getTime();
      return historySortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return history;
  }, [allTareas, historySearch, historySortOrder]);

  const tareasAtrasadas = useMemo(() => {
    const ahora = new Date();
    return tareasPendientes.filter(t => {
      const finTarea = new Date(t.fechaInicio);
      finTarea.setMinutes(finTarea.getMinutes() + (t.duracionMinutos || 0));
      return finTarea < ahora;
    });
  }, [tareasPendientes]);

  const tareasHoy = useMemo(() => {
    const ahora = new Date();
    const hoy = new Date();
    const finHoy = new Date(hoy.setHours(23, 59, 59, 999));
    
    return tareasPendientes.filter(t => {
      const fecha = new Date(t.fechaInicio);
      const finTarea = new Date(fecha.getTime());
      finTarea.setMinutes(finTarea.getMinutes() + (t.duracionMinutos || 0));
      
      const isOverdue = finTarea < ahora;
      const isFuture = fecha > finHoy;
      
      return !isOverdue && !isFuture;
    });
  }, [tareasPendientes]);

  const tareasFuturas = useMemo(() => {
    const hoy = new Date();
    const finHoy = new Date(hoy.setHours(23, 59, 59, 999));
    return tareasPendientes.filter(t => new Date(t.fechaInicio) > finHoy);
  }, [tareasPendientes]);

  return {
    tareasPendientes,
    filteredHistorial,
    tareasAtrasadas,
    tareasHoy,
    tareasFuturas
  };
};
