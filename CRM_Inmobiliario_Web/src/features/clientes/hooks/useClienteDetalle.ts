import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { getClienteById } from '../api/getClienteById';
import { registrarInteraccion } from '../api/registrarInteraccion';
import { getPropiedades } from '../../propiedades/api/getPropiedades';
import { vincularPropiedad } from '../api/vincularPropiedad';
import { desvincularPropiedad } from '../api/desvincularPropiedad';
import { actualizarEtapaCliente } from '../api/actualizarEtapaCliente';
import { revertirEstadoCliente } from '../api/revertirEstadoCliente';
import { actualizarInteraccion } from '../api/actualizarInteraccion';
import { eliminarInteraccion } from '../api/eliminarInteraccion';
import type { Cliente, Interaccion } from '../types';

export const useClienteDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mutate: globalMutate } = useSWRConfig();
  const { data: cliente, error, isLoading, mutate } = useSWR<Cliente>(
    id ? `/clientes/${id}` : null,
    () => getClienteById(id!)
  );

  const { data: propiedadesDisponibles } = useSWR('/propiedades', getPropiedades);
  
  const propiedadesOptions = useMemo(() => {
    if (!propiedadesDisponibles) return undefined;
    return propiedadesDisponibles.map(p => ({
      id: p.id,
      title: p.titulo,
      subtitle: `${p.ciudad} - ${p.sector}`
    }));
  }, [propiedadesDisponibles]);

  const [nuevaNota, setNuevaNota] = useState('');
  const [tipoNota, setTipoNota] = useState('Nota');
  const [notaEnEdicion, setNotaEnEdicion] = useState<string | null>(null);
  const [isSavingNota, setIsSavingNota] = useState(false);
  const [searchHistorial, setSearchHistorial] = useState('');
  const [filterTipoTimeline, setFilterTipoTimeline] = useState('Todos');
  const [idInteraccionABorrar, setIdInteraccionABorrar] = useState<string | null>(null);

  // Estados para vinculación de propiedades
  const [updatingInteresId, setUpdatingInteresId] = useState<string | null>(null);
  const [propiedadPendienteId, setPropiedadPendienteId] = useState<string | null>(null);
  const [nivelInteresPendiente, setNivelInteresPendiente] = useState('Medio');
  const [dropdownInteresOpenId, setDropdownInteresOpenId] = useState<string | null>(null);
  const [vincularStatus, setVincularStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  
  // Estados para Cierre de Negocio
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isUpdatingEtapa, setIsUpdatingEtapa] = useState(false);
  const [showEtapaDropdown, setShowEtapaDropdown] = useState(false);
  const [revertConfirmation, setRevertConfirmation] = useState<{ etapa: string } | null>(null);
  
  const [idInteresABorrar, setIdInteresABorrar] = useState<string | null>(null);
  const [isDeletingInteres, setIsDeletingInteres] = useState(false);

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

  const handleSaveNota = async () => {
    if (!nuevaNota.trim() || !id) return;
    setIsSavingNota(true);

    const isEdit = !!notaEnEdicion;
    const idNota = notaEnEdicion;
    const notaParaActualizar = nuevaNota;
    const tipoParaActualizar = tipoNota;

    const previousInteracciones = [...(cliente?.interacciones || [])];

    try {
      if (isEdit) {
        const nuevasInteracciones = previousInteracciones.map(i => i.id === idNota ? { ...i, notas: notaParaActualizar, tipoInteraccion: tipoParaActualizar } : i);
        const optimisticData = { ...cliente!, interacciones: nuevasInteracciones };
        
        mutate(optimisticData, false);
        setNotaEnEdicion(null);
        setNuevaNota('');
        setTipoNota('Nota');

        await actualizarInteraccion(idNota!, notaParaActualizar, tipoParaActualizar);
        toast.success('Nota actualizada');
      } else {
        const tipoAGuardar = tipoNota;
        const textoAGuardar = nuevaNota;

        const nuevaInteraccion: Interaccion = {
          id: `temp-${Date.now()}`,
          tipoInteraccion: tipoAGuardar,
          notas: textoAGuardar,
          fechaInteraccion: new Date().toISOString()
        };

        const optimisticData = { ...cliente!, interacciones: [nuevaInteraccion, ...previousInteracciones] };
        mutate(optimisticData, false);
        setNuevaNota('');
        setTipoNota('Nota');

        await registrarInteraccion({
          clienteId: id,
          tipoInteraccion: tipoAGuardar,
          notas: textoAGuardar
        });
        toast.success('Interacción registrada');
      }
      
      await mutate();
      globalMutate('/dashboard/kpis');
      globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));

    } catch (err) {
      console.error('Error al guardar nota:', err);
      toast.error('No se pudo guardar la nota');
      mutate();
    } finally {
      setIsSavingNota(false);
    }
  };

  const handleEditarNota = (interaccion: Interaccion) => {
    setNotaEnEdicion(interaccion.id);
    setTipoNota(interaccion.tipoInteraccion);
    setNuevaNota(interaccion.notas);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEliminarNota = async (interaccionId: string) => {
    if (!cliente) return;
    const previousInteracciones = [...(cliente.interacciones || [])];

    try {
      const optimisticData = { 
        ...cliente, 
        interacciones: previousInteracciones.filter(i => i.id !== interaccionId) 
      };
      mutate(optimisticData, false);

      await eliminarInteraccion(interaccionId);
      toast.success('Nota eliminada');
      await mutate();
      globalMutate('/dashboard/kpis');
      globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
    } catch (err) {
      console.error('Error al eliminar nota:', err);
      toast.error('No se pudo eliminar la nota');
      mutate();
    }
  };

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
    if (!id || !cliente) return;
    
    const prevIntereses = cliente.intereses || [];
    const optimisticData = {
      ...cliente,
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
    if (!id || !cliente) return;
    setIsDeletingInteres(true);
    
    const prevIntereses = cliente.intereses || [];
    const optimisticData = {
      ...cliente,
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

  const historialFiltrado = useMemo(() => {
    if (!cliente?.interacciones) return [];
    return cliente.interacciones.filter(i => {
      const matchesSearch = i.notas.toLowerCase().includes(searchHistorial.toLowerCase()) || 
                           i.tipoInteraccion.toLowerCase().includes(searchHistorial.toLowerCase());
      const matchesTipo = filterTipoTimeline === 'Todos' || i.tipoInteraccion === filterTipoTimeline;
      return matchesSearch && matchesTipo;
    });
  }, [cliente, searchHistorial, filterTipoTimeline]);

  return {
    cliente,
    isLoading,
    error,
    propiedadesOptions,
    nuevaNota,
    setNuevaNota,
    tipoNota,
    setTipoNota,
    notaEnEdicion,
    setNotaEnEdicion,
    isSavingNota,
    searchHistorial,
    setSearchHistorial,
    filterTipoTimeline,
    setFilterTipoTimeline,
    idInteraccionABorrar,
    setIdInteraccionABorrar,
    updatingInteresId,
    propiedadPendienteId,
    setPropiedadPendienteId,
    nivelInteresPendiente,
    setNivelInteresPendiente,
    dropdownInteresOpenId,
    setDropdownInteresOpenId,
    vincularStatus,
    isClosingModalOpen,
    setIsClosingModalOpen,
    isUpdatingEtapa,
    showEtapaDropdown,
    setShowEtapaDropdown,
    revertConfirmation,
    setRevertConfirmation,
    idInteresABorrar,
    setIdInteresABorrar,
    isDeletingInteres,
    handleRevertStatus,
    handleStageChange,
    handleClosingConfirm,
    handleSaveNota,
    handleEditarNota,
    handleEliminarNota,
    handleVincularPropiedad,
    handleUpdateNivelInteres,
    handleDesvincular,
    historialFiltrado,
    mutate,
    globalMutate,
    navigate
  };
};
