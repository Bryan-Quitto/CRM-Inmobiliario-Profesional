import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import type { Propiedad } from '../../types';
import { AVAILABLE_PROPERTY_FILTERS } from '../../types/filters.types';

export type SortOption = 'fechaIngreso' | 'precio' | 'areaTotal' | 'habitaciones' | 'aniosAntiguedad';
export type SortDirection = 'asc' | 'desc';

export type AdvancedFiltersState = Record<string, string | boolean | number>;

export const defaultAdvancedFilters: AdvancedFiltersState = {
  operacion: 'Todas'
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
      
      let matchAdvanced = true;

      for (const filterDef of AVAILABLE_PROPERTY_FILTERS) {
        const { key, type } = filterDef;
        const propValue = p[key as keyof Propiedad];

        if (type === 'range') {
          const minVal = advancedFilters[`${key}Min`];
          const maxVal = advancedFilters[`${key}Max`];
          
          if (minVal && Number(propValue || 0) < Number(minVal)) {
            matchAdvanced = false;
            break;
          }
          if (maxVal && Number(propValue || 0) > Number(maxVal)) {
            matchAdvanced = false;
            break;
          }
        } else if (type === 'select') {
          const val = advancedFilters[key];
          if (val && val !== 'Todas' && val !== 'Todos' && propValue !== val) {
            matchAdvanced = false;
            break;
          }
        } else if (type === 'text') {
          const val = advancedFilters[key];
          if (val && typeof propValue === 'string' && typeof val === 'string') {
            if (!propValue.toLowerCase().includes(val.toLowerCase())) {
              matchAdvanced = false;
              break;
            }
          }
        } else if (type === 'boolean') {
          const val = advancedFilters[key];
          // Boolean filters from UI might be actual booleans or empty strings if unchecked/reset
          if (val !== undefined && val !== null && val !== '') {
            const isChecked = val === true || val === 'true';
            if (Boolean(propValue) !== isChecked) {
              matchAdvanced = false;
              break;
            }
          }
        }
      }

      return matchEstado && matchTipo && matchAdvanced;
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
