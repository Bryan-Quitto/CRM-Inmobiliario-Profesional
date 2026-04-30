import { useState, useEffect, useMemo, useRef } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import Fuse from 'fuse.js';
import { getClientes } from '../api/getClientes';
import { actualizarEtapaCliente } from '../api/actualizarEtapaCliente';
import { swrDefaultConfig } from '@/lib/swr';
import type { Cliente } from '../types';

const VIEW_MODE_KEY = 'crm_clientes_view_mode';

export const useClientesList = () => {
  const { mutate: globalMutate } = useSWRConfig();
  const { data: clientes = [], isLoading, isValidating: syncing, mutate } = useSWR<Cliente[]>(
    '/clientes',
    getClientes,
    swrDefaultConfig
  );
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClienteForEdit, setSelectedClienteForEdit] = useState<Cliente | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEtapa, setFilterEtapa] = useState('Todas');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    return (saved as 'list' | 'kanban') || 'list';
  });

  const [closingLead, setClosingLead] = useState<Cliente | null>(null);

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

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
    return new Fuse(clientes, {
      keys: [
        { name: 'nombre', weight: 0.7 },
        { name: 'apellido', weight: 0.7 },
        { name: 'email', weight: 0.3 }
      ],
      threshold: 0.3,
      distance: 100
    });
  }, [clientes]);

  const filteredClientes = useMemo(() => {
    let result = clientes;

    if (searchQuery.trim()) {
      result = fuse.search(searchQuery).map(r => r.item);
    }

    return result.filter(cliente => {
      const matchesEtapa = filterEtapa === 'Todas' || cliente.etapaEmbudo === filterEtapa;
      return matchesEtapa;
    });
  }, [clientes, searchQuery, filterEtapa, fuse]);

  const stats = useMemo(() => ({
    total: clientes.length,
    nuevos: clientes.filter(c => c.etapaEmbudo === 'Nuevo' || c.etapaEmbudo === 'Contactado').length,
    negociacion: clientes.filter(c => c.etapaEmbudo === 'En Negociación').length
  }), [clientes]);

  const handleStageChange = (id: string, nuevaEtapa: string, confirmedData?: { propiedadId: string, precioCierre: number, nuevoEstadoPropiedad: string }) => {
    setOpenDropdownId(null);
    const cliente = clientes.find(c => c.id === id);
    if (!cliente || cliente.etapaEmbudo === nuevaEtapa) return;

    if (nuevaEtapa === 'Cerrado' && !confirmedData) {
      setClosingLead(cliente);
      return;
    }

    const optimisticData = clientes.map(c => c.id === id ? { ...c, etapaEmbudo: nuevaEtapa } : c);
    mutate(optimisticData, false);
    setNotification({ type: 'success', message: `Cliente movido a ${nuevaEtapa}` });
    
    actualizarEtapaCliente(id, nuevaEtapa, confirmedData?.propiedadId, confirmedData?.precioCierre, confirmedData?.nuevoEstadoPropiedad)
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
    if (!closingLead) return;
    handleStageChange(closingLead.id, 'Cerrado', { propiedadId, precioCierre, nuevoEstadoPropiedad });
    setClosingLead(null);
  };

  return {
    clientes,
    filteredClientes,
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
    selectedClienteForEdit,
    setSelectedClienteForEdit,
    openDropdownId,
    setOpenDropdownId,
    dropdownRef,
    notification,
    setNotification,
    closingLead,
    setClosingLead,
    handleStageChange,
    handleClosingConfirm,
    mutate
  };
};
