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
  
  // Intercepción global (SSoT) para proteger las transiciones desde Dropdowns
  const [propietarioReactivationModal, setPropietarioReactivationModal] = useState<{ isOpen: boolean; estado: string } | null>(null);
  const [propietarioDeactivationModal, setPropietarioDeactivationModal] = useState<{ isOpen: boolean; estado: string } | null>(null);

  const { cambiarEstado } = useContactoCommercialLogic();

  const handleStageChange = async (nuevoEstado: string, tipo: 'cliente' | 'propietario' | string = 'cliente') => {
    console.log("=== [DEBUG STAGE DROPDOWN] ===");
    console.log("1. Contacto ID:", id, "| ¿Existe contacto?:", !!contacto);
    
    if (!id || !contacto) return;
    
    // Normalizamos 'tipo' por si está llegando como 'Propietario' (mayúscula)
    const tipoNormalizado = tipo.toLowerCase() as 'cliente' | 'propietario';
    
    const etapaActual = tipoNormalizado === 'propietario' ? contacto.estadoPropietario : contacto.estadoEmbudo;
    
    console.log("2. Tipo original:", tipo, "| Tipo normalizado:", tipoNormalizado);
    console.log("3. Etapa Actual:", etapaActual, "| Nuevo Estado:", nuevoEstado);

    if (etapaActual === nuevoEstado) {
      console.log("4. Operación cancelada: El estado es el mismo.");
      return;
    }
    
    setActiveDropdown(null);

    // --- PROTECCIÓN SSoT: Intercepción para Propietarios ---
    if (tipoNormalizado === 'propietario') {
      const actualStr = etapaActual?.toLowerCase() || '';
      const nuevoStr = nuevoEstado.toLowerCase();

      console.log("5. Evaluando lógica de Propietario SSoT -> actualStr:", actualStr, "| nuevoStr:", nuevoStr);

      if (actualStr === 'inactivo' && nuevoStr === 'activo') {
        console.log("6. ⚡ INTERCEPCIÓN SSoT: Inactivo -> Activo. Abriendo modal Reactivación...");
        setPropietarioReactivationModal({ isOpen: true, estado: nuevoEstado });
        return; 
      }
      if (actualStr !== 'inactivo' && nuevoStr === 'inactivo') {
        console.log("6. ⚡ INTERCEPCIÓN SSoT: Hacia Inactivo. Abriendo modal Desactivación...");
        setPropietarioDeactivationModal({ isOpen: true, estado: nuevoEstado });
        return; 
      }
    }

    // Lógica normal de cliente (omitida por brevedad visual, pero déjala igual)
    if (tipoNormalizado === 'cliente') {
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

    console.log("7. ⚠️ NO HUBO INTERCEPCIÓN SSoT. Llamando a executeStageChange directo...");
    await executeStageChange(nuevoEstado, tipoNormalizado);
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

  const confirmPropietarioReactivation = async () => {
    if (propietarioReactivationModal) {
      await executeStageChange(propietarioReactivationModal.estado, 'propietario');
      setPropietarioReactivationModal(null);
    }
  };

  const confirmPropietarioDeactivation = async () => {
    if (propietarioDeactivationModal) {
      await executeStageChange(propietarioDeactivationModal.estado, 'propietario');
      setPropietarioDeactivationModal(null);
    }
  };

  return {
    isUpdatingEstado,
    activeDropdown,
    setActiveDropdown,
    newCycleConfirmation,
    setNewCycleConfirmation,
    propietarioReactivationModal,
    propietarioDeactivationModal,
    setPropietarioReactivationModal,
    setPropietarioDeactivationModal,
    confirmPropietarioReactivation,
    confirmPropietarioDeactivation,
    handleStageChange,
    executeStageChange
  };
};