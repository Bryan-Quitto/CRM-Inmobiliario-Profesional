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
  const [isUpdatingEstado, setIsUpdatingEstado] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'cliente' | 'propietario' | null>(null);
  const [newCycleConfirmation, setNewCycleConfirmation] = useState<{ estado: string } | null>(null);

  const { cambiarEstado } = useContactoCommercialLogic();

  const handleStageChange = async (nuevoEstado: string, tipo: 'cliente' | 'propietario' = 'cliente') => {
    if (!id || !contacto) return;
    
    const etapaActual = tipo === 'propietario' ? contacto.estadoPropietario : contacto.estadoEmbudo;
    if (etapaActual === nuevoEstado) return;
    
    setActiveDropdown(null);

    if (tipo === 'cliente') {
      if (contacto.estadoEmbudo === 'En Negociación') {
        import('sonner').then(({ toast }) => {
          toast.error('El cliente está en medio de una negociación. Cualquier cambio debe realizarse desde el catálogo de propiedades.');
        });
        return;
      }

      if (contacto.estadoEmbudo === 'Cerrado' || contacto.estadoEmbudo === 'Cerrado Ganado') {
        if (nuevoEstado === 'Perdido') {
          import('sonner').then(({ toast }) => {
            toast.error('Para dar por terminado un contrato, debe hacerlo desde la propiedad asociada. No puede marcar al cliente como perdido desde aquí.');
          });
          return;
        }

        if (nuevoEstado === 'Nuevo' || nuevoEstado === 'Contactado' || nuevoEstado === 'Visita') {
          setNewCycleConfirmation({ estado: nuevoEstado });
          return;
        }
      }
    }

    await executeStageChange(nuevoEstado, tipo);
  };

  const executeStageChange = async (nuevoEstado: string, tipo: 'cliente' | 'propietario' = 'cliente') => {
    if (!id || !contacto) return;
    
    setIsUpdatingEstado(true);

    await cambiarEstado(id, nuevoEstado, tipo, undefined, {
      onOptimisticUpdate: () => mutate(tipo === 'propietario' 
        ? { ...contacto, estadoPropietario: nuevoEstado }
        : { ...contacto, estadoEmbudo: nuevoEstado }, 
      false),
      onSuccess: async () => { await mutate(); },
      onError: () => mutate()
    });

    setIsUpdatingEstado(false);
    setNewCycleConfirmation(null);
  };

  return {
    isUpdatingEstado,
    activeDropdown,
    setActiveDropdown,
    newCycleConfirmation,
    setNewCycleConfirmation,
    handleStageChange,
    executeStageChange
  };
};
