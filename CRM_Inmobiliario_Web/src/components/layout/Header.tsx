import { Search, Bell } from 'lucide-react';
import { useTareas } from '@/features/tareas/context/useTareas';
import { usePerfil } from '@/features/auth/api/perfil';
import type { Session } from '@supabase/supabase-js';

interface HeaderProps {
  isAgendaOpen: boolean;
  setIsAgendaOpen: (open: boolean) => void;
  session: Session | null;
}

export const Header = ({ isAgendaOpen, setIsAgendaOpen, session }: HeaderProps) => {
  const { urgentesCount } = useTareas();
  const { perfil } = usePerfil();

  return (
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
        <div className="h-8 w-px bg-slate-200"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-slate-900">
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
