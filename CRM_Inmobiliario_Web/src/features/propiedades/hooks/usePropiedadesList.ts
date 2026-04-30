import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import Fuse from 'fuse.js';
import { toast } from 'sonner';
import { getPropiedades } from '../api/getPropiedades';
import { actualizarEstadoPropiedad } from '../api/actualizarEstadoPropiedad';
import { limpiarImagenesPropiedad } from '../api/limpiarImagenesPropiedad';
import { swrDefaultConfig } from '@/lib/swr';
import type { Propiedad } from '../types';

export const usePropiedadesList = () => {
  const { mutate: globalMutate } = useSWRConfig();
  const { data: propiedades = [], isLoading, isValidating: syncing, mutate } = useSWR<Propiedad[]>(
    '/propiedades',
    getPropiedades,
    swrDefaultConfig
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [statusConfirmation, setStatusConfirmation] = useState<{ id: string; nuevoEstado: string } | null>(null);
  const [closingPropiedad, setClosingPropiedad] = useState<{ propiedad: Propiedad; nuevoEstado: string } | null>(null);
  const [showReversionModal, setShowReversionModal] = useState<{ type: 'status', id: string, targetStatus: string } | null>(null);
  const [selectedPropiedadIdForEdit, setSelectedPropiedadIdForEdit] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState('Todos');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedPropiedadId = searchParams.get('id');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleOpenDetail = (id: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('id', id);
    setSearchParams(newParams);
  };

  const handleCloseDetail = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('id');
    setSearchParams(newParams);
  };

  const handleStatusChange = async (id: string, nuevoEstado: string, confirmed = false) => {
    setOpenDropdownId(null);
    const propiedad = propiedades.find(p => p.id === id);
    if (!propiedad || propiedad.estadoComercial === nuevoEstado) return;

    if ((nuevoEstado === 'Vendida' || nuevoEstado === 'Alquilada') && !confirmed) {
      setClosingPropiedad({ propiedad, nuevoEstado });
      return;
    }

    if ((nuevoEstado === 'Disponible' || nuevoEstado === 'Inactiva') && (propiedad.estadoComercial === 'Vendida' || propiedad.estadoComercial === 'Alquilada') && !confirmed) {
      setShowReversionModal({ type: 'status', id, targetStatus: nuevoEstado });
      return;
    }

    if (nuevoEstado === 'Inactiva' && !confirmed && propiedad.estadoComercial !== 'Vendida' && propiedad.estadoComercial !== 'Alquilada') {
      setStatusConfirmation({ id, nuevoEstado });
      return;
    }

    setStatusConfirmation(null);
    setClosingPropiedad(null);
    const optimisticData = propiedades.map(p => p.id === id ? { ...p, estadoComercial: nuevoEstado } : p);

    if (!confirmed) {
      try {
        setUpdatingId(id);
        await mutate(actualizarEstadoPropiedad(id, nuevoEstado).then(() => optimisticData), {
          optimisticData,
          rollbackOnError: true,
          revalidate: true
        });
        toast.success(`Inmueble marcado como ${nuevoEstado}`);
        globalMutate('/dashboard/kpis');
        globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
      } catch (error) {
        const err = error as { response?: { data?: { message?: string } } };
        if (nuevoEstado === 'Reservada' && (propiedad.estadoComercial === 'Vendida' || propiedad.estadoComercial === 'Alquilada')) {
            toast.error("Acción no permitida", {
                description: "Debe primero cambiar la propiedad a Disponible antes de reservarla."
            });
        } else {
            toast.error(err.response?.data?.message || 'No se pudo actualizar el estado.');
        }
      } finally {
        setUpdatingId(null);
      }
      return;
    }

    let isCancelled = false;
    const isReversion = (nuevoEstado === 'Disponible' || nuevoEstado === 'Inactiva') && (propiedad.estadoComercial === 'Vendida' || propiedad.estadoComercial === 'Alquilada');

    const commitStatusChange = async () => {
      if (isCancelled) return;

      try {
        setUpdatingId(id);
        await actualizarEstadoPropiedad(id, nuevoEstado);
        if (nuevoEstado === 'Vendida' || nuevoEstado === 'Inactiva') {
            await limpiarImagenesPropiedad(id);
        }
        mutate();
        globalMutate('/dashboard/kpis');
        globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
        toast.success(isReversion ? "Cierre revertido con éxito" : `Propiedad "${propiedad.titulo}" actualizada y depurada.`);
      } catch {
        toast.error("Error al procesar el cambio de estado.");
      } finally {
        setUpdatingId(null);
      }
    };

    toast.warning(isReversion ? "Revirtiendo Cierre" : `Estado: ${nuevoEstado}`, {
      description: isReversion 
        ? "El cliente volverá a En Negociación. Tienes 5 segundos para deshacer."
        : "La galería ha sido depurada. Tienes 5 segundos para deshacer.",
      action: {
        label: "Deshacer",
        onClick: () => {
          isCancelled = true;
          mutate();
          toast.success("Acción cancelada");
        },
      },
      duration: 6000,
      onAutoClose: commitStatusChange,
      onDismiss: commitStatusChange
    });
    
    mutate(optimisticData, false);
  };

  const handleClosingConfirm = async (precioCierre: number, cerradoConId: string, tipoCierre: string) => {
    if (!closingPropiedad) return;
    const { propiedad } = closingPropiedad;
    
    try {
      setUpdatingId(propiedad.id);
      await actualizarEstadoPropiedad(propiedad.id, tipoCierre, precioCierre, cerradoConId);
      if (tipoCierre === 'Vendida') {
        await limpiarImagenesPropiedad(propiedad.id);
      }
      await mutate();
      globalMutate('/dashboard/kpis');
      globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
      toast.success(`Propiedad ${tipoCierre === 'Vendida' ? 'vendida' : 'alquilada'} con éxito`);
    } catch (error) {
      console.error('Error al cerrar:', error);
      throw error;
    } finally {
      setUpdatingId(null);
      setClosingPropiedad(null);
    }
  };

  const handleCoverUpdate = (propiedadId: string, newUrl: string) => {
    mutate(
      propiedades.map(p => p.id === propiedadId ? { ...p, imagenPortadaUrl: newUrl } : p),
      false
    );
  };

  const fuse = useMemo(() => {
    return new Fuse(propiedades, {
      keys: [
        { name: 'titulo', weight: 0.6 },
        { name: 'sector', weight: 0.2 },
        { name: 'ciudad', weight: 0.2 }
      ],
      threshold: 0.3,
      distance: 100
    });
  }, [propiedades]);

  const filteredPropiedades = useMemo(() => {
    let result = propiedades;
    if (searchQuery.trim()) {
      result = fuse.search(searchQuery).map(r => r.item);
    }
    return result.filter(p => {
      const matchesEstado = filterEstado === 'Todos' || p.estadoComercial === filterEstado;
      return matchesEstado;
    });
  }, [propiedades, searchQuery, filterEstado, fuse]);

  const stats = useMemo(() => ({
    total: propiedades.length,
    venta: propiedades.filter(p => p.operacion === 'Venta').length,
    alquiler: propiedades.filter(p => p.operacion === 'Alquiler').length
  }), [propiedades]);

  return {
    propiedades,
    filteredPropiedades,
    stats,
    loading: isLoading,
    syncing,
    searchQuery,
    setSearchQuery,
    filterEstado,
    setFilterEstado,
    isModalOpen,
    setIsModalOpen,
    notification,
    setNotification,
    updatingId,
    openDropdownId,
    setOpenDropdownId,
    statusConfirmation,
    setStatusConfirmation,
    closingPropiedad,
    setClosingPropiedad,
    showReversionModal,
    setShowReversionModal,
    selectedPropiedadId,
    selectedPropiedadIdForEdit,
    setSelectedPropiedadIdForEdit,
    handleOpenDetail,
    handleCloseDetail,
    handleStatusChange,
    handleClosingConfirm,
    handleCoverUpdate,
    mutate,
    dropdownRef
  };
};
