import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

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
  keywords: string[];
}

const STATIC_OPTIONS: StaticOption[] = [
  // Dashboard
  { id: 'route-dashboard', title: 'Inicio', subtitle: 'Dashboard Principal', icon: 'Home', path: '/', keywords: ['inicio', 'dashboard', 'home', 'principal', 'resumen'] },
  // Calendario
  { id: 'route-calendario', title: 'Calendario', subtitle: 'Gestión de Agenda', icon: 'Calendar', path: '/calendario', keywords: ['calendario', 'agenda', 'eventos', 'visitas', 'reuniones'] },
  // CRM y Entidades
  { id: 'route-contactos', title: 'Contactos', subtitle: 'Gestión de Contactos', icon: 'Users', path: '/contactos', keywords: ['contactos', 'directorio', 'personas'] },
  { id: 'route-clientes', title: 'Clientes', subtitle: 'Gestión de Clientes', icon: 'Users', path: '/clientes', keywords: ['clientes'] },
  { id: 'route-propietarios', title: 'Propietarios', subtitle: 'Gestión de Propietarios', icon: 'Users', path: '/propietarios', keywords: ['propietarios', 'dueños'] },
  { id: 'route-propiedades', title: 'Propiedades', subtitle: 'Catálogo de Inmuebles', icon: 'Building', path: '/propiedades', keywords: ['propiedades', 'casas', 'departamentos', 'inventario'] },
  // Analítica
  { id: 'route-kpis', title: 'Analítica y KPIs', subtitle: 'Métricas y Reportes', icon: 'BarChart', path: '/kpis', keywords: ['kpis', 'analitica', 'estadisticas', 'reportes', 'graficos', 'metricas'] },
  // Registros IA
  { id: 'route-reg-whatsapp', title: 'Registros: WhatsApp', subtitle: 'Auditoría IA WhatsApp', icon: 'Bot', path: '/registros-sistema-ia/whatsapp', keywords: ['registros', 'ia', 'whatsapp', 'logs', 'auditoria'] },
  { id: 'route-reg-personal', title: 'Registros: Personal', subtitle: 'Actividad Personal IA', icon: 'Bot', path: '/registros-sistema-ia/personal', keywords: ['registros', 'ia', 'personal', 'logs', 'actividad'] },
  { id: 'route-reg-facebook', title: 'Registros: Facebook', subtitle: 'Auditoría IA Facebook', icon: 'Bot', path: '/registros-sistema-ia/facebook', keywords: ['registros', 'ia', 'facebook', 'logs', 'auditoria'] },
  { id: 'route-reg-general', title: 'Registros: General', subtitle: 'Auditoría General IA', icon: 'Bot', path: '/registros-sistema-ia/general', keywords: ['registros', 'ia', 'general', 'logs', 'auditoria'] },
  // Configuración y Ajustes
  { id: 'route-conf-perfil', title: 'Configuración: Perfil', subtitle: 'Ajustes de Usuario', icon: 'Settings', path: '/configuracion/perfil', keywords: ['configuracion', 'perfil', 'ajustes', 'usuario', 'cuenta', 'mi perfil'] },
  { id: 'route-conf-ia', title: 'Configuración: IA', subtitle: 'Ajustes del Asistente', icon: 'Settings', path: '/configuracion/ia', keywords: ['configuracion', 'ia', 'asistente', 'inteligencia artificial'] },
  { id: 'route-conf-integ', title: 'Configuración: Integración IA', subtitle: 'IA y Límites', icon: 'Settings', path: '/configuracion/integracion-ia', keywords: ['configuracion', 'integracion', 'limites', 'tokens', 'ia y limites'] },
  { id: 'route-conf-notif', title: 'Configuración: Notificaciones', subtitle: 'Preferencias de Alertas', icon: 'Settings', path: '/configuracion/notificaciones', keywords: ['configuracion', 'notificaciones', 'alertas', 'avisos'] },
  { id: 'route-conf-org', title: 'Configuración: Organización', subtitle: 'Datos de la Empresa', icon: 'Settings', path: '/configuracion/organizacion', keywords: ['configuracion', 'organizacion', 'empresa', 'negocio'] },
  { id: 'route-conf-agentes', title: 'Configuración: Agentes', subtitle: 'Gestión del Equipo', icon: 'Settings', path: '/configuracion/agentes', keywords: ['configuracion', 'agentes', 'equipo', 'vendedores', 'asesores', 'usuarios'] },
  { id: 'route-conf-agencias', title: 'Configuración: Agencias', subtitle: 'Gestión de Sucursales', icon: 'Settings', path: '/configuracion/agencias', keywords: ['configuracion', 'agencias', 'sucursales', 'oficinas'] },
  { id: 'route-conf-seguridad', title: 'Configuración: Seguridad', subtitle: 'Privacidad y Accesos', icon: 'Settings', path: '/configuracion/seguridad', keywords: ['configuracion', 'seguridad', 'privacidad', 'contraseña', 'accesos'] },
  { id: 'route-conf-autoarch', title: 'Configuración: Auto-Archivado', subtitle: 'Limpieza Automática', icon: 'Settings', path: '/configuracion/auto-archivado', keywords: ['configuracion', 'auto-archivado', 'archivo', 'limpieza', 'historial'] },
  { id: 'action-new-task', title: 'Nueva Tarea', subtitle: 'Crear una tarea rápida', icon: 'PlusSquare', action: 'NEW_TASK', keywords: ['nueva tarea', 'crear tarea', 'agregar tarea', 'recordatorio'] }
];

export const useCommandPaletteLogic = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

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
    let options = STATIC_OPTIONS;

    if (!isAdmin) {
      const adminOnlyIds = [
        'route-conf-ia',
        'route-conf-org',
        'route-conf-agentes',
        'route-conf-agencias',
        'route-conf-seguridad'
      ];
      options = options.filter(o => !adminOnlyIds.includes(o.id));
    }

    if (!query.trim()) {
      const quickAccessIds = ['action-new-task', 'route-calendario', 'route-conf-perfil'];
      return quickAccessIds
        .map(id => options.find(o => o.id === id))
        .filter((o): o is StaticOption => o !== undefined);
    }

    const lowerQuery = query.toLowerCase().trim();
    return options.filter(o => 
      o.title.toLowerCase().includes(lowerQuery) || 
      o.subtitle.toLowerCase().includes(lowerQuery) ||
      o.keywords.some(kw => kw.toLowerCase().includes(lowerQuery))
    );
  }, [query, isAdmin]);

  const handleSelectStatic = (option: StaticOption) => {
    setIsOpen(false);
    setQuery('');
    if (option.path) {
      navigate(option.path);
    } else if (option.action === 'NEW_TASK') {
      window.dispatchEvent(new CustomEvent('open-agenda-create-task'));
    }
  };

  const handleSelectDynamic = (result: OmniSearchResult) => {
    setIsOpen(false);
    setQuery('');
    if (result.entityType === 'Contacto') {
      navigate(`/contactos/${result.entityId}`);
    } else if (result.entityType === 'Propiedad') {
      navigate(`/propiedades?id=${result.entityId}`);
    } else if (result.entityType === 'Tarea') {
      navigate(`/?tarea=${result.entityId}`); 
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

