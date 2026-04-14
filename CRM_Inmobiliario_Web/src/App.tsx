import { useState, lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { TareasProvider } from './features/tareas/context/TareasProvider';
import { useTareas } from './features/tareas/context/useTareas';
import { UploadProvider } from './features/propiedades/context/UploadProvider';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { NetworkStatusListener } from './components/NetworkStatusListener';
import { supabase } from './lib/supabase';
import { LoginForm } from './features/auth/components/LoginForm';
import { usePerfil } from './features/auth/api/perfil';
import { toast } from 'sonner';
import type { Session } from '@supabase/supabase-js';
import { 
  Users, 
  Home, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Bell,
  Search,
  Loader2,
  LayoutDashboard,
  Calendar
} from 'lucide-react';

// Lazy Loading de Features
const DashboardPrincipal = lazy(() => import('./features/dashboard/components/DashboardPrincipal').then(m => ({ default: m.DashboardPrincipal })));
const CalendarioView = lazy(() => import('./features/calendario/components/CalendarioView'));
const ClientesList = lazy(() => import('./features/clientes/components/ClientesList').then(m => ({ default: m.ClientesList })));
const ClienteDetalle = lazy(() => import('./features/clientes/components/ClienteDetalle').then(m => ({ default: m.ClienteDetalle })));
const PropiedadesList = lazy(() => import('./features/propiedades/components/PropiedadesList').then(m => ({ default: m.PropiedadesList })));
const AnaliticaView = lazy(() => import('./features/analitica/components/AnaliticaView').then(m => ({ default: m.AnaliticaView })));
const AgendaPanel = lazy(() => import('./features/tareas/components/AgendaPanel').then(m => ({ default: m.AgendaPanel })));
const ConfiguracionView = lazy(() => import('./features/configuracion/components/ConfiguracionView'));
const ConfirmarInvitacion = lazy(() => import('./features/auth/components/ConfirmarInvitacion').then(m => ({ default: m.ConfirmarInvitacion })));

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-500">
    <Loader2 className="h-10 w-10 text-blue-700 animate-spin mb-4" />
    <p className="text-sm font-bold text-slate-700 uppercase tracking-widest">Cargando módulo...</p>
  </div>
);

const SidebarLoader = () => (
  <div className="w-80 bg-white border-l border-slate-200 h-full flex items-center justify-center">
    <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
  </div>
);

function AppContent({ session }: { session: Session | null }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('crm_sidebar_state');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isAgendaOpen, setIsAgendaOpen] = useState(() => {
    const saved = localStorage.getItem('crm_agenda_state');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('crm_sidebar_state', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    localStorage.setItem('crm_agenda_state', JSON.stringify(isAgendaOpen));
  }, [isAgendaOpen]);

  const { urgentesCount } = useTareas();
  const { perfil } = usePerfil();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', path: '/', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Inicio' },
    { id: 'calendario', path: '/calendario', icon: <Calendar className="h-5 w-5" />, label: 'Calendario' },
    { id: 'prospectos', path: '/prospectos', icon: <Users className="h-5 w-5" />, label: 'Prospectos' },
    { id: 'propiedades', path: '/propiedades', icon: <Home className="h-5 w-5" />, label: 'Propiedades' },
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
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      {/* Sidebar (Izquierdo) */}
      <aside 
        className={`fixed left-0 top-0 h-full bg-slate-900 text-slate-400 transition-all duration-300 z-[100] shadow-2xl flex flex-col ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="h-20 flex items-center px-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="min-w-[36px] h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-600/20">
              C
            </div>
            {isSidebarOpen && (
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
              className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all group relative cursor-pointer ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className={isActive(item.path) ? 'text-white' : 'group-hover:scale-110 transition-transform'}>
                {item.icon}
              </div>
              {isSidebarOpen && (
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
            className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all group relative cursor-pointer ${
              isActive('/configuracion')
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Settings className={`h-5 w-5 ${isActive('/configuracion') ? '' : 'group-hover:rotate-45'} transition-transform`} />
            {isSidebarOpen && <span className="text-sm font-bold">Configuración</span>}
          </button>
          <button 
            onClick={handleLogout}
            aria-label="Cerrar Sesión"
            className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition-all group relative cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            {isSidebarOpen && <span className="text-sm font-bold">Cerrar Sesión</span>}
          </button>
        </div>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? "Contraer menú lateral" : "Expandir menú lateral"}
          className="absolute -right-3 top-24 h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-[110] cursor-pointer"
        >
          {isSidebarOpen ? <ChevronLeft className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'} ${isAgendaOpen ? 'mr-80' : 'mr-0'}`}>
        {/* Header Superior */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md hidden md:block">
              <label htmlFor="global-search" className="sr-only">Búsqueda global</label>
              <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input 
                id="global-search"
                type="text" 
                placeholder="Búsqueda global..." 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-10 pr-4 text-sm font-medium focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsAgendaOpen(!isAgendaOpen)}
              aria-label={isAgendaOpen ? "Cerrar agenda y notificaciones" : "Abrir agenda y notificaciones"}
              className={`p-2.5 rounded-xl transition-all cursor-pointer relative ${isAgendaOpen ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {urgentesCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center animate-in zoom-in duration-300">
                  <span className="sr-only">Notificaciones urgentes: </span>{urgentesCount}
                </span>
              )}
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900">
                  {perfil ? (
                    (() => {
                      const nombreCompleto = `${perfil.nombre} ${perfil.apellido}`;
                      return nombreCompleto.length > 50 ? perfil.apellido : nombreCompleto;
                    })()
                  ) : (
                    session?.user?.email?.split('@')[0] || 'Agente'
                  )}
                </p>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Agente Activo</p>
              </div>
              <div className="h-10 w-10 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center font-bold text-slate-600 shadow-sm uppercase overflow-hidden">
                {perfil?.fotoUrl ? (
                  <img src={perfil.fotoUrl} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  perfil ? `${perfil.nombre[0]}${perfil.apellido[0]}` : (session?.user?.email?.[0] || 'A')
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8 w-full max-full">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<DashboardPrincipal />} />
              <Route path="/calendario" element={<CalendarioView />} />
              <Route path="/prospectos" element={<ClientesList />} />
              <Route path="/prospectos/:id" element={<ClienteDetalle />} />
              <Route path="/propiedades" element={<PropiedadesList />} />
              <Route path="/kpis" element={<AnaliticaView />} />
              <Route path="/configuracion" element={<Suspense fallback={<PageLoader />}><ConfiguracionView /></Suspense>} />
              <Route path="/confirmar-password" element={<Suspense fallback={<PageLoader />}><ConfirmarInvitacion /></Suspense>} />
            </Routes>
          </Suspense>
        </main>

        <footer className="p-8 border-t border-slate-100 mt-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-600 text-[11px] font-bold uppercase tracking-widest">
            <p>© 2026 CRM Inmobiliario Profesional. v1.1.0-Elite</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-slate-500">
                <div className="h-2 w-2 bg-emerald-600 rounded-full animate-pulse"></div>
                Cloud Systems Active
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* Agenda Sidebar (Derecho) */}
      <aside 
        className={`fixed right-0 top-0 h-full transition-all duration-300 z-50 ${
          isAgendaOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <Suspense fallback={<SidebarLoader />}>
          <AgendaPanel onClose={() => setIsAgendaOpen(false)} />
        </Suspense>
      </aside>
    </div>
  );
}

function MainApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Extraemos el hash inicial antes de que React Router lo manipule
  const [initialHash] = useState(() => window.location.hash);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Verificar si venimos de un link de invitación
  const isInviteFlow = initialHash.includes('type=invite') || initialHash.includes('type=recovery');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Si no hay sesión (o estamos en flujo de invitación), mostramos las rutas públicas
  if (!session || isInviteFlow) {
    return (
      <GlobalErrorBoundary>
        <Routes>
          {/* Si venimos de un invite, mostramos Confirmar, sino Login */}
          <Route 
            path="*" 
            element={isInviteFlow ? (
              <Suspense fallback={<PageLoader />}>
                <ConfirmarInvitacion />
              </Suspense>
            ) : (
              <LoginForm />
            )} 
          />
        </Routes>
      </GlobalErrorBoundary>
    );
  }

  // Si hay sesión y NO es un flujo de invitación, mostramos la app principal
  return (
    <GlobalErrorBoundary>
      <NetworkStatusListener />
      <TareasProvider>
        <UploadProvider>
          <AppContent session={session} />
        </UploadProvider>
      </TareasProvider>
    </GlobalErrorBoundary>
  );
}

function App() {
  return <MainApp />;
}

export default App;
