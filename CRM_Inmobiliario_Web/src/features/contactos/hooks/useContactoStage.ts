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
  const [isUpdatingEtapa, setIsUpdatingEtapa] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'cliente' | 'propietario' | null>(null);
  const [newCycleConfirmation, setNewCycleConfirmation] = useState<{ etapa: string } | null>(null);

  const { cambiarEtapa } = useContactoCommercialLogic();

  const handleStageChange = async (nuevaEtapa: string, tipo: 'cliente' | 'propietario' = 'cliente') => {
    if (!id || !contacto) return;
    
    const etapaActual = tipo === 'propietario' ? contacto.estadoPropietario : contacto.etapaEmbudo;
    if (etapaActual === nuevaEtapa) return;
    
    setActiveDropdown(null);

    if (tipo === 'cliente') {
      if (contacto.etapaEmbudo === 'En Negociación') {
        import('sonner').then(({ toast }) => {
          toast.error('El cliente está en medio de una negociación. Cualquier cambio debe realizarse desde el catálogo de propiedades.');
        });
        return;
      }

      if (contacto.etapaEmbudo === 'Cerrado' || contacto.etapaEmbudo === 'Cerrado Ganado') {
        if (nuevaEtapa === 'Perdido') {
          import('sonner').then(({ toast }) => {
            toast.error('Para dar por terminado un contrato, debe hacerlo desde la propiedad asociada. No puede marcar al cliente como perdido desde aquí.');
          });
          return;
        }

        if (nuevaEtapa === 'Nuevo' || nuevaEtapa === 'Contactado' || nuevaEtapa === 'Cita') {
          setNewCycleConfirmation({ etapa: nuevaEtapa });
          return;
        }
      }
    }

    await executeStageChange(nuevaEtapa, tipo);
  };

  const executeStageChange = async (nuevaEtapa: string, tipo: 'cliente' | 'propietario' = 'cliente') => {
    if (!id || !contacto) return;
    
    setIsUpdatingEtapa(true);

    await cambiarEtapa(id, nuevaEtapa, tipo, undefined, {
      onOptimisticUpdate: () => mutate(tipo === 'propietario' 
        ? { ...contacto, estadoPropietario: nuevaEtapa }
        : { ...contacto, etapaEmbudo: nuevaEtapa }, 
      false),
      onSuccess: async () => { await mutate(); },
      onError: () => mutate()
    });

    setIsUpdatingEtapa(false);
    setNewCycleConfirmation(null);
  };

  return {
    isUpdatingEtapa,
    activeDropdown,
    setActiveDropdown,
    newCycleConfirmation,
    setNewCycleConfirmation,
    handleStageChange,
    executeStageChange
  };
};
