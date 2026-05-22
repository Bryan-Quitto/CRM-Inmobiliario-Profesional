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
  const [intendedStage, setIntendedStage] = useState<string | null>(null);
  const [isUpdatingEtapa, setIsUpdatingEtapa] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'cliente' | 'propietario' | null>(null);
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
    mutate(tipo === 'propietario' 
      ? { ...contacto, estadoPropietario: nuevaEtapa }
      : { ...contacto, etapaEmbudo: nuevaEtapa }, 
    false);

    try {
      await actualizarEtapaContacto(id, nuevaEtapa, confirmedData?.propiedadId, confirmedData?.precioCierre, confirmedData?.nuevoEstadoPropiedad, tipo === 'propietario' ? 'propietario' : 'contacto');
      toast.success(`${tipo === 'propietario' ? 'Propietario' : 'Cliente'} movido a ${nuevaEtapa}`);
      await mutate();

      globalMutate('/dashboard/kpis');
      globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
      globalMutate('/propiedades');
      globalMutate('/contactos');
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Error al actualizar etapa:', err);
      const errorMessage = err.response?.data?.Message || err.response?.data?.message || err.message || 'No se pudo actualizar la etapa';
      toast.error(errorMessage);
      mutate(); 
    } finally {
      setIsUpdatingEtapa(false);
    }
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
