import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import type { Propiedad } from '../../types';

export const usePropiedadesFiltering = (propiedades: Propiedad[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState('Todos');

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
    let result = propiedades;
    if (searchQuery.trim()) {
      result = fuse.search(searchQuery).map(r => r.item);
    }
    return result.filter(p => {
      const matchesEstado = filterEstado === 'Todos' || p.estadoComercial === filterEstado;
      return matchesEstado;
    });
  }, [propiedades, searchQuery, filterEstado, fuse]);

  return {
    searchQuery,
    setSearchQuery,
    filterEstado,
    setFilterEstado,
    filteredPropiedades
  };
};
