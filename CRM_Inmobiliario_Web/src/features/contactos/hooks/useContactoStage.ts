import { useState } from 'react';
import { toast } from 'sonner';
import type { KeyedMutator, ScopedMutator } from 'swr';
import { actualizarEtapaContacto } from '../api/actualizarEtapaContacto';
import { revertirEstadoContacto } from '../api/revertirEstadoContacto';
import type { Contacto } from '../types';

interface Params {
  contacto: Contacto | undefined;
  id: string | undefined;
  mutate: KeyedMutator<Contacto>;
  globalMutate: ScopedMutator;
}

export const useContactoStage = ({ contacto, id, mutate, globalMutate }: Params) => {
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isUpdatingEtapa, setIsUpdatingEtapa] = useState(false);
  const [showEtapaDropdown, setShowEtapaDropdown] = useState(false);
  const [revertConfirmation, setRevertConfirmation] = useState<{ etapa: string } | null>(null);

  const handleRevertStatus = async (nuevaEtapa: string, liberarPropiedades: boolean) => {
    if (!id || !contacto) return;
    setIsUpdatingEtapa(true);
    setRevertConfirmation(null);

    // Optimistic Update
    mutate({ ...contacto, etapaEmbudo: nuevaEtapa, fechaCierre: undefined }, false);

    try {
      await revertirEstadoContacto(id, nuevaEtapa, liberarPropiedades);
      toast.success(`Estado revertido a ${nuevaEtapa}`);
      await mutate();
      
      globalMutate('/dashboard/kpis');
      globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
      globalMutate('/propiedades');
      globalMutate('/contactos');
    } catch (err) {
      console.error('Error al revertir estado:', err);
      toast.error('No se pudo revertir el estado');
      mutate();
    } finally {
      setIsUpdatingEtapa(false);
    }
  };

  const handleStageChange = async (nuevaEtapa: string, confirmedData?: { propiedadId: string, precioCierre: number, nuevoEstadoPropiedad: string }) => {
    if (!id || !contacto || contacto.etapaEmbudo === nuevaEtapa) return;
    setShowEtapaDropdown(false);

    if (nuevaEtapa === 'Cerrado' && !confirmedData) {
      setIsClosingModalOpen(true);
      return;
    }

    if ((contacto.etapaEmbudo === 'Cerrado' || contacto.etapaEmbudo === 'Perdido') && nuevaEtapa !== 'Cerrado' && nuevaEtapa !== 'Perdido') {
      setRevertConfirmation({ etapa: nuevaEtapa });
      return;
    }

    setIsUpdatingEtapa(true);
    mutate({ ...contacto, etapaEmbudo: nuevaEtapa }, false);

    try {
      await actualizarEtapaContacto(id, nuevaEtapa, confirmedData?.propiedadId, confirmedData?.precioCierre, confirmedData?.nuevoEstadoPropiedad);
      toast.success(`Contacto movido a ${nuevaEtapa}`);
      await mutate();

      globalMutate('/dashboard/kpis');
      globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
      globalMutate('/propiedades');
      globalMutate('/contactos');
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
