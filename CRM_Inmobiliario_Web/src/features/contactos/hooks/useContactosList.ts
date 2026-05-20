import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { getContactos } from '../api/getContactos';
import { actualizarEtapaContacto } from '../api/actualizarEtapaContacto';
import { swrDefaultConfig } from '@/lib/swr';
import { useContactosFiltering } from './useContactosFiltering';
import type { Contacto } from '../types';

const VIEW_MODE_KEY = 'crm_contactos_view_mode';

export const useContactosList = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { mutate: globalMutate } = useSWRConfig();

  const activeSegment = useMemo(() => {
    if (pathname.includes('/propietarios')) return 'propietarios' as const;
    if (pathname.includes('/clientes')) return 'clientes' as const;
    return 'todos' as const;
  }, [pathname]);

  const setActiveSegment = (segment: 'todos' | 'clientes' | 'propietarios') => {
    const path = segment === 'todos' ? '/contactos' : `/${segment}`;
    navigate(path);
  };

  const { data: allContactos = [], isLoading, isValidating: syncing, mutate } = useSWR<Contacto[]>(
    '/contactos',
    getContactos,
    swrDefaultConfig
  );

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

  const handleStageChange = (id: string, nuevaEtapa: string, confirmedData?: { propiedadId: string, precioCierre: number, nuevoEstadoPropiedad: string }, tipo: 'contacto' | 'propietario' = 'contacto') => {
    const contacto = allContactos.find(c => c.id === id);
    if (!contacto) return;

    const etapaActual = tipo === 'propietario' ? contacto.estadoPropietario : contacto.etapaEmbudo;
    if (etapaActual === nuevaEtapa) return;

    if (tipo === 'contacto' && nuevaEtapa === 'Cerrado' && !confirmedData) {
      setClosingContacto(contacto);
      return;
    }

    const optimisticData = allContactos.map(c => {
      if (c.id === id) {
        return tipo === 'propietario'
          ? { ...c, estadoPropietario: nuevaEtapa }
          : { ...c, etapaEmbudo: nuevaEtapa };
      }
      return c;
    });

    mutate(optimisticData, false);
    toast.success(`${tipo === 'propietario' ? 'Propietario' : 'Cliente'} movido a ${nuevaEtapa}`);

    actualizarEtapaContacto(id, nuevaEtapa, confirmedData?.propiedadId, confirmedData?.precioCierre, confirmedData?.nuevoEstadoPropiedad, tipo)
      .then(async () => {
        await mutate();
        globalMutate('/dashboard/kpis');
        globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
        globalMutate('/propiedades');
      })
      .catch((err: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error('Error al actualizar etapa:', err);
        mutate();
        const errorMessage = err.response?.data?.Message || err.response?.data?.message || err.message || 'No se pudo sincronizar el cambio de estado.';
        toast.error(errorMessage);
      });
  };

  const handleClosingConfirm = async (precioCierre: number, propiedadId: string, nuevoEstadoPropiedad: string) => {
    if (!closingContacto) return;
    handleStageChange(closingContacto.id, 'Cerrado', { propiedadId, precioCierre, nuevoEstadoPropiedad });
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
    handleStageChange,
    handleClosingConfirm,
    mutate,
    ...filteringProps
  };
};
