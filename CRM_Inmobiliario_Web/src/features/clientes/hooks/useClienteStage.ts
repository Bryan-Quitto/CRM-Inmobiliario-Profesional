import { useState } from 'react';
import { toast } from 'sonner';
import type { KeyedMutator, ScopedMutator } from 'swr';
import { actualizarEtapaCliente } from '../api/actualizarEtapaCliente';
import { revertirEstadoCliente } from '../api/revertirEstadoCliente';
import type { Cliente } from '../types';

interface Params {
  cliente: Cliente | undefined;
  id: string | undefined;
  mutate: KeyedMutator<Cliente>;
  globalMutate: ScopedMutator;
}

export const useClienteStage = ({ cliente, id, mutate, globalMutate }: Params) => {
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isUpdatingEtapa, setIsUpdatingEtapa] = useState(false);
  const [showEtapaDropdown, setShowEtapaDropdown] = useState(false);
  const [revertConfirmation, setRevertConfirmation] = useState<{ etapa: string } | null>(null);

  const handleRevertStatus = async (nuevaEtapa: string, liberarPropiedades: boolean) => {
    if (!id || !cliente) return;
    setIsUpdatingEtapa(true);
    setRevertConfirmation(null);

    // Optimistic Update
    mutate({ ...cliente, etapaEmbudo: nuevaEtapa, fechaCierre: undefined }, false);

    try {
      await revertirEstadoCliente(id, nuevaEtapa, liberarPropiedades);
      toast.success(`Estado revertido a ${nuevaEtapa}`);
      await mutate();
      
      globalMutate('/dashboard/kpis');
      globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
      globalMutate('/propiedades');
      globalMutate('/clientes');
    } catch (err) {
      console.error('Error al revertir estado:', err);
      toast.error('No se pudo revertir el estado');
      mutate();
    } finally {
      setIsUpdatingEtapa(false);
    }
  };

  const handleStageChange = async (nuevaEtapa: string, confirmedData?: { propiedadId: string, precioCierre: number, nuevoEstadoPropiedad: string }) => {
    if (!id || !cliente || cliente.etapaEmbudo === nuevaEtapa) return;
    setShowEtapaDropdown(false);

    if (nuevaEtapa === 'Cerrado' && !confirmedData) {
      setIsClosingModalOpen(true);
      return;
    }

    if ((cliente.etapaEmbudo === 'Cerrado' || cliente.etapaEmbudo === 'Perdido') && nuevaEtapa !== 'Cerrado' && nuevaEtapa !== 'Perdido') {
      setRevertConfirmation({ etapa: nuevaEtapa });
      return;
    }

    setIsUpdatingEtapa(true);
    mutate({ ...cliente, etapaEmbudo: nuevaEtapa }, false);

    try {
      await actualizarEtapaCliente(id, nuevaEtapa, confirmedData?.propiedadId, confirmedData?.precioCierre, confirmedData?.nuevoEstadoPropiedad);
      toast.success(`Prospecto movido a ${nuevaEtapa}`);
      await mutate();

      globalMutate('/dashboard/kpis');
      globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
      globalMutate('/propiedades');
      globalMutate('/clientes');
    } catch (err) {
      console.error('Error al actualizar etapa:', err);
      toast.error('No se pudo actualizar la etapa');
      mutate(); 
    } finally {
      setIsUpdatingEtapa(false);
    }
  };

  const handleClosingConfirm = async (precioCierre: number, propiedadId: string, nuevoEstadoPropiedad: string) => {
    await handleStageChange('Cerrado', { propiedadId, precioCierre, nuevoEstadoPropiedad });
    setIsClosingModalOpen(false);
  };

  return {
    isClosingModalOpen,
    setIsClosingModalOpen,
    isUpdatingEtapa,
    showEtapaDropdown,
    setShowEtapaDropdown,
    revertConfirmation,
    setRevertConfirmation,
    handleRevertStatus,
    handleStageChange,
    handleClosingConfirm
  };
};
