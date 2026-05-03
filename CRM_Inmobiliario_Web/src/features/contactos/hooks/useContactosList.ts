import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import Fuse from 'fuse.js';
import { getContactos } from '../api/getContactos';
import { actualizarEtapaContacto } from '../api/actualizarEtapaContacto';
import { swrDefaultConfig } from '@/lib/swr';
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
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEtapa, setFilterEtapa] = useState('Todas');
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

  const fuse = useMemo(() => {
    return new Fuse(contactos, {
      keys: [
        { name: 'nombre', weight: 0.7 },
        { name: 'apellido', weight: 0.7 },
        { name: 'email', weight: 0.3 }
      ],
      threshold: 0.3,
      distance: 100
    });
  }, [contactos]);

  const filteredContactos = useMemo(() => {
    let result = contactos;

    if (searchQuery.trim()) {
      result = fuse.search(searchQuery).map(r => r.item);
    }

    return result.filter(contacto => {
      const matchesEtapa = filterEtapa === 'Todas' || contacto.etapaEmbudo === filterEtapa;
      return matchesEtapa;
    });
  }, [contactos, searchQuery, filterEtapa, fuse]);

  const stats = useMemo(() => ({
    total: contactos.length,
    nuevos: contactos.filter(c => c.etapaEmbudo === 'Nuevo' || c.etapaEmbudo === 'Contactado').length,
    negociacion: contactos.filter(c => c.etapaEmbudo === 'En Negociación').length
  }), [contactos]);

  const handleStageChange = (id: string, nuevaEtapa: string, confirmedData?: { propiedadId: string, precioCierre: number, nuevoEstadoPropiedad: string }, tipo: 'contacto' | 'propietario' = 'contacto') => {
    setOpenDropdownId(null);
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
    setNotification({ type: 'success', message: `${tipo === 'propietario' ? 'Propietario' : 'Cliente'} movido a ${nuevaEtapa}` });
    
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
        const msg = err.response?.data?.Message || 'No se pudo sincronizar el cambio de estado.';
        setNotification({ type: 'error', message: msg });
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
    filteredContactos,
    isLoading,
    syncing,
    stats,
    searchQuery,
    setSearchQuery,
    filterEtapa,
    setFilterEtapa,
    viewMode,
    setViewMode,
    isModalOpen,
    setIsModalOpen,
    selectedContactoForEdit,
    setSelectedContactoForEdit,
    openDropdownId,
    setOpenDropdownId,
    dropdownRef,
    notification,
    setNotification,
    closingContacto,
    setClosingContacto,
    handleStageChange,
    handleClosingConfirm,
    mutate
  };
};
