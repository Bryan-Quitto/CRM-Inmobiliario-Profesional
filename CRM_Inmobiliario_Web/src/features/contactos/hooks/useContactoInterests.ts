import { useState } from 'react';
import { toast } from 'sonner';
import type { KeyedMutator, ScopedMutator } from 'swr';
import { vincularPropiedad } from '../api/vincularPropiedad';
import { desvincularPropiedad } from '../api/desvincularPropiedad';
import type { Contacto } from '../types';

interface Params {
  contacto: Contacto | undefined;
  id: string | undefined;
  mutate: KeyedMutator<Contacto>;
  globalMutate: ScopedMutator;
}

export const useContactoInterests = ({ contacto, id, mutate, globalMutate }: Params) => {
  const [updatingInteresId, setUpdatingInteresId] = useState<string | null>(null);
  const [propiedadPendienteId, setPropiedadPendienteId] = useState<string | null>(null);
  const [nivelInteresPendiente, setNivelInteresPendiente] = useState('Medio');
  const [dropdownInteresOpenId, setDropdownInteresOpenId] = useState<string | null>(null);
  const [vincularStatus, setVincularStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [idInteresABorrar, setIdInteresABorrar] = useState<string | null>(null);
  const [isDeletingInteres, setIsDeletingInteres] = useState(false);

  const handleVincularPropiedad = async () => {
    if (!id || !propiedadPendienteId) return;
    
    const targetPropId = propiedadPendienteId;
    setUpdatingInteresId(targetPropId);
    setVincularStatus('saving');
    
    try {
      await vincularPropiedad(id, targetPropId, nivelInteresPendiente);
      setVincularStatus('success');
      
      setTimeout(async () => {
        toast.success('Propiedad vinculada correctamente');
        setPropiedadPendienteId(null);
        setNivelInteresPendiente('Medio');
        setVincularStatus('idle');
        await mutate();
        globalMutate('/dashboard/kpis');
        globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
      }, 800);

    } catch (err) {
      console.error('Error al vincular propiedad:', err);
      toast.error('No se pudo vincular la propiedad');
      setVincularStatus('idle');
    } finally {
      setUpdatingInteresId(null);
    }
  };

  const handleUpdateNivelInteres = async (propiedadId: string, nuevoNivel: string) => {
    if (!id || !contacto) return;
    
    const prevIntereses = contacto.intereses || [];
    const optimisticData = {
      ...contacto,
      intereses: prevIntereses.map(i => i.propiedadId === propiedadId ? { ...i, nivelInteres: nuevoNivel } : i)
    };
    
    mutate(optimisticData, false);

    try {
      await vincularPropiedad(id, propiedadId, nuevoNivel);
      toast.success('Interés actualizado instantáneamente');
      await mutate();
      globalMutate('/dashboard/kpis');
      globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
    } catch (err) {
      console.error('Error al actualizar interés:', err);
      toast.error('Hubo un error de sincronización, deshaciendo...');
      mutate();
    }
  };

  const handleDesvincular = async (propiedadId: string) => {
    if (!id || !contacto) return;
    setIsDeletingInteres(true);
    
    const prevIntereses = contacto.intereses || [];
    const optimisticData = {
      ...contacto,
      intereses: prevIntereses.filter(i => i.propiedadId !== propiedadId)
    };

    mutate(optimisticData, false);

    try {
      await desvincularPropiedad(id, propiedadId);
      toast.success('Propiedad desvinculada exitosamente');
      setIdInteresABorrar(null);
      await mutate();
      globalMutate('/dashboard/kpis');
      globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
    } catch (err) {
      console.error('Error al desvincular:', err);
      toast.error('Error en el servidor al desvincular');
      mutate();
    } finally {
      setIsDeletingInteres(false);
    }
  };

  return {
    updatingInteresId,
    propiedadPendienteId,
    setPropiedadPendienteId,
    nivelInteresPendiente,
    setNivelInteresPendiente,
    dropdownInteresOpenId,
    setDropdownInteresOpenId,
    vincularStatus,
    idInteresABorrar,
    setIdInteresABorrar,
    isDeletingInteres,
    handleVincularPropiedad,
    handleUpdateNivelInteres,
    handleDesvincular
  };
};
