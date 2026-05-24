import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { getContactos } from '../api/getContactos';
import { swrDefaultConfig } from '@/lib/swr';
import { useContactosFiltering } from './useContactosFiltering';
import { useContactoCommercialLogic } from './useContactoCommercialLogic';
import type { Contacto } from '../types';

const VIEW_MODE_KEY = 'crm_contactos_view_mode';

export const useContactosList = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const activeSegment = useMemo(() => {
    if (pathname.includes('/propietarios')) return 'propietarios' as const;
    if (pathname.includes('/clientes')) return 'clientes' as const;
    return 'todos' as const;
  }, [pathname]);

  const setActiveSegment = (segment: 'todos' | 'clientes' | 'propietarios') => {
    const path = segment === 'todos' ? '/contactos' : `/${segment}`;
    navigate(path);
  };

  const { data: allContactos = [], isLoading, isLoading: syncing, mutate } = useSWR<Contacto[]>(
    '/contactos',
    getContactos,
    { ...swrDefaultConfig, refreshInterval: 5000, keepPreviousData: true }
  );

  const { cambiarEtapa, revertirEtapa } = useContactoCommercialLogic();

  // Filtrar base según el segmento activo
  const contactos = useMemo(() => {
    switch (activeSegment) {
      case 'clientes':
        return allContactos.filter(c => c.esContacto);
      case 'propietarios':
        return allContactos.filter(c => c.esPropietario);
      default:
        return allContactos;
    }
  }, [allContactos, activeSegment]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContactoForEdit, setSelectedContactoForEdit] = useState<Contacto | null>(null);

  const [viewModeRaw, setViewModeRaw] = useState<'list' | 'kanban'>(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    return (saved as 'list' | 'kanban') || 'list';
  });

  const viewMode = activeSegment === 'todos' ? 'list' : viewModeRaw;

  const setViewMode = (mode: 'list' | 'kanban') => {
    if (activeSegment === 'todos') return;
    setViewModeRaw(mode);
  };

  const [closingContacto, setClosingContacto] = useState<Contacto | null>(null);
  const [closingIntendedStage, setClosingIntendedStage] = useState<string | null>(null);

  const [revertConfirmation, setRevertConfirmation] = useState<{ id: string, etapa: string, nombre: string, etapaOrigen: string } | null>(null);

  useEffect(() => {
    if (activeSegment !== 'todos') {
      localStorage.setItem(VIEW_MODE_KEY, viewModeRaw);
    }
  }, [viewModeRaw, activeSegment]);

  const filteringProps = useContactosFiltering(contactos);

  const stats = useMemo(() => ({
    total: contactos.length,
    nuevos: contactos.filter(c => c.etapaEmbudo === 'Nuevo' || c.etapaEmbudo === 'Contactado').length,
    negociacion: contactos.filter(c => c.etapaEmbudo === 'En Negociación').length
  }), [contactos]);

  const handleRevertStatus = (id: string, nuevaEtapa: string, liberarPropiedades: boolean) => {
    const contacto = allContactos.find(c => c.id === id);
    if (!contacto) return;
    
    setRevertConfirmation(null);
    
    revertirEtapa(id, nuevaEtapa, liberarPropiedades, {
      onOptimisticUpdate: () => {
        const optimisticData = allContactos.map(c => {
          if (c.id === id) {
            return { ...c, etapaEmbudo: nuevaEtapa, fechaCierre: undefined };
          }
          return c;
        });
        mutate(optimisticData, false);
      },
      onSuccess: async () => { await mutate(); },
      onError: () => mutate()
    });
  };

  const handleStageChange = (id: string, nuevaEtapa: string, confirmedData?: { propiedadId: string, precioCierre: number, nuevoEstadoPropiedad: string }, tipo: 'contacto' | 'propietario' = 'contacto') => {
    const contacto = allContactos.find(c => c.id === id);
    if (!contacto) return;

    const etapaActual = tipo === 'propietario' ? contacto.estadoPropietario : contacto.etapaEmbudo;
    if (etapaActual === nuevaEtapa) return;

    if (tipo === 'contacto' && !confirmedData) {
      if (nuevaEtapa === 'Cerrado' || nuevaEtapa === 'En Negociación') {
        setClosingIntendedStage(nuevaEtapa);
        setClosingContacto(contacto);
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
            handleRevertStatus(id, nuevaEtapa, false);
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
            handleRevertStatus(id, nuevaEtapa, false);
            return;
          }
        }

        setRevertConfirmation({ id: contacto.id, etapa: nuevaEtapa, nombre: contacto.nombre, etapaOrigen: contacto.etapaEmbudo });
        return;
      }
    }

    cambiarEtapa(id, nuevaEtapa, tipo, confirmedData, {
      onOptimisticUpdate: () => {
        const optimisticData = allContactos.map(c => {
          if (c.id === id) {
            return tipo === 'propietario'
              ? { ...c, estadoPropietario: nuevaEtapa }
              : { ...c, etapaEmbudo: nuevaEtapa };
          }
          return c;
        });
        mutate(optimisticData, false);
      },
      onSuccess: async () => { await mutate(); },
      onError: () => mutate()
    });
  };



  const handleClosingConfirm = async (precioCierre: number | null, propiedadId: string, nuevoEstadoPropiedad: string) => {
    if (!closingContacto) return;
    handleStageChange(closingContacto.id, closingIntendedStage || 'Cerrado', { propiedadId, precioCierre: precioCierre || 0, nuevoEstadoPropiedad });
    setClosingContacto(null);
  };

  return {
    isOwnersView: activeSegment === 'propietarios',
    activeSegment,
    setActiveSegment,
    contactos,
    isLoading,
    syncing,
    stats,
    viewMode,
    setViewMode,
    isModalOpen,
    setIsModalOpen,
    selectedContactoForEdit,
    setSelectedContactoForEdit,
    closingContacto,
    setClosingContacto,
    closingIntendedStage,
    handleStageChange,
    handleClosingConfirm,
    revertConfirmation,
    setRevertConfirmation,
    handleRevertStatus,
    mutate,
    ...filteringProps
  };
};
