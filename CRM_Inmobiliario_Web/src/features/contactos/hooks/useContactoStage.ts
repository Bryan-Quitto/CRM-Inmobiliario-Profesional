import { useState } from 'react';
import type { KeyedMutator, ScopedMutator } from 'swr';
import { useContactoCommercialLogic } from './useContactoCommercialLogic';
import type { Contacto } from '../types';

interface Params {
  contacto: Contacto | undefined;
  id: string | undefined;
  mutate: KeyedMutator<Contacto>;
  globalMutate: ScopedMutator;
}

export const useContactoStage = ({ contacto, id, mutate }: Params) => {
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [intendedStage, setIntendedStage] = useState<string | null>(null);
  const [isUpdatingEtapa, setIsUpdatingEtapa] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'cliente' | 'propietario' | null>(null);
  const [revertConfirmation, setRevertConfirmation] = useState<{ etapa: string } | null>(null);

  const { cambiarEtapa, revertirEtapa } = useContactoCommercialLogic();

  const handleRevertStatus = async (nuevaEtapa: string, liberarPropiedades: boolean) => {
    if (!id || !contacto) return;
    setIsUpdatingEtapa(true);
    setRevertConfirmation(null);

    await revertirEtapa(id, nuevaEtapa, liberarPropiedades, {
      onOptimisticUpdate: () => mutate({ ...contacto, etapaEmbudo: nuevaEtapa, fechaCierre: undefined }, false),
      onSuccess: async () => { await mutate(); },
      onError: () => mutate()
    });

    setIsUpdatingEtapa(false);
  };

  const handleStageChange = async (nuevaEtapa: string, confirmedData?: { propiedadId: string, precioCierre: number, nuevoEstadoPropiedad: string }, tipo: 'cliente' | 'propietario' = 'cliente') => {
    if (!id || !contacto) return;
    
    const etapaActual = tipo === 'propietario' ? contacto.estadoPropietario : contacto.etapaEmbudo;
    if (etapaActual === nuevaEtapa) return;
    
    setActiveDropdown(null);

    if (tipo === 'cliente' && (nuevaEtapa === 'Cerrado' || nuevaEtapa === 'En Negociación') && !confirmedData) {
      setIntendedStage(nuevaEtapa);
      setIsClosingModalOpen(true);
      return;
    }

    if (tipo === 'cliente' && (contacto.etapaEmbudo === 'Cerrado' || contacto.etapaEmbudo === 'Perdido' || contacto.etapaEmbudo === 'En Negociación') && nuevaEtapa !== 'Cerrado' && nuevaEtapa !== 'Perdido' && nuevaEtapa !== 'En Negociación') {
      setRevertConfirmation({ etapa: nuevaEtapa });
      return;
    }

    setIsUpdatingEtapa(true);

    await cambiarEtapa(id, nuevaEtapa, tipo, confirmedData, {
      onOptimisticUpdate: () => mutate(tipo === 'propietario' 
        ? { ...contacto, estadoPropietario: nuevaEtapa }
        : { ...contacto, etapaEmbudo: nuevaEtapa }, 
      false),
      onSuccess: async () => { await mutate(); },
      onError: () => mutate()
    });

    setIsUpdatingEtapa(false);
  };

  const handleClosingConfirm = async (precioCierre: number | null, propiedadId: string, nuevoEstadoPropiedad: string) => {
    await handleStageChange(intendedStage || 'Cerrado', { propiedadId, precioCierre: precioCierre || 0, nuevoEstadoPropiedad });
    setIsClosingModalOpen(false);
  };

  return {
    isClosingModalOpen,
    setIsClosingModalOpen,
    intendedStage,
    isUpdatingEtapa,
    activeDropdown,
    setActiveDropdown,
    revertConfirmation,
    setRevertConfirmation,
    handleRevertStatus,
    handleStageChange,
    handleClosingConfirm
  };
};
