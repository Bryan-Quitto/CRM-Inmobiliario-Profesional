import { useLocation, Link } from 'react-router-dom';
import { useState } from 'react';
import { 
  Users, 
  Home, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  LayoutDashboard,
  Calendar,
  Bot
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { usePendingOperationsStore } from '@/store/usePendingOperationsStore';
import { UnsavedChangesModal } from '../ui/UnsavedChangesModal';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const location = useLocation();
  // Almacenamos el path optimista y la ruta desde la que se inició
  const [optimisticState, setOptimisticState] = useState<{ path: string, from: string } | null>(null);

  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setOptimisticState(null);
  }

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
    
    // Evitar navegación si ya estamos en la ruta exacta
    if (location.pathname === path) return;
    
    // Evitar loop de carga si hacemos click en un padre que redirige al hijo actual 
    // Ej: click en /configuracion estando en /configuracion/perfil
    if (path === '/configuracion' && location.pathname.startsWith('/configuracion')) return;

    setOptimisticState({ path, from: location.pathname });
  };

  const menuItems = [
    { id: 'dashboard', path: '/', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Inicio' },
    { id: 'calendario', path: '/calendario', icon: <Calendar className="h-5 w-5" />, label: 'Calendario' },
    { id: 'contactos', path: '/contactos', icon: <Users className="h-5 w-5" />, label: 'Contactos' },
    { id: 'propiedades', path: '/propiedades', icon: <Home className="h-5 w-5" />, label: 'Propiedades' },
    { id: 'ia-logs', path: '/registros-sistema-ia', icon: <Bot className="h-5 w-5" />, label: 'Actividad Sistema/IA' },
    { id: 'kpis', path: '/kpis', icon: <BarChart3 className="h-5 w-5" />, label: 'Ventas y KPIs' },
  ];

  const isPending = optimisticState && optimisticState.from === location.pathname;

  const isActive = (path: string) => {
    const currentPath = isPending ? optimisticState.path : location.pathname;
    
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  const { pendingCount } = usePendingOperationsStore();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const performLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('crm-swr-cache');
      toast.success('Sesión cerrada correctamente');
    } catch {
      toast.error('Error al cerrar sesión');
    }
  };

  const handleLogout = () => {
    if (pendingCount > 0) {
      setIsLogoutModalOpen(true);
    } else {
      performLogout();
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] md:hidden transition-opacity duration-300 cursor-pointer"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Global Transition Overlay (Masks old page while new one loads) */}
      {isPending && (
        <div className="fixed inset-0 z-[80] bg-slate-50/60 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="h-12 w-12 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-4 border border-slate-100">
            <div className="h-6 w-6 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          </div>
          <p className="text-xs font-black text-slate-700 uppercase tracking-widest text-center px-4 animate-pulse">
            Preparando módulo...
          </p>
        </div>
      )}
      
      {/* Global Top Loading Bar */}
      {isPending && (
        <div className="fixed top-0 left-0 right-0 h-1 z-[9999] bg-blue-100 overflow-hidden">
          <div className="h-full bg-blue-600 rounded-r-full transition-all duration-300 w-full animate-pulse" />
        </div>
      )}
      <aside 
        className={`fixed left-0 top-0 h-[100dvh] bg-slate-900 text-slate-400 transition-all duration-300 z-[100] shadow-2xl flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] ${
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'
        }`}
      >
        <div className="h-20 flex items-center px-6 border-b border-slate-800/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
          {isOpen && (
            <span className="text-lg font-black tracking-tight text-white animate-in fade-in duration-500">
              Ziel Luxora CRM
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-2">
        {menuItems.map((item) => {
          const isPendingItem = isPending && optimisticState.path === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={(e) => handleLinkClick(e, item.path)}
              aria-label={`Ir a ${item.label}`}
              className={`cursor-pointer w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all group relative block ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className={isActive(item.path) ? 'text-white' : 'group-hover:scale-110 transition-transform'}>
                {item.icon}
              </div>
              {isOpen && (
                <span className="text-sm font-bold animate-in fade-in slide-in-from-left-2 duration-300 flex-1">
                  {item.label}
                </span>
              )}
              {isPendingItem && (
                <div className={`ml-auto ${!isOpen && 'absolute right-2 top-1/2 -translate-y-1/2'}`}>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800/50 space-y-2">
        <Link 
          to="/configuracion/perfil"
          onClick={(e) => handleLinkClick(e, '/configuracion')}
          aria-label="Abrir Configuración"
          className={`cursor-pointer w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all group relative block ${
            isActive('/configuracion')
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
              : 'hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Settings className={`h-5 w-5 ${isActive('/configuracion') ? '' : 'group-hover:rotate-45'} transition-transform`} />
          {isOpen && <span className="text-sm font-bold flex-1">Configuración</span>}
          {isPending && optimisticState.path === '/configuracion' && (
            <div className={`ml-auto ${!isOpen && 'absolute right-2 top-1/2 -translate-y-1/2'}`}>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </Link>
        <button 
          onClick={handleLogout}
          aria-label="Cerrar Sesión"
          className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition-all group relative cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
          {isOpen && <span className="text-sm font-bold">Cerrar Sesión</span>}
        </button>
      </div>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Contraer menú lateral" : "Expandir menú lateral"}
        className="absolute -right-3 top-24 h-6 w-6 bg-blue-600 text-white rounded-full hidden md:flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-[110] cursor-pointer"
      >
        {isOpen ? <ChevronLeft className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
      </button>
    </aside>

    <UnsavedChangesModal 
      isOpen={isLogoutModalOpen} 
      onClose={() => setIsLogoutModalOpen(false)} 
      onConfirm={() => {
        setIsLogoutModalOpen(false);
        performLogout();
      }}
      isLogout={true}
    />
    </>
  );
};

