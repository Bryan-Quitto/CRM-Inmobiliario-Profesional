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

  const { cambiarEtapa } = useContactoCommercialLogic();

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

  const [newCycleConfirmation, setNewCycleConfirmation] = useState<{ id: string, etapa: string, nombre: string } | null>(null);

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

  const handleStageChange = (id: string, nuevaEtapa: string, tipo: 'contacto' | 'propietario' = 'contacto') => {
    const contacto = allContactos.find(c => c.id === id);
    if (!contacto) return;

    const etapaActual = tipo === 'propietario' ? contacto.estadoPropietario : contacto.etapaEmbudo;
    if (etapaActual === nuevaEtapa) return;

    if (tipo === 'contacto') {
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
          setNewCycleConfirmation({ id: contacto.id, etapa: nuevaEtapa, nombre: contacto.nombre });
          return;
        }
      }
    }

    executeStageChange(id, nuevaEtapa, tipo);
  };

  const executeStageChange = (id: string, nuevaEtapa: string, tipo: 'contacto' | 'propietario' = 'contacto') => {
    cambiarEtapa(id, nuevaEtapa, tipo, undefined, {
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
    setNewCycleConfirmation(null);
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
    newCycleConfirmation,
    setNewCycleConfirmation,
    handleStageChange,
    executeStageChange,
    mutate,
    ...filteringProps
  };
};
