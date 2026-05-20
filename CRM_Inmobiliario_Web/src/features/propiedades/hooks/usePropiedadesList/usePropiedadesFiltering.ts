import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import type { Propiedad } from '../../types';

export type SortOption = 'fechaIngreso' | 'precio' | 'areaTotal' | 'habitaciones' | 'aniosAntiguedad';
export type SortDirection = 'asc' | 'desc';

export interface AdvancedFiltersState {
  operacion: string;
  precioMin: string;
  precioMax: string;
  areaMin: string;
  areaMax: string;
  habitacionesMin: string;
  banosMin: string;
  estacionamientosMin: string;
}

export const defaultAdvancedFilters: AdvancedFiltersState = {
  operacion: 'Todas',
  precioMin: '',
  precioMax: '',
  areaMin: '',
  areaMax: '',
  habitacionesMin: '',
  banosMin: '',
  estacionamientosMin: ''
};

export const usePropiedadesFiltering = (propiedades: Propiedad[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState('Todos');
  const [filterTipo, setFilterTipo] = useState('Todos');
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>(defaultAdvancedFilters);
  const [sortBy, setSortBy] = useState<SortOption>('fechaIngreso');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fuse = useMemo(() => {
    return new Fuse(propiedades, {
      keys: [
        { name: 'titulo', weight: 0.6 },
        { name: 'sector', weight: 0.2 },
        { name: 'ciudad', weight: 0.2 }
      ],
      threshold: 0.3,
      distance: 100
    });
  }, [propiedades]);

  const filteredPropiedades = useMemo(() => {
    // 1. Lógica de Filtrado Central (Estado, Tipo y Filtros Avanzados)
    const applyFilters = (p: Propiedad) => {
      const matchEstado = filterEstado === 'Todos' || p.estadoComercial === filterEstado;
      const matchTipo = filterTipo === 'Todos' || p.tipoPropiedad === filterTipo;
      
      const matchOperacion = advancedFilters.operacion === 'Todas' || p.operacion === advancedFilters.operacion;
      const matchPrecioMin = !advancedFilters.precioMin || p.precio >= Number(advancedFilters.precioMin);
      const matchPrecioMax = !advancedFilters.precioMax || p.precio <= Number(advancedFilters.precioMax);
      const matchAreaMin = !advancedFilters.areaMin || (p.areaTotal || 0) >= Number(advancedFilters.areaMin);
      const matchAreaMax = !advancedFilters.areaMax || (p.areaTotal || 0) <= Number(advancedFilters.areaMax);
      const matchHabitaciones = !advancedFilters.habitacionesMin || (p.habitaciones || 0) >= Number(advancedFilters.habitacionesMin);
      const matchBanos = !advancedFilters.banosMin || (p.banos || 0) >= Number(advancedFilters.banosMin);
      const matchEstacionamientos = !advancedFilters.estacionamientosMin || (p.estacionamientos || 0) >= Number(advancedFilters.estacionamientosMin);

      return matchEstado && matchTipo && matchOperacion && matchPrecioMin && matchPrecioMax && 
             matchAreaMin && matchAreaMax && matchHabitaciones && matchBanos && matchEstacionamientos;
    };

    let result = propiedades.filter(applyFilters);

    // 2. Búsqueda por texto (Fuse)
    if (searchQuery.trim()) {
      result = fuse.search(searchQuery).map(r => r.item).filter(applyFilters);
    }

    // 3. Aplicar ordenamiento
    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'precio':
          comparison = (a.precio || 0) - (b.precio || 0);
          break;
        case 'areaTotal':
          comparison = (a.areaTotal || 0) - (b.areaTotal || 0);
          break;
        case 'habitaciones': {
          const aHab = a.habitaciones || 0;
          const bHab = b.habitaciones || 0;
          if (aHab === 0 && bHab > 0) return 1;
          if (bHab === 0 && aHab > 0) return -1;
          if (aHab === 0 && bHab === 0) return 0;
          comparison = aHab - bHab;
          break;
        }
        case 'aniosAntiguedad': {
          const aAnt = a.aniosAntiguedad;
          const bAnt = b.aniosAntiguedad;
          const aHasAnt = aAnt !== null && aAnt !== undefined;
          const bHasAnt = bAnt !== null && bAnt !== undefined;
          
          if (!aHasAnt && bHasAnt) return 1;
          if (!bHasAnt && aHasAnt) return -1;
          if (!aHasAnt && !bHasAnt) return 0;
          
          comparison = (aAnt as number) - (bAnt as number);
          break;
        }
        case 'fechaIngreso':
        default:
          comparison = new Date(a.fechaIngreso).getTime() - new Date(b.fechaIngreso).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [propiedades, searchQuery, filterEstado, filterTipo, advancedFilters, fuse, sortBy, sortDirection]);

  return {
    searchQuery,
    setSearchQuery,
    filterEstado,
    setFilterEstado,
    filterTipo,
    setFilterTipo,
    advancedFilters,
    setAdvancedFilters,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    filteredPropiedades
  };
};
