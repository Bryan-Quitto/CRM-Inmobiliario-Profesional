import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Fuse from 'fuse.js';
import type { Contacto } from '../types';
import { AVAILABLE_CONTACT_FILTERS } from '../types/filters.types';

export type SortOptionContacto = 'fechaCreacion' | 'nombre' | 'intereses' | 'propiedades' | 'interacciones';
export type SortDirectionContacto = 'asc' | 'desc';

export type ContactosAdvancedFiltersState = Record<string, string | boolean | number>;

export const defaultContactosAdvancedFilters: ContactosAdvancedFiltersState = {};

export const useContactosFiltering = (contactos: Contacto[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Top bar filters
  const [filterVisibilidad, setFilterVisibilidad] = useState('Todos');
  const [filterOrigen, setFilterOrigen] = useState('Todos');
  const [filterEstadoCliente, setFilterEstadoCliente] = useState('Todos');
  const [filterEstadoPropietario, setFilterEstadoPropietario] = useState('Todos');
  
  const [advancedFilters, setAdvancedFilters] = useState<ContactosAdvancedFiltersState>(defaultContactosAdvancedFilters);
  const [sortBy, setSortBy] = useState<SortOptionContacto>('fechaCreacion');
  const [sortDirection, setSortDirection] = useState<SortDirectionContacto>('desc');

  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;
  const setCurrentPage = (page: number | ((prev: number) => number)) => {
    const newPage = typeof page === 'function' ? page(currentPage) : page;
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (newPage <= 1) next.delete('page');
      else next.set('page', newPage.toString());
      return next;
    }, { replace: true });
  };
  
  const itemsPerPage = 50;

  const fuse = useMemo(() => {
    return new Fuse(contactos, {
      keys: [
        { name: 'nombre', weight: 0.4 },
        { name: 'apellido', weight: 0.3 },
        { name: 'email', weight: 0.2 },
        { name: 'telefono', weight: 0.1 }
      ],
      threshold: 0.3,
      distance: 100
    });
  }, [contactos]);

  const filteredContactos = useMemo(() => {
    const applyFilters = (c: Contacto) => {
      const matchVisibilidad = filterVisibilidad === 'Todos' 
        || (filterVisibilidad === 'Propios' && !c.esCompartido)
        || (filterVisibilidad === 'Compartidos' && c.esCompartido);
      const matchOrigen = filterOrigen === 'Todos' || c.origen === filterOrigen;
      const matchEstadoCliente = filterEstadoCliente === 'Todos' || c.etapaEmbudo === filterEstadoCliente;
      const matchEstadoPropietario = filterEstadoPropietario === 'Todos' || c.estadoPropietario === filterEstadoPropietario;
      
      let matchAdvanced = true;

      for (const filterDef of AVAILABLE_CONTACT_FILTERS) {
        const { key, type } = filterDef;
        const contactValue = c[key as keyof Contacto];

        if (type === 'range') {
          const minVal = advancedFilters[`${key}Min`];
          const maxVal = advancedFilters[`${key}Max`];
          
          if (minVal && Number(contactValue || 0) < Number(minVal)) {
            matchAdvanced = false;
            break;
          }
          if (maxVal && Number(contactValue || 0) > Number(maxVal)) {
            matchAdvanced = false;
            break;
          }
        } else if (type === 'date') {
          const minDate = advancedFilters[`${key}Min`] as string;
          const maxDate = advancedFilters[`${key}Max`] as string;
          
          if (minDate && contactValue) {
            if (new Date(contactValue as string) < new Date(minDate)) {
              matchAdvanced = false;
              break;
            }
          }
          if (maxDate && contactValue) {
            // maxDate should be end of day ideally, but direct compare works for YYYY-MM-DD limits if times are considered.
            const nextDay = new Date(maxDate);
            nextDay.setDate(nextDay.getDate() + 1);
            if (new Date(contactValue as string) >= nextDay) {
              matchAdvanced = false;
              break;
            }
          }
        } else if (type === 'select') {
          const val = advancedFilters[key];
          if (val && val !== 'Todas' && val !== 'Todos' && contactValue !== val) {
            matchAdvanced = false;
            break;
          }
        } else if (type === 'text') {
          const val = advancedFilters[key];
          if (val && typeof contactValue === 'string' && typeof val === 'string') {
            const searchTerms = val.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
            if (searchTerms.length > 0) {
              const contactValLower = contactValue.toLowerCase();
              const matchesAny = searchTerms.some(term => contactValLower.includes(term));
              if (!matchesAny) {
                matchAdvanced = false;
                break;
              }
            }
          }
        } else if (type === 'boolean') {
          const val = advancedFilters[key];
          if (val !== undefined && val !== null && val !== '') {
            const isChecked = val === true || val === 'true';
            if (Boolean(contactValue) !== isChecked) {
              matchAdvanced = false;
              break;
            }
          }
        }
      }

      return matchVisibilidad && matchOrigen && matchEstadoCliente && matchEstadoPropietario && matchAdvanced;
    };

    let result = contactos.filter(applyFilters);

    // 2. Búsqueda por texto (Fuse)
    if (searchQuery.trim()) {
      result = fuse.search(searchQuery).map(r => r.item).filter(applyFilters);
    }

    // 3. Aplicar ordenamiento
    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'nombre':
          comparison = a.nombre.localeCompare(b.nombre);
          break;
        case 'intereses':
          comparison = (a.numeroIntereses || 0) - (b.numeroIntereses || 0);
          break;
        case 'propiedades':
          comparison = (a.numeroPropiedadesCaptadas || 0) - (b.numeroPropiedadesCaptadas || 0);
          break;
        case 'interacciones':
          comparison = (a.numeroInteracciones || 0) - (b.numeroInteracciones || 0);
          break;
        case 'fechaCreacion':
        default:
          comparison = new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [contactos, searchQuery, filterVisibilidad, filterOrigen, filterEstadoCliente, filterEstadoPropietario, advancedFilters, fuse, sortBy, sortDirection]);

  // Reset pagination to page 1 whenever any filter or sorting changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filterVisibilidad, filterOrigen, filterEstadoCliente, filterEstadoPropietario, advancedFilters, sortBy, sortDirection]);

  const totalPages = Math.ceil(filteredContactos.length / itemsPerPage);
  
  const paginatedContactos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredContactos.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredContactos, currentPage, itemsPerPage]);

  return {
    searchQuery,
    setSearchQuery,
    filterVisibilidad,
    setFilterVisibilidad,
    filterOrigen,
    setFilterOrigen,
    filterEstadoCliente,
    setFilterEstadoCliente,
    filterEstadoPropietario,
    setFilterEstadoPropietario,
    advancedFilters,
    setAdvancedFilters,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    filteredContactos,
    paginatedContactos,
    currentPage,
    setCurrentPage,
    totalPages
  };
};
