import { useState, lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TareasProvider } from './features/tareas/context/TareasProvider';
import { UploadProvider } from './features/propiedades/context/UploadProvider';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { NetworkStatusListener } from './components/NetworkStatusListener';
import { supabase } from './lib/supabase';
import { LoginForm } from './features/auth/components/LoginForm';
import { Loader2 } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

// Layout Components
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { PageLoader, SidebarLoader } from './components/layout/Loaders';
import { AdminRoute } from './components/layout/AdminRoute';

// Lazy Loading de Features
const DashboardPrincipal = lazy(() => import('./features/dashboard/components/DashboardPrincipal').then(m => ({ default: m.DashboardPrincipal })));
const CalendarioView = lazy(() => import('./features/calendario/components/CalendarioView'));
const ContactosList = lazy(() => import('./features/contactos/components/ContactosList').then(m => ({ default: m.ContactosList })));
const ContactoDetalle = lazy(() => import('./features/contactos/components/ContactoDetalle').then(m => ({ default: m.ContactoDetalle })));
const PropiedadesList = lazy(() => import('./features/propiedades/components/PropiedadesList').then(m => ({ default: m.PropiedadesList })));
const AnaliticaView = lazy(() => import('./features/analitica/components/AnaliticaView').then(m => ({ default: m.AnaliticaView })));
const AgendaPanel = lazy(() => import('./features/tareas/components/AgendaPanel').then(m => ({ default: m.AgendaPanel })));
const AuditoriaLogsView = lazy(() => import('./features/ia/components/AuditoriaLogsView').then(m => ({ default: m.AuditoriaLogsView })));
const IaLogsLayout = lazy(() => import('./features/ia/components/IaLogsLayout').then(m => ({ default: m.IaLogsLayout })));
const PersonalLogsView = lazy(() => import('./features/ia/components/PersonalLogsView').then(m => ({ default: m.PersonalLogsView })));
const ConfiguracionLayout = lazy(() => import('./features/configuracion/components/ConfiguracionLayout'));
const ConfiguracionPerfil = lazy(() => import('./features/auth/components/ConfiguracionPerfil'));
const ConfiguracionIA = lazy(() => import('./features/configuracion/components/ConfiguracionIA').then(m => ({ default: m.ConfiguracionIA })));
const ConfiguracionIntegracionIA = lazy(() => import('./features/configuracion/components/ConfiguracionIntegracionIA').then(m => ({ default: m.ConfiguracionIntegracionIA })));
const ConfiguracionOrganizacion = lazy(() => import('./features/configuracion/components/ConfiguracionOrganizacion').then(m => ({ default: m.ConfiguracionOrganizacion })));
const ConfiguracionAgentes = lazy(() => import('./features/configuracion/components/ConfiguracionAgentes').then(m => ({ default: m.ConfiguracionAgentes })));
const ConfiguracionAgencias = lazy(() => import('./features/configuracion/components/ConfiguracionAgencias').then(m => ({ default: m.ConfiguracionAgencias })));
const ConfiguracionSeguridad = lazy(() => import('./features/configuracion/components/ConfiguracionSeguridad').then(m => ({ default: m.ConfiguracionSeguridad })));
const ConfirmarInvitacion = lazy(() => import('./features/auth/components/ConfirmarInvitacion').then(m => ({ default: m.ConfirmarInvitacion })));

import { CopilotDrawer } from './features/copilot/components/CopilotDrawer';

function AppContent({ session }: { session: Session | null }) {
  const location = useLocation();
  const navigate = useNavigate();

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

  // Interceptor global de errores de enrutamiento
  useEffect(() => {
    const state = location.state as { authError?: string } | null;
    if (state?.authError) {
      toast.error('Acceso denegado', { 
        id: 'global-auth-error',
        description: state.authError 
      });
      // Limpiamos el state para que no vuelva a saltar si el usuario recarga la página
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'} ${isAgendaOpen ? 'mr-80' : 'mr-0'}`}>
        <Header 
          isAgendaOpen={isAgendaOpen} 
          setIsAgendaOpen={setIsAgendaOpen} 
          session={session} 
        />

        <main className="p-8 w-full max-full">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<DashboardPrincipal />} />
              <Route path="/calendario" element={<CalendarioView />} />
              <Route path="/contactos" element={<ContactosList />} />
              <Route path="/contactos/:id" element={<ContactoDetalle />} />
              <Route path="/clientes" element={<ContactosList />} />
              <Route path="/clientes/:id" element={<ContactoDetalle />} />
              <Route path="/propietarios" element={<ContactosList />} />
              <Route path="/propietarios/:id" element={<ContactoDetalle />} />
              <Route path="/propiedades" element={<PropiedadesList />} />
              <Route path="/ia-logs" element={<Suspense fallback={<PageLoader />}><IaLogsLayout /></Suspense>}>
                <Route index element={<Navigate to="whatsapp" replace />} />
                <Route path="whatsapp" element={<AuditoriaLogsView />} />
                <Route path="personal" element={<Suspense fallback={<PageLoader />}><PersonalLogsView /></Suspense>} />
                <Route path="facebook" element={<Navigate to="whatsapp" replace />} />
                <Route path="general" element={<Navigate to="whatsapp" replace />} />
              </Route>
              <Route path="/kpis" element={<AnaliticaView />} />
              <Route path="/configuracion" element={<Suspense fallback={<PageLoader />}><ConfiguracionLayout /></Suspense>}>
                <Route index element={<Navigate to="perfil" replace />} />
                <Route path="perfil" element={<ConfiguracionPerfil />} />
                <Route path="ia" element={<AdminRoute><ConfiguracionIA /></AdminRoute>} />
                <Route path="integracion-ia" element={<ConfiguracionIntegracionIA />} />
                <Route path="organizacion" element={<AdminRoute><ConfiguracionOrganizacion /></AdminRoute>} />
                <Route path="agentes" element={<AdminRoute><ConfiguracionAgentes /></AdminRoute>} />
                <Route path="agencias" element={<AdminRoute><ConfiguracionAgencias /></AdminRoute>} />
                <Route path="seguridad" element={<AdminRoute><ConfiguracionSeguridad /></AdminRoute>} />
              </Route>
              <Route path="/confirmar-password" element={<Suspense fallback={<PageLoader />}><ConfirmarInvitacion /></Suspense>} />
              {/* Fallback global para usuarios logueados que intentan acceder a una ruta inexistente o vienen del login */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>

      <aside className={`fixed right-0 top-0 h-full transition-all duration-300 z-50 ${isAgendaOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <Suspense fallback={<SidebarLoader />}>
          <AgendaPanel onClose={() => setIsAgendaOpen(false)} />
        </Suspense>
      </aside>

      <CopilotDrawer />
    </div>
  );
}

function MainApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialHash] = useState(() => window.location.hash);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isInviteFlow = initialHash.includes('type=invite') || initialHash.includes('type=recovery');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!session || isInviteFlow) {
    return (
      <GlobalErrorBoundary>
        <Routes>
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
