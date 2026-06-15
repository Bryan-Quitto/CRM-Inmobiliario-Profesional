import { useState, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { getContactoById } from '../../contactos/api/getContactoById';
import type { ClientGroup } from '../types/auditoria';

export const useAuditoriaLogs = (canal: string = 'WhatsApp') => {
  const { mutate: globalMutate } = useSWRConfig();
  const { data: clientGroups, error, isLoading, mutate } = useSWR<ClientGroup[]>(`/ia/logs?canal=${canal}`, {
    revalidateOnFocus: true,
    dedupingInterval: 0
  });
  
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  // Estados para Edición y Borrado de Contacto
  const [isEditingId, setIsEditingId] = useState<string | null>(null);

  const filteredGroups = useMemo(() => {
    if (!clientGroups) return [];
    
    return clientGroups.filter(group => {
      const nombre = group?.nombre || '';
      const telefono = group?.telefono || '';
      const searchStr = search || '';
      
      return nombre.toLowerCase().includes(searchStr.toLowerCase()) || 
             telefono.includes(searchStr);
    });
  }, [clientGroups, search]);

  const handleRetry = () => mutate(undefined, { revalidate: true });

  const handleEditClick = async (contactoId: string) => {
    try {
      setIsEditingId(contactoId);
      const fullContacto = await getContactoById(contactoId);
      window.dispatchEvent(new CustomEvent('open-crear-contacto-modal', { detail: { action: 'edit', contacto: fullContacto } }));
    } catch {
      toast.error('No se pudo cargar la información del contacto para editar.');
    } finally {
      setIsEditingId(null);
    }
  };

  const toggleClientExpansion = (telefono: string) => {
    setExpandedClientId(prev => prev === telefono ? null : telefono);
  };

  return {
    clientGroups: filteredGroups,
    isLoading,
    error,
    search,
    setSearch,
    expandedClientId,
    toggleClientExpansion,
    handleRetry,
    handleEditClick,
    isEditingId,
    mutate,
    globalMutate
  };
};
