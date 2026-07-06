import { useState, lazy, Suspense, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TareasProvider } from './features/tareas/context/TareasProvider';
import { UploadProvider } from './features/propiedades/context/UploadProvider';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { NetworkStatusListener } from './components/NetworkStatusListener';
import { supabase } from './lib/supabase';
import { LoginForm } from './features/auth/components/LoginForm';
import { OlvideMiClave } from './features/auth/components/OlvideMiClave';
import { ActualizarClave } from './features/auth/components/ActualizarClave';
import { Loader2 } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { api } from './lib/axios';

// Layout Components
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { PageLoader, SidebarLoader } from './components/layout/Loaders';
import { AdminRoute } from './components/layout/AdminRoute';
import { TermsOfServiceWrapper } from './components/layout/TermsOfServiceWrapper';
import { GlobalNavigationGuard } from './components/layout/GlobalNavigationGuard';

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
const AuditoriaGeneralView = lazy(() => import('./features/ia/components/AuditoriaGeneralView').then(m => ({ default: m.AuditoriaGeneralView })));
const ConfiguracionLayout = lazy(() => import('./features/configuracion/components/ConfiguracionLayout'));
const ConfiguracionPerfil = lazy(() => import('./features/auth/components/ConfiguracionPerfil'));
const ConfiguracionIA = lazy(() => import('./features/configuracion/components/ConfiguracionIA').then(m => ({ default: m.ConfiguracionIA })));
const ConfiguracionIntegracionIA = lazy(() => import('./features/configuracion/components/ConfiguracionIntegracionIA').then(m => ({ default: m.ConfiguracionIntegracionIA })));
const ConfiguracionOrganizacion = lazy(() => import('./features/configuracion/components/ConfiguracionOrganizacion').then(m => ({ default: m.ConfiguracionOrganizacion })));
const ConfiguracionAgentes = lazy(() => import('./features/configuracion/components/ConfiguracionAgentes').then(m => ({ default: m.ConfiguracionAgentes })));
const ConfiguracionAgencias = lazy(() => import('./features/configuracion/components/ConfiguracionAgencias').then(m => ({ default: m.ConfiguracionAgencias })));
const ConfiguracionSeguridad = lazy(() => import('./features/configuracion/components/ConfiguracionSeguridad').then(m => ({ default: m.ConfiguracionSeguridad })));
const ConfirmarInvitacion = lazy(() => import('./features/auth/components/ConfirmarInvitacion').then(m => ({ default: m.ConfirmarInvitacion })));
const ConfiguracionNotificaciones = lazy(() => import('./features/configuracion/components/ConfiguracionNotificaciones').then(m => ({ default: m.ConfiguracionNotificaciones })));
const AutoArchivadoSettings = lazy(() => import('./features/configuracion/components/AutoArchivadoSettings').then(m => ({ default: m.AutoArchivadoSettings })));
const ConfiguracionPortabilidad = lazy(() => import('./features/configuracion/components/ConfiguracionPortabilidad').then(m => ({ default: m.ConfiguracionPortabilidad })));
const PoliticaPrivacidadView = lazy(() => import('./features/legal/components/PoliticaPrivacidadView').then(m => ({ default: m.PoliticaPrivacidadView })));
const TerminosServicioView = lazy(() => import('./features/legal/components/TerminosServicioView').then(m => ({ default: m.TerminosServicioView })));

import { CopilotDrawer } from './features/copilot/components/CopilotDrawer';
import { GlobalContactoModal } from './components/layout/GlobalContactoModal';
import { HelpDrawer } from './components/ui/HelpDrawer';

function AppContent({ session }: { session: Session | null }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('crm_sidebar_state');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isAgendaOpen, setIsAgendaOpen] = useState(() => {
    const saved = localStorage.getItem('crm_agenda_state');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const urlTareaId = searchParams.get('tarea');

  useEffect(() => {
    if (urlTareaId) {
      setIsAgendaOpen(true);
    }
  }, [urlTareaId]);

  // Manejar apertura global del panel de nueva tarea
  useEffect(() => {
    const handleOpenCreateTask = () => setIsAgendaOpen(true);
    window.addEventListener('open-agenda-create-task', handleOpenCreateTask);
    return () => window.removeEventListener('open-agenda-create-task', handleOpenCreateTask);
  }, []);

  // Manejar acción 'marcar_completada' desde Notificaciones Push
  useEffect(() => {
    const completeTask = async (id: string) => {
      try {
        await api.patch(`/tareas/${id}/completar`);
        toast.success('Tarea marcada como completada ✅');
        
        // Revalidación proactiva (UPSP) e inmediata para optimismo visual
        import('swr').then(({ mutate }) => {
          mutate('/dashboard/kpis');
          mutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
          
          // Optimistic update local
          mutate('/tareas', (currentTareas: unknown) => {
            if (!Array.isArray(currentTareas)) return currentTareas;
            return currentTareas.map(t => t.id === id ? { ...t, estado: 'Completada' } : t);
          }, { revalidate: true });
        });
      } catch (error) {
        console.error('Error al completar tarea desde SW:', error);
      }
    };

    // 1. Vía Query String (si la app estaba cerrada)
    const searchAction = searchParams.get('action');
    if (searchAction === 'complete' && urlTareaId) {
      // Limpiamos la URL para evitar loop
      window.history.replaceState({}, '', window.location.pathname);
      completeTask(urlTareaId);
    }

    // 2. Vía Mensaje Service Worker (si la app estaba abierta en background)
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'COMPLETE_TASK' && event.data.taskId) {
        completeTask(event.data.taskId);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, [urlTareaId, searchParams]);

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

  const sidebarMargin = isSidebarOpen ? 'md:ml-64' : 'md:ml-20';
  const agendaMargin = isAgendaOpen ? 'md:mr-80' : 'md:mr-0';

  return (
    <div className="flex min-h-[100dvh] bg-slate-50 font-sans antialiased text-slate-900 overflow-x-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 w-full ml-0 ${sidebarMargin} mr-0 ${agendaMargin}`}>
        <Header 
          isAgendaOpen={isAgendaOpen} 
          setIsAgendaOpen={setIsAgendaOpen} 
          session={session} 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <main className="p-3 md:p-8 w-full max-w-full">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/privacidad" element={<PoliticaPrivacidadView />} />
              <Route path="/terminos" element={<TerminosServicioView />} />
              <Route path="/" element={<DashboardPrincipal />} />
              <Route path="/calendario" element={<CalendarioView />} />
              <Route path="/contactos" element={<ContactosList />} />
              <Route path="/contactos/:id" element={<ContactoDetalle />} />
              <Route path="/clientes" element={<ContactosList />} />
              <Route path="/clientes/:id" element={<ContactoDetalle />} />
              <Route path="/propietarios" element={<ContactosList />} />
              <Route path="/propietarios/:id" element={<ContactoDetalle />} />
              <Route path="/propiedades" element={<PropiedadesList />} />
              <Route path="/registros-sistema-ia" element={<Suspense fallback={<PageLoader />}><IaLogsLayout /></Suspense>}>
                <Route index element={<Navigate to="whatsapp" replace />} />
                <Route path="whatsapp" element={<AuditoriaLogsView />} />
                <Route path="personal" element={<Suspense fallback={<PageLoader />}><PersonalLogsView /></Suspense>} />
                <Route path="facebook" element={<AuditoriaLogsView canal="Facebook" />} />
                <Route path="general" element={<Suspense fallback={<PageLoader />}><AuditoriaGeneralView /></Suspense>} />
              </Route>
              <Route path="/kpis" element={<AnaliticaView />} />
              <Route path="/configuracion" element={<Suspense fallback={<PageLoader />}><ConfiguracionLayout /></Suspense>}>
                <Route index element={<Navigate to="perfil" replace />} />
                <Route path="perfil" element={<ConfiguracionPerfil />} />
                <Route path="ia" element={<AdminRoute><ConfiguracionIA /></AdminRoute>} />
                <Route path="integracion-ia" element={<ConfiguracionIntegracionIA />} />
                <Route path="notificaciones" element={<ConfiguracionNotificaciones />} />
                <Route path="organizacion" element={<AdminRoute><ConfiguracionOrganizacion /></AdminRoute>} />
                <Route path="agentes" element={<AdminRoute><ConfiguracionAgentes /></AdminRoute>} />
                <Route path="agencias" element={<AdminRoute><ConfiguracionAgencias /></AdminRoute>} />
                <Route path="seguridad" element={<AdminRoute><ConfiguracionSeguridad /></AdminRoute>} />
                <Route path="auto-archivado" element={<AutoArchivadoSettings />} />
                <Route path="portabilidad" element={<ConfiguracionPortabilidad />} />
              </Route>
              <Route path="/confirmar-clave" element={<Suspense fallback={<PageLoader />}><ConfirmarInvitacion /></Suspense>} />
              {/* Fallback global para usuarios logueados que intentan acceder a una ruta inexistente o vienen del login */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>

      <aside className={`fixed right-0 top-0 h-full w-full lg:w-auto transition-all duration-300 z-[110] ${isAgendaOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <Suspense fallback={<SidebarLoader />}>
          <AgendaPanel onClose={() => setIsAgendaOpen(false)} />
        </Suspense>
      </aside>

      <CopilotDrawer />
      <GlobalContactoModal />
      <HelpDrawer />
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

  const isInviteFlow = initialHash.includes('type=invite');
  const isRecoveryFlow = initialHash.includes('type=recovery') || window.location.pathname === '/actualizar-clave';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!session || isInviteFlow || isRecoveryFlow) {
    return (
      <GlobalErrorBoundary>
        <Routes>
          <Route path="/privacidad" element={<Suspense fallback={<PageLoader />}><PoliticaPrivacidadView /></Suspense>} />
          <Route path="/terminos" element={<Suspense fallback={<PageLoader />}><TerminosServicioView /></Suspense>} />
          <Route path="/olvide-mi-clave" element={<OlvideMiClave />} />
          <Route path="/actualizar-clave" element={<ActualizarClave />} />
          <Route 
            path="*" 
            element={isInviteFlow ? (
              <Suspense fallback={<PageLoader />}>
                <ConfirmarInvitacion />
              </Suspense>
            ) : isRecoveryFlow ? (
              <Navigate to="/actualizar-clave" replace />
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
      <GlobalNavigationGuard />
      <TareasProvider>
        <UploadProvider>
          <TermsOfServiceWrapper>
            <AppContent session={session} />
          </TermsOfServiceWrapper>
        </UploadProvider>
      </TareasProvider>
    </GlobalErrorBoundary>
  );
}

function App() {
  return <MainApp />;
}

export default App;
