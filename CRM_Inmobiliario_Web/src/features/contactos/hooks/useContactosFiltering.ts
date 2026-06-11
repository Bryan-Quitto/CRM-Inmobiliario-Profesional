import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';

export type SortOptionContacto = 'fechaCreacion' | 'nombre' | 'intereses' | 'propiedades' | 'interacciones';
export type SortDirectionContacto = 'asc' | 'desc';
export type ContactosAdvancedFiltersState = Record<string, string | boolean | number>;
export const defaultContactosAdvancedFilters: ContactosAdvancedFiltersState = {};

export const useContactosFiltering = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Internal state for immediate input feedback
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(searchInput, 500);

  // Sync debounced search to URL
  useEffect(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const currentQuery = next.get('search') || '';
      const newQuery = debouncedSearch || '';
      
      if (currentQuery !== newQuery) {
        if (newQuery) {
          next.set('search', newQuery);
        } else {
          next.delete('search');
        }
        // Reset page on search change
        next.delete('page');
        return next;
      }
      return prev;
    }, { replace: true });
  }, [debouncedSearch, setSearchParams]);

  // URL state accessors
  const currentPage = Number(searchParams.get('page')) || 1;
  const filterEstadoCliente = searchParams.get('estado') || 'Todos';

  const setCurrentPage = (page: number | ((prev: number) => number)) => {
    const newPage = typeof page === 'function' ? page(currentPage) : page;
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (newPage <= 1) next.delete('page');
      else next.set('page', newPage.toString());
      return next;
    }, { replace: true });
  };

  const setFilterEstadoCliente = (estado: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (estado === 'Todos') next.delete('estado');
      else next.set('estado', estado);
      next.delete('page'); // Reset to page 1
      return next;
    }, { replace: true });
  };

  const filterVisibilidad = searchParams.get('visibilidad') || 'Todos';
  const filterOrigen = searchParams.get('origen') || 'Todos';
  const filterEstadoPropietario = searchParams.get('estadoPropietario') || 'Todos';
  const sortBy = (searchParams.get('sortBy') as SortOptionContacto) || 'fechaCreacion';
  const sortDirection = (searchParams.get('sortDirection') as SortDirectionContacto) || 'desc';
  const advancedFilters: ContactosAdvancedFiltersState = {};

  const setParamAndResetPage = (key: string, value: string, defaultValue: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value === defaultValue) next.delete(key);
      else next.set(key, value);
      next.delete('page');
      return next;
    }, { replace: true });
  };

  const setFilterVisibilidad = (val: string) => setParamAndResetPage('visibilidad', val, 'Todos');
  const setFilterOrigen = (val: string) => setParamAndResetPage('origen', val, 'Todos');
  const setFilterEstadoPropietario = (val: string) => setParamAndResetPage('estadoPropietario', val, 'Todos');
  
  const setSortBy = (val: SortOptionContacto) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (val === 'fechaCreacion') next.delete('sortBy');
      else next.set('sortBy', val);
      return next;
    }, { replace: true });
  };

  const setSortDirection = (val: SortDirectionContacto) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (val === 'desc') next.delete('sortDirection');
      else next.set('sortDirection', val);
      return next;
    }, { replace: true });
  };

  const setAdvancedFilters = () => {};

  return {
    searchQuery: searchInput,
    setSearchQuery: setSearchInput,
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
    currentPage,
    setCurrentPage,
  };
};
