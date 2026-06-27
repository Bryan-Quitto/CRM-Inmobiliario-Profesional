import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/axios';
import { useNavigate } from 'react-router-dom';

export interface OmniSearchResult {
  entityId: string;
  entityType: string;
  title: string;
  subtitle: string | null;
  searchText: string;
}

export interface OmniSearchResponse {
  contactos: OmniSearchResult[];
  propiedades: OmniSearchResult[];
  tareas: OmniSearchResult[];
}

export interface StaticOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  path?: string;
  action?: string;
}

const STATIC_OPTIONS: StaticOption[] = [
  { id: 'static-config', title: 'Configuración', subtitle: 'Ir a los ajustes del sistema', icon: 'Settings', path: '/configuracion' },
  { id: 'static-agenda', title: 'Agenda', subtitle: 'Ver tu calendario y eventos', icon: 'Calendar', path: '/agenda' },
  { id: 'static-task', title: 'Nueva Tarea', subtitle: 'Crear una tarea rápida', icon: 'PlusSquare', action: 'NEW_TASK' },
];

export const useCommandPaletteLogic = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    
    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-omnisearch', handleCustomOpen);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-omnisearch', handleCustomOpen);
    };
  }, [isOpen]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const fetcher = async (url: string) => {
    const res = await api.get<OmniSearchResponse>(url);
    return res.data;
  };

  const { data, isLoading, isValidating } = useSWR(
    debouncedQuery.trim() ? `/omnisearch?query=${encodeURIComponent(debouncedQuery.trim())}` : null,
    fetcher,
    { keepPreviousData: true }
  );

  const filteredStaticOptions = useMemo(() => {
    if (!query.trim()) return STATIC_OPTIONS;
    const lowerQuery = query.toLowerCase();
    return STATIC_OPTIONS.filter(o => 
      o.title.toLowerCase().includes(lowerQuery) || o.subtitle.toLowerCase().includes(lowerQuery)
    );
  }, [query]);

  const handleSelectStatic = (option: StaticOption) => {
    setIsOpen(false);
    setQuery('');
    if (option.path) {
      navigate(option.path);
    } else if (option.action === 'NEW_TASK') {
      navigate('?action=newTask');
    }
  };

  const handleSelectDynamic = (result: OmniSearchResult) => {
    setIsOpen(false);
    setQuery('');
    if (result.entityType === 'Contacto') {
      navigate(`/contactos/${result.entityId}`);
    } else if (result.entityType === 'Propiedad') {
      navigate(`/propiedades/${result.entityId}`);
    } else if (result.entityType === 'Tarea') {
      navigate(`/tareas/${result.entityId}`); 
    }
  };

  return {
    isOpen,
    setIsOpen,
    query,
    setQuery,
    data,
    isLoading: isLoading && !data,
    isSyncing: isValidating,
    filteredStaticOptions,
    handleSelectStatic,
    handleSelectDynamic,
  };
};
