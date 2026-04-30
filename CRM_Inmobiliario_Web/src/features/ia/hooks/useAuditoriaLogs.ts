import { useState, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { getClienteById } from '../../clientes/api/getClienteById';
import { eliminarCliente } from '../../clientes/api/eliminarCliente';
import type { Cliente } from '../../clientes/types';
import type { ClientGroup } from '../types/auditoria';

export const useAuditoriaLogs = () => {
  const { mutate: globalMutate } = useSWRConfig();
  const { data: clientGroups, error, isLoading, mutate } = useSWR<ClientGroup[]>('/ia/logs', {
    revalidateOnFocus: true,
    dedupingInterval: 0
  });
  
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  // Estados para Edición y Borrado de Cliente
  const [clienteEnEdicion, setClienteEnEdicion] = useState<Cliente | null>(null);
  const [idABorrar, setIdABorrar] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleEditClick = async (clienteId: string) => {
    try {
      const fullCliente = await getClienteById(clienteId);
      setClienteEnEdicion(fullCliente);
    } catch {
      toast.error('No se pudo cargar la información del cliente para editar.');
    }
  };

  const handleConfirmDelete = async (clienteId: string) => {
    setIsDeleting(true);
    try {
      await eliminarCliente(clienteId);
      toast.success('Prospecto eliminado exitosamente');
      setIdABorrar(null);
      await mutate();
      globalMutate('/clientes');
      globalMutate('/dashboard/kpis');
    } catch {
      toast.error('No se pudo eliminar el prospecto');
    } finally {
      setIsDeleting(false);
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
    // Modales
    clienteEnEdicion,
    setClienteEnEdicion,
    idABorrar,
    setIdABorrar,
    isDeleting,
    handleEditClick,
    handleConfirmDelete,
    mutate,
    globalMutate
  };
};
