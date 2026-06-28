import { Search, Bell, Sparkles, Menu } from 'lucide-react';
import { useTareas } from '@/features/tareas/context/useTareas';
import { usePerfil } from '@/features/auth/api/perfil';
import type { Session } from '@supabase/supabase-js';
import { useCopilotStore } from '@/features/copilot/store/useCopilotStore';
import { useSearchParams } from 'react-router-dom';
import { CommandPalette } from '@/features/omnisearch/components/CommandPalette';

interface HeaderProps {
  isAgendaOpen: boolean;
  setIsAgendaOpen: (open: boolean) => void;
  session: Session | null;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export const Header = ({ isAgendaOpen, setIsAgendaOpen, session, isSidebarOpen, setIsSidebarOpen }: HeaderProps) => {
  const { urgentesCount } = useTareas();
  const { perfil } = usePerfil();
  const { toggleOpen, isOpen } = useCopilotStore();
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <header className="h-[calc(5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? "Cerrar menú lateral" : "Abrir menú lateral"}
          className="md:hidden p-2.5 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer touch-manipulation flex-shrink-0"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="relative w-full max-w-md">
          <label htmlFor="global-search" className="sr-only">Búsqueda global</label>
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <button 
            id="global-search"
            onClick={() => window.dispatchEvent(new Event('open-omnisearch'))}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-10 pr-4 text-sm font-medium focus:ring-4 focus:ring-blue-100 transition-all outline-none text-left text-slate-400 cursor-pointer flex justify-between items-center"
          >
            <span>Búsqueda global...</span>
            <kbd className="hidden sm:inline-block bg-white border border-slate-200 rounded px-1.5 py-0.5 font-sans font-medium text-slate-400 text-xs shadow-sm">Ctrl K</kbd>
          </button>
        </div>
      </div>

      <CommandPalette />

      <div className="flex items-center gap-2 md:gap-6 ml-2">
        <button
          onClick={() => {
            toggleOpen();
            if (searchParams.has('convId') || searchParams.has('msgId')) {
              searchParams.delete('convId');
              searchParams.delete('msgId');
              setSearchParams(searchParams, { replace: true });
            }
          }}
          aria-label={isOpen ? "Cerrar Asistente de IA" : "Abrir Asistente de IA"}
          className={`cursor-pointer p-2.5 rounded-xl transition-all relative flex items-center justify-center ${
            isOpen ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
          }`}
        >
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-indigo-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>
        <button 
          onClick={() => setIsAgendaOpen(!isAgendaOpen)}
          aria-label={isAgendaOpen ? "Cerrar agenda y notificaciones" : "Abrir agenda y notificaciones"}
          className={`cursor-pointer p-2.5 rounded-xl transition-all relative ${
            isAgendaOpen ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {urgentesCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center animate-in zoom-in duration-300">
              <span className="sr-only">Notificaciones urgentes: </span>{urgentesCount}
            </span>
          )}
        </button>
        <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-slate-900 truncate">
              {perfil ? (
                (() => {
                  const nombreCompleto = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ');
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
              perfil ? [perfil.nombre?.[0], perfil.apellido?.[0]].filter(Boolean).join('') : (session?.user?.email?.[0] || 'A')
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
