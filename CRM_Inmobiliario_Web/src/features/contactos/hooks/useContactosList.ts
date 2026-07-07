import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import useSWR, { preload } from 'swr';
import { getContactos, type GetContactosParams, type GetContactosResponse } from '../api/getContactos';
import { swrDefaultConfig } from '@/lib/swr';
import { useContactosFiltering } from './useContactosFiltering';
import { useContactoCommercialLogic } from './useContactoCommercialLogic';


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
    navigate({ pathname: path, search: searchParams.toString() });
  };

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || undefined;
  const estado = searchParams.get('estado') || undefined;
  const visibilidad = searchParams.get('visibilidad') || undefined;
  const origen = searchParams.get('origen') || undefined;
  const estadoPropietario = searchParams.get('estadoPropietario') || undefined;
  const estadoIA_WA = searchParams.get('estadoIA_WA') || undefined;
  const estadoIA_FB = searchParams.get('estadoIA_FB') || undefined;
  const isArchived = searchParams.get('isArchived') === 'true';
  const sortBy = searchParams.get('sortBy') || undefined;
  const sortDirection = searchParams.get('sortDirection') || undefined;
  
  const params = useMemo(() => ({ 
    page, 
    pageSize: 20, 
    search, 
    estado: estado === 'Todos' ? undefined : estado,
    segmento: activeSegment === 'todos' ? undefined : activeSegment,
    visibilidad: visibilidad === 'Todos' ? undefined : visibilidad,
    origen: origen === 'Todos' ? undefined : origen,
    estadoPropietario: estadoPropietario === 'Todos' ? undefined : estadoPropietario,
    estadoIA_WA: estadoIA_WA === 'Todos' ? undefined : estadoIA_WA,
    estadoIA_FB: estadoIA_FB === 'Todos' ? undefined : estadoIA_FB,
    isArchived: isArchived || undefined,
    sortBy,
    sortDirection
  }), [page, search, estado, activeSegment, visibilidad, origen, estadoPropietario, estadoIA_WA, estadoIA_FB, isArchived, sortBy, sortDirection]);

  const { data: responseData, isLoading, isValidating, mutate } = useSWR<GetContactosResponse>(
    ['/contactos', params],
    // SWR 2.x pasa AbortSignal como segundo argumento del fetcher, NO como extraArgs
    ([, p]: [string, Record<string, unknown>], { signal }: { signal?: AbortSignal } = {}) =>
      getContactos({ ...p as GetContactosParams, signal }),
    { ...swrDefaultConfig, keepPreviousData: true }
  );

  const { cambiarEstado } = useContactoCommercialLogic();

  // Server-side filtered items
  const allContactos = useMemo(() => responseData?.items || [], [responseData?.items]);
  
  const isOwnersView = pathname.includes('/propietarios');

  const contactos = allContactos;

  const [viewModeRaw, setViewModeRaw] = useState<'list' | 'kanban'>(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    return (saved as 'list' | 'kanban') || 'list';
  });

  const viewMode = (activeSegment === 'todos' || isArchived) ? 'list' : viewModeRaw;

  const setViewMode = (mode: 'list' | 'kanban') => {
    if (activeSegment === 'todos' || isArchived) return;
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

  // Prefetch de la siguiente página para zero-wait
  // Debounce de 300ms: evita disparar prefetches durante navegación rápida
  useEffect(() => {
    if (!responseData || page >= totalPages) return;
    const timer = setTimeout(() => {
      preload(['/contactos', { ...params, page: page + 1 }], ([, p]: [string, Record<string, unknown>]) =>
        getContactos(p as GetContactosParams)
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [page, totalPages, params, responseData]);

  const handleStageChange = (id: string, nuevoEstado: string, tipo: 'contacto' | 'propietario' = 'contacto') => {
    const contacto = allContactos.find(c => c.id === id);
    if (!contacto) return;

    const etapaActual = tipo === 'propietario' ? contacto.estadoPropietario : contacto.estadoEmbudo;
    if (etapaActual === nuevoEstado) return;

    if (tipo === 'contacto') {
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
          setNewCycleConfirmation({ id: contacto.id, etapa: nuevoEstado, nombre: contacto.nombre });
          return;
        }
      }
    }

    executeStageChange(id, nuevoEstado, tipo);
  };

  const executeStageChange = (id: string, nuevoEstado: string, tipo: 'contacto' | 'propietario' = 'contacto') => {
    cambiarEstado(id, nuevoEstado, tipo, undefined, {
      onOptimisticUpdate: () => {
        if (!responseData) return;
        const optimisticItems = responseData.items.map(c => {
          if (c.id === id) {
            return tipo === 'propietario'
              ? { ...c, estadoPropietario: nuevoEstado }
              : { ...c, estadoEmbudo: nuevoEstado };
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
    isOwnersView,
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
    newCycleConfirmation,
    setNewCycleConfirmation,
    handleStageChange,
    executeStageChange,
    mutate,
    totalPages,
    ...filteringProps
  };
};
