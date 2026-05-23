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
  const [revertConfirmation, setRevertConfirmation] = useState<{ etapa: string, etapaOrigen: string } | null>(null);

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

    if (tipo === 'cliente' && !confirmedData) {
      if (nuevaEtapa === 'Cerrado' || nuevaEtapa === 'En Negociación') {
        setIntendedStage(nuevaEtapa);
        setIsClosingModalOpen(true);
        return;
      }

      const esReversion = 
        (contacto.etapaEmbudo === 'Cerrado' || contacto.etapaEmbudo === 'En Negociación') && 
        (nuevaEtapa === 'Nuevo' || nuevaEtapa === 'Contactado' || nuevaEtapa === 'Perdido' || nuevaEtapa === 'Cerrado Perdido');

      if (esReversion) {
        const reservas = contacto.numeroReservas || 0;
        const cierres = contacto.numeroCierres || 0;

        if (contacto.etapaEmbudo === 'En Negociación') {
          if (reservas > 1) {
            import('sonner').then(({ toast }) => {
              toast.error('No se puede cambiar el estado porque el cliente tiene más de 1 propiedad reservada. Realice el ajuste (Trato Caído) desde el catálogo de inmuebles para cada propiedad.');
            });
            return;
          }
          if (reservas === 0) {
            await handleRevertStatus(nuevaEtapa, false);
            return;
          }
        }

        if (contacto.etapaEmbudo === 'Cerrado') {
          if (cierres > 1) {
            import('sonner').then(({ toast }) => {
              toast.error('No se puede revertir el estado automáticamente porque el contacto tiene más de 1 propiedad alquilada o vendida. Realice el ajuste desde el catálogo de inmuebles para cada propiedad.');
            });
            return;
          }
          if (cierres === 0) {
            await handleRevertStatus(nuevaEtapa, false);
            return;
          }
        }

        setRevertConfirmation({ etapa: nuevaEtapa, etapaOrigen: contacto.etapaEmbudo });
        return;
      }
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
