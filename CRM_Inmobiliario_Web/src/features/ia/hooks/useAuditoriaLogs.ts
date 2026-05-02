import { useState, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { getContactoById } from '../../contactos/api/getContactoById';
import { eliminarContacto } from '../../contactos/api/eliminarContacto';
import type { Contacto } from '../../contactos/types';
import type { ClientGroup } from '../types/auditoria';

export const useAuditoriaLogs = () => {
  const { mutate: globalMutate } = useSWRConfig();
  const { data: clientGroups, error, isLoading, mutate } = useSWR<ClientGroup[]>('/ia/logs', {
    revalidateOnFocus: true,
    dedupingInterval: 0
  });
  
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  // Estados para Edición y Borrado de Contacto
  const [contactoEnEdicion, setContactoEnEdicion] = useState<Contacto | null>(null);
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

  const handleEditClick = async (contactoId: string) => {
    try {
      const fullContacto = await getContactoById(contactoId);
      setContactoEnEdicion(fullContacto);
    } catch {
      toast.error('No se pudo cargar la información del contacto para editar.');
    }
  };

  const handleConfirmDelete = async (contactoId: string) => {
    setIsDeleting(true);
    try {
      await eliminarContacto(contactoId);
      toast.success('Contacto eliminado exitosamente');
      setIdABorrar(null);
      await mutate();
      globalMutate('/contactos');
      globalMutate('/dashboard/kpis');
    } catch {
      toast.error('No se pudo eliminar el contacto');
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
    contactoEnEdicion,
    setContactoEnEdicion,
    idABorrar,
    setIdABorrar,
    isDeleting,
    handleEditClick,
    handleConfirmDelete,
    mutate,
    globalMutate
  };
};
