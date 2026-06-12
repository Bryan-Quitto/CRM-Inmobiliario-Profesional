import useSWR from 'swr';
import { swrDefaultConfig } from '@/lib/swr';
import { getDropdownPropiedades, type DropdownPropiedadResponse } from '../api/getDropdownPropiedades';
import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

export const usePropiedadesDropdown = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data, error, isLoading, mutate } = useSWR<DropdownPropiedadResponse[]>(
    ['/api/propiedades/dropdown', debouncedSearch],
    () => getDropdownPropiedades(debouncedSearch),
    {
      ...swrDefaultConfig,
      keepPreviousData: true,
    }
  );

  return {
    propiedades: data || [],
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    mutate
  };
};
