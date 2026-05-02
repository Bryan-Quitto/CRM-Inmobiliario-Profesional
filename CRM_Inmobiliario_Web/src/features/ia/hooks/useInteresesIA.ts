import { useState } from 'react';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { vincularPropiedad } from '../../contactos/api/vincularPropiedad';
import { desvincularPropiedad } from '../../contactos/api/desvincularPropiedad';
import type { ClientGroup } from '../types/auditoria';

export const useInteresesIA = (mutate: () => Promise<ClientGroup[] | undefined>) => {
  const { mutate: globalMutate } = useSWRConfig();
  
  const [updatingInteresId, setUpdatingInteresId] = useState<string | null>(null);
  const [interesABorrarId, setInteresABorrarId] = useState<string | null>(null);
  const [isDeletingInteres, setIsDeletingInteres] = useState(false);
  const [dropdownInteresOpenId, setDropdownInteresOpenId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const [expandedInteresId, setExpandedInteresId] = useState<string | null>(null);

  const handleUpdateNivelInteres = async (contactoId: string, propiedadId: string, nuevoNivel: string) => {
    setUpdatingInteresId(propiedadId);
    try {
      await vincularPropiedad(contactoId, propiedadId, nuevoNivel);
      toast.success('Interés actualizado correctamente');
      await mutate();
      globalMutate('/dashboard/kpis');
    } catch (err) {
      console.error('Error al actualizar interés:', err);
      toast.error('No se pudo actualizar el nivel de interés');
    } finally {
      setUpdatingInteresId(null);
      setDropdownInteresOpenId(null);
      setDropdownPosition(null);
    }
  };

  const handleConfirmDeleteInteres = async (contactoId: string, propiedadId: string) => {
    setIsDeletingInteres(true);
    try {
      await desvincularPropiedad(contactoId, propiedadId);
      toast.success('Interés eliminado correctamente');
      setInteresABorrarId(null);
      await mutate();
      globalMutate('/dashboard/kpis');
    } catch (err) {
      console.error('Error al eliminar interés:', err);
      toast.error('No se pudo eliminar el interés');
    } finally {
      setIsDeletingInteres(false);
    }
  };

  return {
    updatingInteresId,
    interesABorrarId,
    setInteresABorrarId,
    isDeletingInteres,
    dropdownInteresOpenId,
    setDropdownInteresOpenId,
    dropdownPosition,
    setDropdownPosition,
    expandedInteresId,
    setExpandedInteresId,
    handleUpdateNivelInteres,
    handleConfirmDeleteInteres
  };
};
