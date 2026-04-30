import { useLocation, useNavigate } from 'react-router-dom';
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

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', path: '/', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Inicio' },
    { id: 'calendario', path: '/calendario', icon: <Calendar className="h-5 w-5" />, label: 'Calendario' },
    { id: 'prospectos', path: '/prospectos', icon: <Users className="h-5 w-5" />, label: 'Prospectos' },
    { id: 'propiedades', path: '/propiedades', icon: <Home className="h-5 w-5" />, label: 'Propiedades' },
    { id: 'ia-logs', path: '/ia-logs', icon: <Bot className="h-5 w-5" />, label: 'Actividad IA' },
    { id: 'kpis', path: '/kpis', icon: <BarChart3 className="h-5 w-5" />, label: 'Ventas y KPIs' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('crm-swr-cache');
      toast.success('Sesión cerrada correctamente');
    } catch {
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <aside 
      className={`fixed left-0 top-0 h-full bg-slate-900 text-slate-400 transition-all duration-300 z-[100] shadow-2xl flex flex-col ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="h-20 flex items-center px-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="min-w-[36px] h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-600/20">
            C
          </div>
          {isOpen && (
            <span className="text-lg font-black tracking-tight text-white animate-in fade-in duration-500">
              CRM<span className="text-blue-500">Pro</span>
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            aria-label={`Ir a ${item.label}`}
            className={`cursor-pointer w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all group relative ${
              isActive(item.path)
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <div className={isActive(item.path) ? 'text-white' : 'group-hover:scale-110 transition-transform'}>
              {item.icon}
            </div>
            {isOpen && (
              <span className="text-sm font-bold animate-in fade-in slide-in-from-left-2 duration-300">
                {item.label}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-800/50 space-y-2">
        <button 
          onClick={() => navigate('/configuracion')}
          aria-label="Abrir Configuración"
          className={`cursor-pointer w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all group relative ${
            isActive('/configuracion')
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
              : 'hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Settings className={`h-5 w-5 ${isActive('/configuracion') ? '' : 'group-hover:rotate-45'} transition-transform`} />
          {isOpen && <span className="text-sm font-bold">Configuración</span>}
        </button>
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
        className="absolute -right-3 top-24 h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-[110] cursor-pointer"
      >
        {isOpen ? <ChevronLeft className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
      </button>
    </aside>
  );
};
