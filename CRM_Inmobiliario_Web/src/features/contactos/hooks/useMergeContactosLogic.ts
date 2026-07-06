import { useState } from 'react';
import { toast } from 'sonner';
import useSWR, { mutate as globalMutate } from 'swr';
import { api } from '@/lib/axios';
import { useDebounce } from '@/hooks/useDebounce';
import type { Contacto } from '../types';
import type { GetContactosResponse } from '../api/getContactos';

interface UseMergeContactosLogicProps {
  contactoOriginal: Contacto;
  onSuccess: (nuevoPrincipalId: string) => void;
  onClose: () => void;
}

export const useMergeContactosLogic = ({
  contactoOriginal,
  onSuccess,
  onClose,
}: UseMergeContactosLogicProps) => {
  const [localPrincipal, setLocalPrincipal] = useState<Contacto>(contactoOriginal);
  const [localSecundario, setLocalSecundario] = useState<Contacto | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const { data, isLoading } = useSWR<GetContactosResponse>(
    debouncedSearch.length >= 2 ? ['/contactos', debouncedSearch] : null,
    async () => {
      const { data: res } = await api.get<GetContactosResponse>('/contactos', {
        params: { search: debouncedSearch, pageSize: 10 }
      });
      return res;
    }
  );

  const [isMerging, setIsMerging] = useState(false);

  const handleSwap = () => {
    if (!localSecundario) return;
    setLocalPrincipal(localSecundario);
    setLocalSecundario(localPrincipal);
  };

  const handleMerge = async () => {
    if (!localSecundario) return;
    setIsMerging(true);
    try {
      await api.post('/contactos/fusionar', {
        primaryContactoId: localPrincipal.id,
        secondaryContactoId: localSecundario.id
      });
      
      // Invalidate contacts list and tasks (agenda) to respect Zero-Wait policy
      globalMutate(key => Array.isArray(key) && key[0] === '/contactos', undefined, { revalidate: true });
      globalMutate('/tareas');
      globalMutate('/dashboard/kpis');
      
      toast.success('Contactos fusionados exitosamente');
      onSuccess(localPrincipal.id);
    } catch (error) {

      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Error al fusionar contactos');
    } finally {
      setIsMerging(false);
    }
  };

  const hasTelefono = Boolean(localPrincipal.telefono);
  const hasFb = Boolean(localPrincipal.facebookSenderId);

  const searchResults = (data?.items || []).filter(c => {
    if (c.id === localPrincipal.id) return false;
    if (hasTelefono && c.telefono) return false;
    if (hasFb && c.facebookSenderId) return false;
    return true;
  });

  return {
    localPrincipal,
    localSecundario,
    setLocalSecundario,
    searchTerm,
    setSearchTerm,
    isLoading,
    isMerging,
    handleSwap,
    handleMerge,
    searchResults,
    onClose
  };
};

export type UseMergeContactosLogicReturn = ReturnType<typeof useMergeContactosLogic>;
