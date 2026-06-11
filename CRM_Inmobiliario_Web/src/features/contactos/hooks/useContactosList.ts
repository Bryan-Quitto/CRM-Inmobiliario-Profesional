import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { getContactos, type GetContactosResponse } from '../api/getContactos';
import { swrDefaultConfig } from '@/lib/swr';
import { useContactosFiltering } from './useContactosFiltering';
import { useContactoCommercialLogic } from './useContactoCommercialLogic';
import type { Contacto } from '../types';

const VIEW_MODE_KEY = 'crm_contactos_view_mode';

export const useContactosList = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  const activeSegment = useMemo(() => {
    if (pathname.includes('/propietarios')) return 'propietarios' as const;
    if (pathname.includes('/clientes')) return 'clientes' as const;
    return 'todos' as const;
  }, [pathname]);

  const setActiveSegment = (segment: 'todos' | 'clientes' | 'propietarios') => {
    const path = segment === 'todos' ? '/contactos' : `/${segment}`;
    navigate(path);
  };

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || undefined;
  const estado = searchParams.get('estado') || undefined;
  const visibilidad = searchParams.get('visibilidad') || undefined;
  const origen = searchParams.get('origen') || undefined;
  const estadoPropietario = searchParams.get('estadoPropietario') || undefined;
  const sortBy = searchParams.get('sortBy') || undefined;
  const sortDirection = searchParams.get('sortDirection') || undefined;
  
  const params = { 
    page, 
    pageSize: 20, 
    search, 
    estado: estado === 'Todos' ? undefined : estado,
    segmento: activeSegment === 'todos' ? undefined : activeSegment,
    visibilidad: visibilidad === 'Todos' ? undefined : visibilidad,
    origen: origen === 'Todos' ? undefined : origen,
    estadoPropietario: estadoPropietario === 'Todos' ? undefined : estadoPropietario,
    sortBy,
    sortDirection
  };

  const { data: responseData, isLoading, isValidating, mutate } = useSWR<GetContactosResponse>(
    ['/contactos', params],
    () => getContactos(params),
    { ...swrDefaultConfig, refreshInterval: 5000, keepPreviousData: true }
  );

  const { cambiarEtapa } = useContactoCommercialLogic();

  // Server-side filtered items
  const allContactos = useMemo(() => responseData?.items || [], [responseData?.items]);
  
  const contactos = allContactos;

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

  const filteringProps = useContactosFiltering();

  const stats = useMemo(() => ({
    total: responseData?.totalCount || 0,
    nuevos: responseData?.nuevos || 0,
    negociacion: responseData?.enNegociacion || 0
  }), [responseData]);

  // Merge the totalPages logic into the return since filteredContactos is removed
  const totalPages = Math.ceil((responseData?.totalCount || 0) / 20);

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
        if (!responseData) return;
        const optimisticItems = responseData.items.map(c => {
          if (c.id === id) {
            return tipo === 'propietario'
              ? { ...c, estadoPropietario: nuevaEtapa }
              : { ...c, etapaEmbudo: nuevaEtapa };
          }
          return c;
        });
        mutate({ ...responseData, items: optimisticItems }, false);
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
    // Add paginatedContactos and filteredContactos to match the view's expectations
    filteredContactos: contactos,
    paginatedContactos: contactos,
    isLoading,
    syncing: isValidating,
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
    totalPages,
    ...filteringProps
  };
};
