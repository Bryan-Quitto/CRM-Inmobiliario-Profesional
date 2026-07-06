import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '../../../../hooks/useDebounce';

export type SortOption = 'fechaIngreso' | 'precio' | 'areaTotal' | 'habitaciones' | 'aniosAntiguedad';
export type SortDirection = 'asc' | 'desc';

export type AdvancedFiltersState = Record<string, string | boolean | number>;

export const defaultAdvancedFilters: AdvancedFiltersState = {
  operacion: 'Todas'
};

export const usePropiedadesFiltering = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;

  const [searchQuery, setSearchQuery] = useState(searchParams.get('searchQuery') || '');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const currentQuery = next.get('searchQuery') || '';
      const newQuery = debouncedSearchQuery || '';
      
      if (currentQuery !== newQuery) {
        if (newQuery) {
          next.set('searchQuery', newQuery);
        } else {
          next.delete('searchQuery');
        }
        next.delete('page');
        return next;
      }
      return prev;
    }, { replace: true });
  }, [debouncedSearchQuery, setSearchParams]);

  const filterEstado = searchParams.get('estadoComercial') || 'Todos';
  const filterTipo = searchParams.get('tipoPropiedad') || 'Todos';
  const isArchived = searchParams.get('isArchived') === 'true';
  const sortBy = (searchParams.get('sortBy') as SortOption) || 'fechaIngreso';
  const sortDirection = (searchParams.get('sortDirection') as SortDirection) || 'desc';

  const knownKeys = ['page', 'searchQuery', 'isArchived', 'sortBy', 'sortDirection'];
  
  const advancedFilters: AdvancedFiltersState = { ...defaultAdvancedFilters };
  searchParams.forEach((val, key) => {
    if (!knownKeys.includes(key)) {
      if (val === 'true') advancedFilters[key] = true;
      else if (val === 'false') advancedFilters[key] = false;
      else if (!isNaN(Number(val)) && val.trim() !== '') advancedFilters[key] = Number(val);
      else advancedFilters[key] = val;
    }
  });

  const setFilterEstado = (val: string | ((prev: string) => string)) => {
    setSearchParams(prevParams => {
      const currentVal = prevParams.get('estadoComercial') || 'Todos';
      const newVal = typeof val === 'function' ? val(currentVal) : val;
      const next = new URLSearchParams(prevParams);
      if (newVal === 'Todos' || !newVal) next.delete('estadoComercial');
      else next.set('estadoComercial', newVal);
      next.delete('page');
      return next;
    }, { replace: true });
  };

  const setFilterTipo = (val: string | ((prev: string) => string)) => {
    setSearchParams(prevParams => {
      const currentVal = prevParams.get('tipoPropiedad') || 'Todos';
      const newVal = typeof val === 'function' ? val(currentVal) : val;
      const next = new URLSearchParams(prevParams);
      if (newVal === 'Todos' || !newVal) next.delete('tipoPropiedad');
      else next.set('tipoPropiedad', newVal);
      next.delete('page');
      return next;
    }, { replace: true });
  };

  const setIsArchived = (val: boolean | ((prev: boolean) => boolean)) => {
    setSearchParams(prevParams => {
      const currentVal = prevParams.get('isArchived') === 'true';
      const newVal = typeof val === 'function' ? val(currentVal) : val;
      const next = new URLSearchParams(prevParams);
      if (newVal) next.set('isArchived', 'true');
      else next.delete('isArchived');
      next.delete('page');
      return next;
    }, { replace: true });
  };

  const setSortBy = (val: SortOption | ((prev: SortOption) => SortOption)) => {
    setSearchParams(prevParams => {
      const currentVal = (prevParams.get('sortBy') as SortOption) || 'fechaIngreso';
      const newVal = typeof val === 'function' ? val(currentVal) : val;
      const next = new URLSearchParams(prevParams);
      if (!newVal) next.delete('sortBy');
      else next.set('sortBy', newVal);
      next.delete('page');
      return next;
    }, { replace: true });
  };

  const setSortDirection = (val: SortDirection | ((prev: SortDirection) => SortDirection)) => {
    setSearchParams(prevParams => {
      const currentVal = (prevParams.get('sortDirection') as SortDirection) || 'desc';
      const newVal = typeof val === 'function' ? val(currentVal) : val;
      const next = new URLSearchParams(prevParams);
      if (!newVal) next.delete('sortDirection');
      else next.set('sortDirection', newVal);
      next.delete('page');
      return next;
    }, { replace: true });
  };

  const setAdvancedFilters = (val: AdvancedFiltersState | ((prev: AdvancedFiltersState) => AdvancedFiltersState)) => {
    setSearchParams(prevParams => {
      const currentAdvanced: AdvancedFiltersState = { ...defaultAdvancedFilters };
      prevParams.forEach((paramVal, key) => {
        if (!knownKeys.includes(key)) {
          if (paramVal === 'true') currentAdvanced[key] = true;
          else if (paramVal === 'false') currentAdvanced[key] = false;
          else if (!isNaN(Number(paramVal)) && paramVal.trim() !== '') currentAdvanced[key] = Number(paramVal);
          else currentAdvanced[key] = paramVal;
        }
      });

      const newFilters = typeof val === 'function' ? val(currentAdvanced) : val;
      const next = new URLSearchParams(prevParams);
      
      prevParams.forEach((_, key) => {
         if (!knownKeys.includes(key)) {
           next.delete(key);
         }
      });
      
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'Todas' && value !== 'Todos') {
          next.set(key, value.toString());
        } else {
          next.delete(key);
        }
      });
      next.delete('page');
      return next;
    }, { replace: true });
  };

  const setCurrentPage = (page: number | ((prev: number) => number)) => {
    setSearchParams(prevParams => {
      const currentVal = Number(prevParams.get('page')) || 1;
      const newPage = typeof page === 'function' ? page(currentVal) : page;
      const next = new URLSearchParams(prevParams);
      if (newPage <= 1) next.delete('page');
      else next.set('page', newPage.toString());
      return next;
    }, { replace: true });
  };

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (debouncedSearchQuery) params.set('searchQuery', debouncedSearchQuery);
    if (filterEstado !== 'Todos') params.set('estadoComercial', filterEstado);
    if (filterTipo !== 'Todos') params.set('tipoPropiedad', filterTipo);
    if (isArchived) params.set('isArchived', 'true');
    if (sortBy) params.set('sortBy', sortBy);
    if (sortDirection) params.set('sortDirection', sortDirection);
    
    params.set('pageNumber', currentPage.toString());
    params.set('pageSize', '20');

    Object.entries(advancedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'Todas' && value !== 'Todos') {
        params.set(key, value.toString());
      }
    });

    return params;
  };

  return {
    searchQuery,
    setSearchQuery,
    filterEstado,
    setFilterEstado,
    filterTipo,
    setFilterTipo,
    isArchived,
    setIsArchived,
    advancedFilters,
    setAdvancedFilters,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    currentPage,
    setCurrentPage,
    queryParams: buildQueryParams()
  };
};

