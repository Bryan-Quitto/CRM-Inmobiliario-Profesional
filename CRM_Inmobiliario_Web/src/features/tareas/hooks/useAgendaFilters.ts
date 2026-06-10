import { useMemo } from 'react';
import type { Tarea } from '../types';

export const useAgendaFilters = (
  allTareas: Tarea[], 
  historySearch: string,
  searchQuery: string = '',
  filterTipos: string[] = [],
  sortBy: 'fechaInicio' | 'fechaCreacion' = 'fechaInicio',
  sortOrder: 'asc' | 'desc' = 'asc'
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
