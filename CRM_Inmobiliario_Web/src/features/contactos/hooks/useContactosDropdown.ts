import useSWR from 'swr';
import { swrDefaultConfig } from '@/lib/swr';
import { getDropdownContactos, type DropdownContactoResponse } from '../api/getDropdownContactos';
import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

export const useContactosDropdown = (contexto: 'Transaccion' | 'General' = 'General') => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data, error, isLoading, mutate } = useSWR<DropdownContactoResponse[]>(
    ['/api/contactos/dropdown', debouncedSearch, contexto],
    () => getDropdownContactos(debouncedSearch, contexto),
    {
      ...swrDefaultConfig,
      keepPreviousData: true,
    }
  );

  return {
    contactos: data || [],
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    mutate
  };
};
